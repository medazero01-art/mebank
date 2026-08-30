"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Timer() {
  // Configured default duration in seconds (default 1 minute = 60s)
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Custom edit fields
  const [editMinutes, setEditMinutes] = useState(1);
  const [editSeconds, setEditSeconds] = useState(0);

  // Audio Context Ref & Timer refs
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const titleIntervalRef = useRef(null);
  const originalTitleRef = useRef("/me Bank");

  // Play Web Audio synthesized chime / beep
  const playBeepSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Pleasant 2-burst melodic chime (High-urgency roleplay timer alarm)
      const notes = [
        { freq: 880, start: 0, duration: 0.1 },
        { freq: 1174.66, start: 0.12, duration: 0.15 },
        { freq: 1318.51, start: 0.3, duration: 0.2 },
        { freq: 880, start: 0.7, duration: 0.1 },
        { freq: 1174.66, start: 0.82, duration: 0.15 },
        { freq: 1318.51, start: 1.0, duration: 0.35 },
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration + 0.05);
      });
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }, []);

  // Browser Notification Trigger
  const triggerBrowserNotification = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification("⏰ Timer Finished! - /me Bank", {
            body: `Your ${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s roleplay timer is complete.`,
            icon: "/favicon.ico",
            requireInteraction: false,
          });
        } catch (err) {
          console.warn("Notification error:", err);
        }
      }
    }
  }, [totalSeconds]);

  // Request notification permissions when user first interacts with timer
  const requestNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  // Start Flashing document title when timer is finished
  const startTitleFlashing = useCallback(() => {
    if (typeof document === "undefined") return;
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
    originalTitleRef.current = document.title.includes("⏰") ? "/me Bank" : document.title;
    
    let toggle = false;
    titleIntervalRef.current = setInterval(() => {
      document.title = toggle ? "⏰ [00:00] TIME'S UP!" : originalTitleRef.current;
      toggle = !toggle;
    }, 700);
  }, []);

  // Clear Title Flashing
  const clearTitleFlashing = useCallback(() => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    if (typeof document !== "undefined") {
      document.title = "/me Bank";
    }
  }, []);

  // When timer completes
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setRemainingSeconds(0);
    setIsFinished(true);
    playBeepSound();
    triggerBrowserNotification();
    startTitleFlashing();
  }, [playBeepSound, triggerBrowserNotification, startTitleFlashing]);

  // Dismiss finished state
  const handleDismissFinished = () => {
    setIsFinished(false);
    clearTitleFlashing();
    setRemainingSeconds(totalSeconds);
  };

  // Start / Pause toggle
  const togglePlay = () => {
    requestNotificationPermission();

    if (isFinished) {
      handleDismissFinished();
    }

    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      // Start or Resume
      const currentRemaining = remainingSeconds <= 0 ? totalSeconds : remainingSeconds;
      if (remainingSeconds <= 0) {
        setRemainingSeconds(totalSeconds);
      }
      endTimeRef.current = Date.now() + currentRemaining * 1000;
      setIsRunning(true);
      setIsEditing(false);
      setIsSettingsOpen(false);
    }
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemainingSeconds(totalSeconds);
    endTimeRef.current = null;
    setIsFinished(false);
    clearTitleFlashing();
  };

  // Update timer loop with delta check against Date.now() for background tab accuracy
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setRemainingSeconds(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(intervalRef.current);
          handleTimerComplete();
        }
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, handleTimerComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTitleFlashing();
    };
  }, [clearTitleFlashing]);

  // Start direct inline edit mode
  const openEditMode = () => {
    if (isRunning) {
      setIsRunning(false);
    }
    setEditMinutes(Math.floor(totalSeconds / 60));
    setEditSeconds(totalSeconds % 60);
    setIsEditing(true);
    setIsSettingsOpen(false);
  };

  // Save edit values
  const saveEdit = (mins = editMinutes, secs = editSeconds) => {
    const validMins = Math.max(0, Math.min(99, parseInt(mins, 10) || 0));
    const validSecs = Math.max(0, Math.min(59, parseInt(secs, 10) || 0));
    const total = validMins * 60 + validSecs;
    const finalTotal = total > 0 ? total : 60; // minimum 1 second or default 60

    setTotalSeconds(finalTotal);
    setRemainingSeconds(finalTotal);
    if (isRunning) {
      endTimeRef.current = Date.now() + finalTotal * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsEditing(false);
    setIsFinished(false);
    clearTitleFlashing();
  };

  // Preset setter
  const setPreset = (secs) => {
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    if (isRunning) {
      endTimeRef.current = Date.now() + secs * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsEditing(false);
    setIsFinished(false);
    clearTitleFlashing();
  };

  // Add time (+30s, +1m)
  const addTime = (secsToAdd) => {
    setRemainingSeconds((prev) => {
      const next = prev + secsToAdd;
      if (next > totalSeconds) {
        setTotalSeconds(next);
      }
      return next;
    });
    if (isRunning && endTimeRef.current) {
      endTimeRef.current += secsToAdd * 1000;
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Progress percentage (0 to 1)
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = 88 - 88 * progress; // 2 * PI * r (r = 14 -> circumference ~ 88)

  return (
    <div className="relative inline-flex items-center">
      {/* MAIN TIMER PILL */}
      <motion.div
        layout
        className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border backdrop-blur-xl transition-all duration-300 select-none ${
          isFinished
            ? "bg-red-950/70 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse"
            : isRunning
            ? "bg-[#16161A]/90 border-[#F5C518]/50 shadow-[0_0_15px_rgba(245,197,24,0.2)]"
            : "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
        }`}
      >
        {/* CIRCULAR PROGRESS & STATUS ICON */}
        <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 32 32">
            {/* Background Track */}
            <circle
              cx="16"
              cy="16"
              r="13"
              className="stroke-white/10"
              strokeWidth="2.5"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="16"
              cy="16"
              r="13"
              className={`transition-all duration-300 ${
                isFinished
                  ? "stroke-red-400"
                  : isRunning
                  ? "stroke-[#F5C518]"
                  : "stroke-zinc-400"
              }`}
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray="81.68"
              strokeDashoffset={81.68 * (1 - progress)}
              strokeLinecap="round"
            />
          </svg>

          {/* Center mini indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isFinished ? (
              <span className="text-[10px] animate-bounce">🔔</span>
            ) : isRunning ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-ping" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            )}
          </div>
        </div>

        {/* TIME DISPLAY OR INLINE EDIT */}
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
            className="flex items-center gap-1 font-mono text-xs"
          >
            <input
              type="number"
              min="0"
              max="99"
              value={editMinutes.toString().padStart(2, "0")}
              onChange={(e) => setEditMinutes(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-7 bg-black/60 border border-[#F5C518] text-center text-white rounded px-0.5 py-0.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#F5C518]"
              title="Minutes"
            />
            <span className="text-zinc-400 font-bold">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={editSeconds.toString().padStart(2, "0")}
              onChange={(e) => setEditSeconds(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-7 bg-black/60 border border-[#F5C518] text-center text-white rounded px-0.5 py-0.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#F5C518]"
              title="Seconds"
            />
            <button
              type="submit"
              className="px-1.5 py-0.5 ml-0.5 text-[10px] bg-[#F5C518] text-black font-bold rounded hover:bg-[#E0B410] transition-colors"
              title="Save Time"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-1 py-0.5 text-[10px] text-zinc-400 hover:text-white transition-colors"
              title="Cancel"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={openEditMode}
            className={`font-mono text-xs font-bold tracking-wider px-1 py-0.5 rounded transition-all group flex items-center gap-1 ${
              isFinished
                ? "text-red-300 hover:text-white"
                : isRunning
                ? "text-[#F5C518] hover:text-yellow-300"
                : "text-zinc-200 hover:text-white hover:bg-white/5"
            }`}
            title="Click to edit timer duration"
          >
            <span>{formatTime(remainingSeconds)}</span>
            <span className="text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              ✎
            </span>
          </button>
        )}

        {/* QUICK ACTION BUTTONS */}
        <div className="flex items-center gap-1">
          {/* PLAY / PAUSE BUTTON */}
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded-lg border transition-all duration-150 flex items-center justify-center ${
              isFinished
                ? "bg-red-500 text-white border-red-400 hover:bg-red-600 animate-pulse"
                : isRunning
                ? "bg-yellow-500/20 text-[#F5C518] border-[#F5C518]/40 hover:bg-yellow-500/30"
                : "bg-white/5 text-zinc-300 border-white/10 hover:bg-[#F5C518] hover:text-black hover:border-[#F5C518]"
            }`}
            title={isFinished ? "Acknowledge / Restart" : isRunning ? "Pause Timer" : "Start Timer"}
          >
            {isFinished ? (
              <span className="text-[10px] font-mono font-bold px-0.5">OK</span>
            ) : isRunning ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* RESET BUTTON (Visible when not idle or edited) */}
          {(isRunning || remainingSeconds !== totalSeconds || isFinished) && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-zinc-200 transition-colors"
              title="Reset Timer"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>
          )}

          {/* QUICK PRESETS / DROPDOWN TOGGLE */}
          <button
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen);
              if (isEditing) setIsEditing(false);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSettingsOpen
                ? "bg-white/15 text-[#F5C518] border-[#F5C518]/50"
                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-zinc-200"
            }`}
            title="Timer Options & Presets"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* QUICK PRESETS & SETTINGS DROPDOWN */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-56 p-3 rounded-xl glass-panel border border-white/15 shadow-2xl backdrop-blur-2xl text-xs space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Timer Presets
              </span>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets Grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "30s", secs: 30 },
                { label: "1m", secs: 60 },
                { label: "2m", secs: 120 },
                { label: "3m", secs: 180 },
                { label: "5m", secs: 300 },
                { label: "10m", secs: 600 },
                { label: "15m", secs: 900 },
                { label: "20m", secs: 1200 },
              ].map((preset) => (
                <button
                  key={preset.secs}
                  onClick={() => {
                    setPreset(preset.secs);
                    setIsSettingsOpen(false);
                  }}
                  className={`py-1 px-1.5 font-mono text-[11px] rounded border transition-colors ${
                    totalSeconds === preset.secs
                      ? "bg-[#F5C518] text-black font-bold border-[#F5C518]"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Increment / Quick Adjust Buttons */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] text-zinc-500 font-mono mb-1.5">Quick Add:</div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addTime(30)}
                  className="flex-1 py-1 px-2 font-mono text-[10px] font-semibold bg-white/5 border border-white/10 rounded hover:bg-white/10 hover:text-zinc-100 transition-colors"
                >
                  +30s
                </button>
                <button
                  onClick={() => addTime(60)}
                  className="flex-1 py-1 px-2 font-mono text-[10px] font-semibold bg-white/5 border border-white/10 rounded hover:bg-white/10 hover:text-zinc-100 transition-colors"
                >
                  +1 min
                </button>
                <button
                  onClick={() => addTime(120)}
                  className="flex-1 py-1 px-2 font-mono text-[10px] font-semibold bg-white/5 border border-white/10 rounded hover:bg-white/10 hover:text-zinc-100 transition-colors"
                >
                  +2 min
                </button>
              </div>
            </div>

            {/* Custom Input Trigger & Sound Test */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={openEditMode}
                className="text-[10px] font-mono text-[#F5C518] hover:underline flex items-center gap-1"
              >
                <span>✎ Custom Duration</span>
              </button>
              <button
                onClick={playBeepSound}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                title="Test Beep Sound"
              >
                <span>🔊 Test</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FINISHED NOTIFICATION TOAST OVERLAY */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed top-4 right-4 md:right-8 z-50 flex items-center gap-3 p-3.5 rounded-2xl bg-[#1A0A0A]/95 border-2 border-red-500/80 shadow-[0_10px_40px_rgba(239,68,68,0.4)] backdrop-blur-2xl"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-lg flex-shrink-0 animate-bounce">
              ⏰
            </div>
            <div>
              <div className="font-bold text-white text-xs tracking-tight flex items-center gap-1.5">
                <span>Timer Finished!</span>
                <span className="text-[10px] font-mono text-red-400 font-semibold px-1.5 py-0.2 rounded bg-red-500/10 border border-red-500/30">
                  {formatTime(totalSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Your roleplay action timer has ended.
              </p>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => {
                  handleDismissFinished();
                  togglePlay();
                }}
                className="px-2.5 py-1.5 text-[11px] font-mono font-bold bg-[#F5C518] text-black rounded-lg hover:bg-[#E0B410] transition-colors"
              >
                Restart
              </button>
              <button
                onClick={handleDismissFinished}
                className="px-2.5 py-1.5 text-[11px] font-mono font-medium bg-white/10 text-zinc-300 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
