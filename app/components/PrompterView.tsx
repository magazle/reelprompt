"use client";
import { useEffect } from "react";
import { Script, TeleprompterSettings } from "../lib/types";
import { useTeleprompterScroll } from "../hooks/useTeleprompterScroll";
import { useWakeLock } from "../hooks/useWakeLock";
import { IconPlay, IconPause, IconReset, IconBack } from "./Icons";

// Text-only teleprompter: no camera. Designed to run in a small floating
// window (e.g. Samsung pop-up view) on top of the native camera app.
// Tap the text to play/pause. When paused you can drag the text to reposition.

interface Props {
  script: Script;
  settings: TeleprompterSettings;
  onSettingsChange: (s: TeleprompterSettings) => void;
  onBack: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function PrompterView({ script, settings, onSettingsChange, onBack }: Props) {
  const scroll = useTeleprompterScroll(settings.speed);
  const wake = useWakeLock();

  useEffect(() => {
    wake.acquire();
    return () => { scroll.stop(); wake.release(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<TeleprompterSettings>) => onSettingsChange({ ...settings, ...patch });

  const promptFont = settings.fontStyle === "sans" ? "var(--font-display)" : "var(--font-serif)";

  const ctrlBtn: React.CSSProperties = {
    minWidth: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)", color: "white", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-mono)", fontSize: 13, padding: "0 8px", flexShrink: 0,
  };
  const label: React.CSSProperties = { fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)", minWidth: 26, textAlign: "center" };

  return (
    <div style={{ height: "100dvh", background: "#000", color: "white", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Text */}
      <div
        ref={scroll.containerRef}
        onClick={scroll.toggle}
        className="prompt-fade"
        style={{ flex: 1, overflowY: scroll.isPlaying ? "hidden" : "auto", WebkitOverflowScrolling: "touch", padding: "24px 0", cursor: "pointer" }}
      >
        <div style={{ width: `${settings.textWidth}%`, margin: "0 auto", transform: settings.mirrorText ? "scaleX(-1)" : "none", paddingTop: "30%", paddingBottom: "80%" }}>
          <div
            style={{
              fontSize: settings.fontSize, lineHeight: settings.lineSpacing, color: "white",
              fontFamily: promptFont, fontStyle: settings.fontStyle === "serif" ? "italic" : "normal",
              fontWeight: 400, wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: script.body }}
          />
        </div>
      </div>

      {/* Compact controls — fit in a small floating window */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))", borderTop: "1px solid rgba(255,255,255,0.1)", overflowX: "auto", flexShrink: 0 }}>
        <button style={ctrlBtn} onClick={() => { scroll.stop(); onBack(); }} title="Back"><IconBack /></button>
        <button style={{ ...ctrlBtn, background: "var(--accent)", border: "none" }} onClick={scroll.toggle} title={scroll.isPlaying ? "Pause" : "Play"}>
          {scroll.isPlaying ? <IconPause size={14} /> : <IconPlay size={14} />}
        </button>
        <button style={ctrlBtn} onClick={scroll.reset} title="Restart"><IconReset /></button>

        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)", margin: "0 2px", flexShrink: 0 }} />

        <button style={ctrlBtn} onClick={() => set({ speed: clamp(settings.speed - 1, 1, 10) })} title="Slower">−</button>
        <span style={label}>SPD {settings.speed}</span>
        <button style={ctrlBtn} onClick={() => set({ speed: clamp(settings.speed + 1, 1, 10) })} title="Faster">+</button>

        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)", margin: "0 2px", flexShrink: 0 }} />

        <button style={ctrlBtn} onClick={() => set({ fontSize: clamp(settings.fontSize - 4, 16, 96) })} title="Smaller text">A−</button>
        <button style={ctrlBtn} onClick={() => set({ fontSize: clamp(settings.fontSize + 4, 16, 96) })} title="Bigger text">A+</button>
        <button style={{ ...ctrlBtn, background: settings.mirrorText ? "rgba(22,163,74,0.35)" : ctrlBtn.background }} onClick={() => set({ mirrorText: !settings.mirrorText })} title="Mirror text">⇋</button>
      </div>
    </div>
  );
}
