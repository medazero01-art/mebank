"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ATC_PREFIX, buildCalls, contextAirport } from "@/lib/atc/phraseology";
import { DEFAULT_FLIGHT, STORAGE_KEY, newFlight, radarIds, restoreFlight, withPhase } from "@/lib/atc/flight";
import { cardinalAbbr, isOwnAircraft } from "@/lib/atc/radar";
import { radarPatch, radarSuggestions } from "@/lib/atc/radarSync";
import { airspaceAlerts } from "@/lib/atc/airspace";
import { analyzeFeed } from "@/lib/atc/feed";
import { CHART_GEO, calibrateChart, worldToChart } from "@/lib/atc/geo";
import { TAXI, nearestNode, taxiRoute } from "@/lib/atc/taxi";
import { Readout, useCopy } from "@/components/atc/ui";
import { useSaaaBriefing } from "@/components/atc/useSaaaBriefing";
import { useRadar } from "@/components/atc/useRadar";
import FlightSetup from "@/components/atc/FlightSetup";
import Briefing from "@/components/atc/Briefing";
import CallsPanel from "@/components/atc/CallsPanel";
import ReadbackPanel from "@/components/atc/ReadbackPanel";
import EmergencyPanel from "@/components/atc/EmergencyPanel";
import MfdPanel from "@/components/atc/MfdPanel";
import AtcFeed from "@/components/atc/AtcFeed";
import PreflightDialog from "@/components/atc/PreflightDialog";

const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
// A controller message older than this is history, not something to read back now.
const AUTO_READBACK_MAX_AGE_MS = 10 * 60 * 1000;
const CHARTS_KEY = "atc-assistant:charts:v1";
// Set once the preflight is done: the dialog comes back with the next browser session, not on reload.
const PREFLIGHT_KEY = "atc-assistant:preflight-done";
const OUTBOUND_PHASES = ["clearance", "ground", "departure"];

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the value just won't survive a reload.
  }
}

export default function AtcPage() {
  const [flight, setFlight] = useState(DEFAULT_FLIGHT);
  const [chartCal, setChartCal] = useState({});
  const [hydrated, setHydrated] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [preflight, setPreflight] = useState(false);
  const autoReadbackId = useRef(null);
  const { copiedKey, copy } = useCopy();
  const saaa = useSaaaBriefing();

  // Restore after mount (localStorage doesn't exist during server render).
  useEffect(() => {
    setFlight(restoreFlight(readJson(STORAGE_KEY)));
    setChartCal(readJson(CHARTS_KEY) || {});
    let done = false;
    try {
      done = sessionStorage.getItem(PREFLIGHT_KEY) === "1";
    } catch {
      // Session storage blocked: ask every time, it is only one dialog.
    }
    setPreflight(!done);
    setHydrated(true);
  }, []);

  const closePreflight = useCallback(() => {
    try {
      sessionStorage.setItem(PREFLIGHT_KEY, "1");
    } catch {
      // See above.
    }
    setPreflight(false);
  }, []);

  // A fresh flight from the preflight answers. Spots and runways used elsewhere are kept for next time.
  const startFlight = (draft) => {
    const { spot, runway, arrSpot, arrRunway, ...plan } = draft;
    setFlight((f) => {
      const next = newFlight({ ...f, ...plan });
      return {
        ...next,
        spots: { ...f.spots, [plan.arr]: arrSpot || f.spots[plan.arr], [plan.dep]: spot || f.spots[plan.dep] },
        runways: { ...f.runways, [plan.arr]: arrRunway || f.runways[plan.arr], [plan.dep]: runway },
      };
    });
    closePreflight();
  };

  useEffect(() => {
    if (hydrated) writeJson(STORAGE_KEY, flight);
  }, [flight, hydrated]);

  const update = useCallback((patch) => setFlight((f) => ({ ...f, ...patch })), []);
  const setPhase = useCallback((phase) => setFlight((f) => withPhase(f, phase)), []);

  // ---- Charts: built-in calibration, replaced by the pilot's own radar fixes when taken ----
  const geoFor = useCallback((icao) => chartCal[icao] || CHART_GEO[icao], [chartCal]);
  const onCalibrate = (icao, fixes) => {
    const geo = calibrateChart(CHART_GEO[icao], fixes);
    if (!geo) return;
    const next = { ...chartCal, [icao]: geo };
    setChartCal(next);
    writeJson(CHARTS_KEY, next);
  };
  const onResetCalibration = (icao) => {
    const next = { ...chartCal };
    delete next[icao];
    setChartCal(next);
    writeJson(CHARTS_KEY, next);
  };

  // ---- Radar ----
  const { registration, callsign } = flight;
  const ids = useMemo(() => radarIds({ registration, callsign }), [registration, callsign]);
  const radar = useRadar({ enabled: hydrated && flight.radarOn, ids });
  const aircraft = radar.snapshot?.aircraft;
  const own = useMemo(() => aircraft?.find((a) => isOwnAircraft(a, ids)) || null, [aircraft, ids]);

  // Altitude, place, heading and inbound direction follow the radar while auto-fill is on.
  useEffect(() => {
    if (!own || !flight.radarSync) return;
    setFlight((f) => {
      const patch = radarPatch(f, own);
      return patch ? { ...f, ...patch } : f;
    });
  }, [own, flight.radarSync, flight.phase, flight.arr]);

  const feed = useMemo(() => (radar.snapshot ? analyzeFeed(radar.snapshot.atc, ids) : null), [radar.snapshot, ids]);

  // A new controller message for us lands in the readback panel by itself.
  const latestForMe = feed?.latestForMe;
  useEffect(() => {
    if (!latestForMe || latestForMe.id === autoReadbackId.current) return;
    autoReadbackId.current = latestForMe.id;
    if (Date.now() - Date.parse(latestForMe.timestamp) < AUTO_READBACK_MAX_AGE_MS) setIncoming(latestForMe);
  }, [latestForMe]);

  const alerts = useMemo(() => airspaceAlerts(own, saaa.data?.notams), [own, saaa.data]);
  const suggestions = useMemo(() => radarSuggestions(flight, own), [flight, own]);

  // ---- Taxi route from the airport diagram ----
  const outbound = OUTBOUND_PHASES.includes(flight.phase);
  const routeIcao = outbound ? flight.dep : flight.phase === "taxiin" ? flight.arr : null;
  const route = useMemo(() => {
    if (!routeIcao || !TAXI[routeIcao]) return null;
    // With a calibrated chart, start from where the radar actually sees us on the ground.
    let startNode;
    if (own && !own.airborne && own.atAirport?.icao === routeIcao && chartCal[routeIcao]) {
      startNode = nearestNode(TAXI[routeIcao], worldToChart(chartCal[routeIcao], own));
    }
    return taxiRoute({
      icao: routeIcao,
      spot: flight.spots[routeIcao],
      runway: flight.runways[routeIcao],
      direction: outbound ? "out" : "in",
      startNode,
    });
  }, [routeIcao, outbound, flight.spots, flight.runways, own, chartCal]);

  useEffect(() => {
    if (!flight.autoRoute || !route) return;
    setFlight((f) => {
      const sameVia = f.via.join("|") === route.via.join("|");
      const hold = route.hold ?? f.hold;
      return sameVia && f.hold === hold ? f : { ...f, via: route.via, hold };
    });
  }, [route, flight.autoRoute, flight.phase]);

  // ---- Calls ----
  const calls = useMemo(() => buildCalls(flight), [flight]);

  const copyCall = useCallback(
    (call) => {
      copy(call.channel === "atc" ? `${ATC_PREFIX}${call.text}` : call.text, `call-${call.id}`);
      if (flight.autoAdvance && call.next) setPhase(call.next);
    },
    [copy, flight.autoAdvance, setPhase]
  );

  // Number keys copy the matching call when no field is focused.
  useEffect(() => {
    const onKey = (e) => {
      if (emergency || preflight || isTyping(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (!n) return;
      const call = calls[n - 1];
      if (call?.text) {
        e.preventDefault();
        copyCall(call);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calls, copyCall, emergency, preflight]);

  const pickRunway = (icao, rwy) => update({ runways: { ...flight.runways, [icao]: rwy } });

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-av-bg text-av-text"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% -20%, rgba(61,220,245,0.07), transparent 60%), linear-gradient(rgba(61,220,245,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(61,220,245,0.025) 1px, transparent 1px)",
        backgroundSize: "auto, 32px 32px, 32px 32px",
      }}
    >
      <header className="relative z-10 flex flex-wrap items-center gap-3 border-b border-av-bezel bg-black/60 px-4 py-2 backdrop-blur">
        <Link href="/" className="font-avmono text-[10px] uppercase tracking-widest text-av-mute hover:text-av-cyan">
          ◂ /me Bank
        </Link>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-av-cyan" fill="currentColor" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
          </svg>
          <div className="leading-none">
            <div className="font-avmono text-sm font-bold tracking-[0.25em] text-av-text">ATC</div>
            <div className="font-avmono text-[9px] tracking-[0.3em] text-av-mute">ASSISTANT</div>
          </div>
        </div>

        <div className="flex items-stretch overflow-hidden rounded border border-av-line" role="group" aria-label="COM frequency">
          <span className="flex items-center bg-av-panel2 px-2 font-avmono text-[9px] font-bold tracking-widest text-av-mute">COM1</span>
          {[
            { value: "CTAF", label: "CTAF", sub: "122.800 · ATC OFF" },
            { value: "CENTER", label: "SA CENTER", sub: "ATC ONLINE" },
          ].map((m) => {
            const active = flight.mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => update({ mode: m.value })}
                className={`px-3 py-1 text-left font-avmono transition-colors ${active ? "bg-av-green/15 text-av-green" : "bg-black/40 text-av-mute hover:text-av-text"}`}
              >
                <div className="text-[12px] font-bold leading-tight">{m.label}</div>
                <div className="text-[8px] tracking-widest">{m.sub}</div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <Readout label="ALT" value={own ? own.altFt.toLocaleString("en-US") : "----"} unit="FT" dim={!own} />
          <Readout label="HDG" value={own ? String(own.heading).padStart(3, "0") : "---"} unit={own ? cardinalAbbr(own.heading) : "°"} tone="text-av-magenta" dim={!own} />
          <Readout label="GS" value={own?.speedKt != null ? Math.round(own.speedKt) : "---"} unit="KT" dim={!own} />
          <div className={`hidden min-w-[140px] max-w-[220px] rounded border border-av-line bg-black/60 px-2 py-1 lg:block ${own ? "" : "opacity-40"}`}>
            <div className="font-avmono text-[9px] font-bold uppercase tracking-[0.16em] text-av-mute">POS</div>
            <div className="truncate font-avmono text-[12px] font-bold leading-tight text-av-cyan">{own ? own.place : "NO RADAR FIX"}</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-avmono text-[11px] text-av-dim xl:inline">
            <span className="text-av-cyan">{flight.callsign || "[CALLSIGN]"}</span> · {flight.dep} ▸ {flight.arr} · {flight.rules}
          </span>
          {[
            { kind: "pan", label: "PAN-PAN", cls: "border-av-amber text-av-amber hover:bg-av-amber/20" },
            { kind: "mayday", label: "MAYDAY", cls: "border-av-red text-av-red hover:bg-av-red/20" },
          ].map((b) => (
            <button
              key={b.kind}
              type="button"
              onClick={() => setEmergency(b.kind)}
              className={`rounded border-2 px-3 py-1.5 font-avmono text-[11px] font-bold tracking-widest transition-colors ${b.cls}`}
              style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,0.04) 6px 12px)" }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-3 xl:overflow-hidden">
        <div className="grid grid-cols-1 gap-3 xl:h-full xl:grid-cols-[330px_minmax(0,1fr)_minmax(400px,500px)]">
          <div className="space-y-3 xl:overflow-y-auto xl:pr-1">
            <FlightSetup key={hydrated ? "restored" : "initial"} flight={flight} update={update} onNewFlight={() => setFlight(newFlight(flight))} />
            <Briefing flight={flight} saaa={saaa} onUseRunway={pickRunway} />
            <AtcFeed feed={feed} flight={flight} update={update} onUseForReadback={(m) => setIncoming({ ...m })} />
          </div>

          <div className="xl:overflow-y-auto xl:pr-1">
            <CallsPanel
              flight={flight}
              update={update}
              setPhase={setPhase}
              calls={calls}
              copiedKey={copiedKey}
              onCopyCall={copyCall}
              saaaData={saaa.data}
              route={route}
              alerts={alerts}
              suggestions={suggestions}
              radarSynced={Boolean(own && flight.radarSync)}
              readback={<ReadbackPanel flight={flight} copiedKey={copiedKey} copy={copy} incoming={incoming} />}
            />
          </div>

          <div className="xl:overflow-y-auto xl:pr-1">
            <MfdPanel
              flight={flight}
              update={update}
              radar={radar}
              own={own}
              route={route}
              contextIcao={contextAirport(flight)}
              geoFor={geoFor}
              calibrated={chartCal}
              onCalibrate={onCalibrate}
              onResetCalibration={onResetCalibration}
              saaaData={saaa.data}
            />
          </div>
        </div>
      </main>

      {hydrated && preflight && <PreflightDialog flight={flight} saaaData={saaa.data} onStart={startFlight} onResume={closePreflight} />}
      {emergency && (
        <EmergencyPanel key={emergency} kind={emergency} flight={flight} update={update} copiedKey={copiedKey} copy={copy} onClose={() => setEmergency(null)} />
      )}
    </div>
  );
}
