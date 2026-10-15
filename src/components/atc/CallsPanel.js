"use client";

import { useState } from "react";
import { AIRPORTS, ALTITUDES, DIRECTIONS, LANDMARKS } from "@/lib/atc/airports";
import { closedRunwayEnds, recommendedRunway, weatherFor } from "@/lib/atc/briefing";
import { ATC_PREFIX, CHAT_LIMIT, LANDING_TYPES, PHASES, contextAirport, formatAltitude, formatVia } from "@/lib/atc/phraseology";
import { ChipGroup, FieldLabel, Panel, TextInput, softkeyClass } from "./ui";

// Which settings each phase needs, in display order.
const CONTROLS = {
  CTAF: {
    clearance: [],
    ground: ["calling", "spot", "face", "runway", "taxiroute", "via"],
    departure: ["calling", "runway", "dir", "target", "pattern"],
    enroute: ["calling", "landmark", "alt", "target", "dir"],
    arrival: ["calling", "from", "landmark", "alt", "target", "runway", "pattern"],
    pattern: ["calling", "runway", "pattern", "final", "landing", "dir", "target"],
    taxiin: ["calling", "runway", "spot", "taxiroute", "via"],
  },
  CENTER: {
    clearance: ["spot", "target", "route"],
    ground: ["spot", "runway", "taxiroute"],
    departure: ["runway", "hold"],
    enroute: ["landmark", "alt", "target"],
    arrival: ["from", "landmark", "alt"],
    pattern: ["runway", "final", "landing"],
    taxiin: ["runway", "spot", "taxiroute", "via"],
  },
};

const inputClass =
  "rounded border border-av-line bg-black/50 px-2 py-1.5 font-avmono text-xs text-av-cyan placeholder-av-mute focus:outline-none focus:border-av-cyan";

function AltitudeControl({ label, value, onChange }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-1">
        <ChipGroup options={ALTITUDES.map((a) => ({ value: a, label: a.toLocaleString("en-US") }))} value={Number(value)} onChange={onChange} size="sm" />
        <input
          type="number"
          step={100}
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          aria-label={`${label} (custom)`}
          className={`w-20 ${inputClass}`}
        />
      </div>
    </div>
  );
}

function LandmarkControl({ value, onChange }) {
  return (
    <div>
      <FieldLabel>Over / passing</FieldLabel>
      <div className="flex gap-1 mb-1">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type a place or pick one" className={`flex-1 text-sm ${inputClass}`} />
        {value && (
          <button type="button" onClick={() => onChange("")} className={`px-2.5 text-[10px] uppercase ${softkeyClass(false)}`}>
            Clear
          </button>
        )}
      </div>
      <div className="max-h-24 overflow-y-auto pr-1">
        <ChipGroup size="sm" options={LANDMARKS.map((l) => ({ value: l, label: l }))} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function ViaControl({ airport, value, onChange }) {
  const [custom, setCustom] = useState("");
  const add = (token) => token && onChange([...value, token]);

  return (
    <div>
      <FieldLabel>
        Taxi via {value.length > 0 && <span className="normal-case text-av-magenta">{formatVia(value)}</span>}
      </FieldLabel>
      <div className="flex flex-wrap items-center gap-1">
        {airport.taxiways.map((t) => (
          <button key={t} type="button" onClick={() => add(t)} className={`px-2.5 py-1 text-[11px] ${softkeyClass(false)}`}>
            {t}
          </button>
        ))}
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              add(custom.trim());
              setCustom("");
            }
          }}
          placeholder="C1 ⏎"
          aria-label="Add taxiway"
          className={`w-16 ${inputClass}`}
        />
        {value.length > 0 && (
          <>
            <button type="button" onClick={() => onChange(value.slice(0, -1))} className={`px-2 py-1 text-[10px] uppercase ${softkeyClass(false)}`}>
              Undo
            </button>
            <button type="button" onClick={() => onChange([])} className={`px-2 py-1 text-[10px] uppercase ${softkeyClass(false)}`}>
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SpotControl({ airport, value, onChange }) {
  return (
    <div>
      <ChipGroup label={`Position at ${airport.shortName}`} size="sm" options={airport.spots.map((s) => ({ value: s, label: s }))} value={value} onChange={onChange} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or type it (Gate 8…)" aria-label="Custom position" className={`mt-1 w-full ${inputClass}`} />
    </div>
  );
}

function RouteControl({ flight, update, route }) {
  return (
    <div className="rounded border border-av-magenta/40 bg-av-magenta/5 p-2">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>Taxi route from the diagram</FieldLabel>
        <ChipGroup
          size="sm"
          tone="magenta"
          options={[
            { value: true, label: "Auto" },
            { value: false, label: "Manual" },
          ]}
          value={flight.autoRoute}
          onChange={(autoRoute) => update({ autoRoute })}
        />
      </div>
      {route ? (
        <div className="font-avmono text-[12px] text-av-magenta">
          {route.via.length ? `via ${formatVia(route.via)}` : "No taxiway needed"}
          {route.hold && <span className="text-av-dim"> · hold short of {route.hold}</span>}
          {!flight.autoRoute && (
            <button type="button" onClick={() => update({ via: route.via, hold: route.hold || "" })} className={`ml-2 px-2 py-0.5 text-[10px] uppercase ${softkeyClass(false, "magenta")}`}>
              Use
            </button>
          )}
        </div>
      ) : (
        <div className="font-avmono text-[11px] text-av-mute">No route: pick a listed parking spot (or this airport has no taxiway diagram).</div>
      )}
    </div>
  );
}

function Controls({ flight, update, saaaData, route }) {
  const icao = contextAirport(flight);
  const airport = AIRPORTS[icao];
  const closed = closedRunwayEnds(saaaData?.notams, airport);
  const best = recommendedRunway(airport, weatherFor(airport, saaaData?.weather), closed);

  const renderers = {
    calling: () => (
      <ChipGroup
        label="Calling"
        size="sm"
        options={[
          ...Object.values(AIRPORTS).map((a) => ({ value: a.icao, label: `${a.traffic} Traffic` })),
          { value: "SA", label: "San Andreas Traffic" },
        ]}
        value={flight.calling}
        onChange={(calling) => update({ calling })}
      />
    ),
    runway: () => (
      <ChipGroup
        label={`Runway at ${airport.shortName}`}
        options={airport.runwayEnds.map((end) => ({
          value: end.id,
          label: end.id,
          disabled: closed.includes(end.id),
          badge: end.id === best ? "★" : closed.includes(end.id) ? "CLSD" : null,
        }))}
        value={flight.runways[icao]}
        onChange={(rwy) => update({ runways: { ...flight.runways, [icao]: rwy } })}
      />
    ),
    spot: () => <SpotControl airport={airport} value={flight.spots[icao] || ""} onChange={(spot) => update({ spots: { ...flight.spots, [icao]: spot } })} />,
    taxiroute: () => <RouteControl flight={flight} update={update} route={route} />,
    via: () => <ViaControl airport={airport} value={flight.via} onChange={(via) => update({ via })} />,
    hold: () => <TextInput label="Holding short of" value={flight.hold} onChange={(hold) => update({ hold })} placeholder="C1 (optional)" />,
    face: () => <ChipGroup label="Pushback, facing" options={DIRECTIONS} value={flight.face} onChange={(face) => update({ face })} />,
    dir: () => <ChipGroup label="Heading to the" options={DIRECTIONS} value={flight.dir} onChange={(dir) => update({ dir })} />,
    from: () => <ChipGroup label="Inbound from the" options={DIRECTIONS} value={flight.from} onChange={(from) => update({ from })} />,
    landmark: () => <LandmarkControl value={flight.landmark} onChange={(landmark) => update({ landmark })} />,
    alt: () => <AltitudeControl label="Current altitude" value={flight.alt} onChange={(alt) => update({ alt })} />,
    target: () => <AltitudeControl label="Target altitude" value={flight.target} onChange={(target) => update({ target })} />,
    pattern: () => (
      <ChipGroup
        label="Traffic pattern"
        options={[
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ]}
        value={flight.pattern}
        onChange={(pattern) => update({ pattern })}
      />
    ),
    final: () => (
      <ChipGroup
        label="Final call"
        options={[
          { value: "On final", label: "On final" },
          { value: "Turning final", label: "Turning final" },
        ]}
        value={flight.finalVerb}
        onChange={(finalVerb) => update({ finalVerb })}
      />
    ),
    landing: () => <ChipGroup label="Landing" options={LANDING_TYPES} value={flight.landing} onChange={(landing) => update({ landing })} />,
    route: () =>
      flight.rules === "IFR" ? (
        <TextInput label="Route (flight plan)" value={flight.route} onChange={(route) => update({ route: route.toUpperCase() })} placeholder="DOCKS1 DOCKS FIZEL ELBUR…" />
      ) : null,
  };

  const keys = CONTROLS[flight.mode][flight.phase];
  if (keys.length === 0) {
    return <div className="font-avmono text-[11px] text-av-mute">No clearance on CTAF. Switch COM to CENTER if a controller is online.</div>;
  }
  return <div className="space-y-3">{keys.map((key) => <div key={key}>{renderers[key]()}</div>)}</div>;
}

function CallCard({ call, index, copied, onCopy }) {
  const full = call.text ? (call.channel === "atc" ? ATC_PREFIX : "") + call.text : "";
  const length = full.length;
  const tooLong = length > CHAT_LIMIT;

  if (!call.text) {
    return (
      <div className="rounded border border-dashed border-av-line px-3 py-2 font-avmono text-[11px] text-av-mute">
        <span className="text-av-dim">{call.label}</span> · {call.hint}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`group w-full rounded border text-left transition-colors duration-100 ${
        copied ? "border-av-green bg-av-green/10" : "border-av-line bg-black/40 hover:border-av-cyan hover:bg-av-cyan/5"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-av-line/70 px-3 py-1">
        <div className="flex items-center gap-2 font-avmono text-[10px] uppercase tracking-wider">
          {index < 9 && <kbd className="rounded border border-av-line bg-av-panel2 px-1.5 text-av-cyan">{index + 1}</kbd>}
          <span className="font-bold text-av-dim">{call.label}</span>
          {call.channel === "pm" && <span className="rounded bg-av-amber/20 px-1 text-av-amber">PM</span>}
        </div>
        <div className="flex items-center gap-2 font-avmono text-[10px]">
          <span className={tooLong ? "font-bold text-av-red" : "text-av-mute"}>
            {length}/{CHAT_LIMIT}
          </span>
          <span className={`rounded border px-2 py-0.5 font-bold ${copied ? "border-av-green text-av-green" : "border-av-line text-av-dim group-hover:border-av-cyan group-hover:text-av-cyan"}`}>
            {copied ? "COPIED ✓" : "COPY"}
          </span>
        </div>
      </div>
      <div className="px-3 py-2 font-avmono text-[13px] leading-relaxed text-av-cyan break-words">{full}</div>
      {tooLong && <div className="px-3 pb-2 text-[11px] text-av-red">Over the 300 character chat limit: shorten the position or split the call.</div>}
    </button>
  );
}

function RadarHints({ alerts, suggestions, setPhase }) {
  if (alerts.length === 0 && suggestions.length === 0) return null;
  return (
    <div className="space-y-1">
      {alerts.map((a) => (
        <div
          key={a.text}
          role="alert"
          className={`rounded border-l-4 px-3 py-1.5 font-avmono text-[12px] font-bold ${
            a.level === "danger" ? "border-av-red bg-av-red/15 text-av-red animate-pulse" : "border-av-amber bg-av-amber/10 text-av-amber"
          }`}
        >
          {a.level === "danger" ? "WARNING · " : "CAUTION · "}
          {a.text}
        </div>
      ))}
      {suggestions.map((s) => (
        <button
          key={s.phase}
          type="button"
          onClick={() => setPhase(s.phase)}
          className="w-full rounded border border-av-green/50 bg-av-green/10 px-3 py-1.5 text-left font-avmono text-[12px] text-av-green hover:bg-av-green/20"
        >
          📡 {s.text} <span className="font-bold underline">GO</span>
        </button>
      ))}
    </div>
  );
}

export default function CallsPanel({ flight, update, setPhase, calls, copiedKey, onCopyCall, saaaData, route, alerts = [], suggestions = [], radarSynced, readback }) {
  const activeIndex = PHASES.findIndex((p) => p.id === flight.phase);
  return (
    <div className="space-y-3">
      <RadarHints alerts={alerts} suggestions={suggestions} setPhase={setPhase} />

      <Panel title="Flight phase" bodyClassName="p-2">
        <nav className="flex flex-wrap items-center gap-1" aria-label="Flight phase">
          {PHASES.map((p, i) => {
            const active = i === activeIndex;
            const done = i < activeIndex;
            return (
              <div key={p.id} className="flex items-center gap-1">
                {i > 0 && <span className={`font-avmono text-[10px] ${done || active ? "text-av-magenta" : "text-av-mute"}`}>▸</span>}
                <button
                  type="button"
                  onClick={() => setPhase(p.id)}
                  className={`px-3 py-1.5 text-[11px] uppercase tracking-wider ${
                    active ? softkeyClass(true, "magenta") : done ? `${softkeyClass(false)} !text-av-green/70` : softkeyClass(false)
                  }`}
                >
                  {done && "✓ "}
                  {p.label}
                </button>
              </div>
            );
          })}
        </nav>
      </Panel>

      <Panel
        title={`COM · ${flight.mode === "CENTER" ? "San Andreas Center" : "CTAF 122.800"}`}
        action={<span className="font-avmono text-[9px] text-av-mute">CLICK OR PRESS 1-9 TO COPY</span>}
      >
        <div className="space-y-2">
          {calls.length === 0 && <div className="font-avmono text-[11px] text-av-mute">Nothing to call in this phase.</div>}
          {calls.map((call, i) => (
            <CallCard key={call.id} call={call} index={i} copied={copiedKey === `call-${call.id}`} onCopy={() => onCopyCall(call)} />
          ))}
        </div>
        <div className="mt-2 font-avmono text-[9px] text-av-mute">
          ALT {formatAltitude(flight.alt)} · TGT {formatAltitude(flight.target)}
        </div>
      </Panel>

      {readback}

      <Panel title="Phase settings">
        {radarSynced && (
          <div className="mb-2 font-avmono text-[10px] text-av-green">
            📡 Altitude, position, heading and inbound direction follow the radar (turn auto-fill off in the MFD to edit them).
          </div>
        )}
        <Controls flight={flight} update={update} saaaData={saaaData} route={route} />
      </Panel>
    </div>
  );
}
