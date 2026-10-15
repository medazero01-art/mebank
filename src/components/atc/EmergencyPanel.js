"use client";

import { useEffect, useState } from "react";
import { AIRPORTS, LANDMARKS } from "@/lib/atc/airports";
import { ATC_PREFIX, CHAT_LIMIT, MAYDAY_SITUATIONS, PAN_SITUATIONS, buildEmergency, formatAltitude } from "@/lib/atc/phraseology";
import { ChipGroup, TextInput, softkeyClass } from "./ui";

export default function EmergencyPanel({ kind, flight, update, copiedKey, copy, onClose }) {
  const isMayday = kind === "mayday";
  const situations = isMayday ? MAYDAY_SITUATIONS : PAN_SITUATIONS;
  const [situation, setSituation] = useState(situations[0]);
  const [action, setAction] = useState(isMayday ? "land-runway" : flight.mode === "CENTER" ? "vectors" : "join-downwind");
  const [site, setSite] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const actions = [
    { value: "land-runway", label: "Land on the runway" },
    { value: "land-site", label: "Land on…" },
    { value: "return-dep", label: `Return to ${AIRPORTS[flight.dep].shortName}` },
    { value: "join-downwind", label: "Join downwind" },
    ...(flight.mode === "CENTER" ? [{ value: "vectors", label: "Priority vectors" }] : []),
  ];

  const full = `${ATC_PREFIX}${buildEmergency(flight, { kind, situation, action, site })}`;
  const accent = isMayday ? "border-av-red text-av-red" : "border-av-amber text-av-amber";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label={isMayday ? "Mayday" : "Pan-Pan"}
        onClick={(e) => e.stopPropagation()}
        className={`my-8 w-full max-w-2xl rounded-md border-2 bg-av-panel shadow-2xl ${accent}`}
      >
        <div
          className={`flex items-center justify-between px-4 py-2 ${isMayday ? "bg-av-red/15" : "bg-av-amber/10"}`}
          style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.25) 14px 28px)" }}
        >
          <h2 className="font-avmono text-xl font-bold tracking-[0.3em]">{isMayday ? "MAYDAY" : "PAN-PAN"}</h2>
          <button type="button" onClick={onClose} className={`px-3 py-1 text-[10px] uppercase ${softkeyClass(false)}`}>
            Close · Esc
          </button>
        </div>

        <div className="space-y-3 p-4">
          <button
            type="button"
            onClick={() => copy(full, "emergency")}
            className={`w-full rounded border-2 text-left transition-colors ${copiedKey === "emergency" ? "border-av-green bg-av-green/10" : "border-av-line bg-black/50 hover:border-av-cyan"}`}
          >
            <div className="flex justify-between border-b border-av-line/70 px-3 py-1 font-avmono text-[10px] uppercase">
              <span className="text-av-mute">
                {full.length}/{CHAT_LIMIT}
              </span>
              <span className={copiedKey === "emergency" ? "font-bold text-av-green" : "font-bold text-av-cyan"}>{copiedKey === "emergency" ? "COPIED ✓" : "CLICK TO COPY"}</span>
            </div>
            <div className="px-3 py-2.5 font-avmono text-sm text-av-cyan break-words">{full}</div>
          </button>

          <ChipGroup label="Situation" options={situations.map((s) => ({ value: s, label: s }))} value={situation} onChange={setSituation} tone="magenta" />
          <ChipGroup label="Action" options={actions} value={action} onChange={setAction} tone="magenta" />
          {action === "land-site" && <TextInput label="Landing site" value={site} onChange={setSite} placeholder="Senora Freeway, the beach…" autoFocus />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput label="Passing" value={flight.landmark} onChange={(landmark) => update({ landmark })} placeholder="Paleto Bay" list="atc-landmarks" />
            <TextInput
              label={`Altitude (${formatAltitude(flight.alt)})`}
              type="number"
              step={100}
              value={flight.alt}
              onChange={(alt) => update({ alt: Number(alt) || 0 })}
            />
          </div>
          <datalist id="atc-landmarks">
            {LANDMARKS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>

          {flight.mode === "CTAF" && (
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
          )}

          <p className="font-avmono text-[10px] uppercase tracking-wider text-av-mute">Aviate · Navigate · Communicate. A short call is fine if you have no time to type.</p>
        </div>
      </div>
    </div>
  );
}
