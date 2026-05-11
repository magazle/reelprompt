"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Script, TeleprompterSettings } from "../lib/types";
import { saveSettings } from "../lib/storage";
import { IconTarget } from "./Icons";

interface Props {
  settings: TeleprompterSettings;
  onChange: (s: TeleprompterSettings) => void;
  onClose: () => void;
  script?: Script;
}

// Strip HTML tags → plain text for calibration
function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Preset texts
const PRESETS = {
  it: {
    label: "IT",
    text:
      "Benvenuto su ReelPrompt. Questo breve testo serve a misurare il tuo ritmo naturale di lettura. " +
      "Leggilo ad alta voce alla velocità con cui registreresti normalmente un video. " +
      "Parla in modo chiaro, come se stessi parlando al tuo pubblico. " +
      "Non affrettarti e non rallentare artificialmente. Sii semplicemente te stesso.",
  },
  en: {
    label: "EN",
    text:
      "Welcome to ReelPrompt. This short passage helps measure your natural speaking pace. " +
      "Read it aloud at the speed you would normally record a video. " +
      "Speak clearly, just like you are talking to your audience. " +
      "Do not rush and do not slow down. Just be yourself.",
  },
};

type PresetLang = "it" | "en";
type CalMode    = "preset" | "script";
type CalState   = "idle" | "ready" | "running" | "done";

/* ── small reusable pieces ── */
function Slider({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; display?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)", height: 4, cursor: "pointer" }} />
    </div>
  );
}

function Toggle({ label, sub, value, onChange }: {
  label: string; sub?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 26, borderRadius: 13, border: "none",
        background: value ? "var(--accent)" : "var(--surface-2)",
        position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%", background: "white",
          transition: "left 0.2s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }} />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--text-3)",
      paddingTop: 22, paddingBottom: 10, marginTop: 6,
      borderTop: "1px solid var(--border)",
    }}>{children}</div>
  );
}

/* ── WPM Calibrator ── */
function WPMCalibrator({ currentWpm, script, onCalibrated }: {
  currentWpm: number | null;
  script?: Script;
  onCalibrated: (wpm: number, speed: number) => void;
}) {
  const [state, setState]   = useState<CalState>("idle");
  const [mode, setMode]     = useState<CalMode>("preset");
  const [lang, setLang]     = useState<PresetLang>("it");
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Resolve the active text and word count
  const scriptPlain  = script ? htmlToPlain(script.body) : "";
  const hasScript    = scriptPlain.length > 0;

  const activeText   = mode === "script" && hasScript
    ? scriptPlain
    : PRESETS[lang].text;
  const activeWords  = activeText.trim().split(/\s+/).length;

  const handleStart = useCallback(() => {
    setState("running");
    startRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 200);
  }, []);

  const handleDone = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const seconds = (Date.now() - startRef.current) / 1000;
    if (seconds < 2) return; // guard against accidental double-tap
    const wpm   = Math.round((activeWords / seconds) * 60);
    const speed = parseFloat(
      Math.min(10, Math.max(1, ((wpm - 80) / 160) * 9 + 1)).toFixed(1)
    );
    setState("done");
    onCalibrated(wpm, speed);
  }, [activeWords, onCalibrated]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
    setElapsed(0);
  }, []);

  // ── IDLE / DONE ──
  if (state === "idle" || state === "done") return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: 16, marginTop: 4,
      border: "1px solid var(--border)",
    }}>
      {/* How it works */}
      <div style={{
        background: "var(--bg-2)", borderRadius: 10, padding: "10px 14px",
        marginBottom: 14, border: "1px solid var(--border)",
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>⏱</span>
        <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
          <strong style={{ color: "var(--text-2)" }}>Come funziona:</strong> leggi il testo ad alta voce,
          premi Start quando inizi e Fine quando finisci. L'app misura il tempo e calcola i tuoi WPM —
          nessun microfono utilizzato.
        </p>
      </div>

      {currentWpm && (
        <div style={{
          fontSize: 12, color: "var(--green)", fontFamily: "var(--font-mono)",
          marginBottom: 12, display: "flex", gap: 6, alignItems: "center",
        }}>
          <span>✓</span> Ultima calibrazione: {currentWpm} WPM
        </div>
      )}

      <button className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}
        onClick={() => setState("ready")}>
        <IconTarget /> {currentWpm ? "Ri-calibra" : "Calibra la mia velocità"}
      </button>
    </div>
  );

  // ── READY ──
  if (state === "ready") return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: 16, marginTop: 4,
      border: "1px solid var(--border)",
    }}>

      {/* Mode selector: Preset | Script */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {/* Preset button */}
        <button
          onClick={() => setMode("preset")}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
            background: mode === "preset" ? "var(--accent)" : "var(--surface-2)",
            border: `1px solid ${mode === "preset" ? "var(--accent)" : "var(--border)"}`,
            color: mode === "preset" ? "white" : "var(--text-2)",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
          }}>
          Testo preset
        </button>

        {/* Script button */}
        <button
          onClick={() => hasScript && setMode("script")}
          title={!hasScript ? "Apri uno script per usare questa modalità" : undefined}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 10,
            cursor: hasScript ? "pointer" : "not-allowed",
            background: mode === "script" ? "var(--accent)" : "var(--surface-2)",
            border: `1px solid ${mode === "script" ? "var(--accent)" : "var(--border)"}`,
            color: mode === "script" ? "white" : hasScript ? "var(--text-2)" : "var(--text-3)",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
            opacity: hasScript ? 1 : 0.45,
          }}>
          Il mio script
        </button>
      </div>

      {/* Lang toggle — only shown in preset mode */}
      {mode === "preset" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["it", "en"] as PresetLang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              background: lang === l ? "var(--surface)" : "transparent",
              border: `1px solid ${lang === l ? "var(--accent)" : "var(--border)"}`,
              color: lang === l ? "var(--accent)" : "var(--text-3)",
            }}>
              {PRESETS[l].label}
            </button>
          ))}
        </div>
      )}

      {/* Script mode: no-script warning */}
      {mode === "script" && !hasScript && (
        <div style={{
          background: "var(--bg-2)", borderRadius: 10, padding: "10px 14px",
          marginBottom: 12, border: "1px solid var(--border)",
        }}>
          <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
            Nessuno script attivo. Apri uno script dall'editor per usare questa modalità.
          </p>
        </div>
      )}

      {/* Reminder */}
      <div style={{
        background: "var(--bg-2)", borderRadius: 10, padding: "10px 14px",
        marginBottom: 12, border: "1px solid var(--border)",
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>⏱</span>
        <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
          Premi <strong style={{ color: "var(--text-2)" }}>Start</strong>, leggi il testo ad alta voce
          al tuo ritmo naturale, poi premi <strong style={{ color: "var(--text-2)" }}>Fine</strong>.
          Nessun microfono — è solo un cronometro.
        </p>
      </div>

      {/* Text preview — scrollable if long (script mode) */}
      <div style={{
        maxHeight: mode === "script" ? 180 : "none",
        overflowY: mode === "script" ? "auto" : "visible",
        marginBottom: 16,
      }}>
        <p style={{
          fontSize: mode === "script" ? 14 : 15,
          lineHeight: 1.8, color: "var(--text)",
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          padding: "14px 16px", margin: 0,
          background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)",
          whiteSpace: "pre-wrap",
        }}>
          {activeText}
        </p>
      </div>

      {/* Word count info */}
      <div style={{
        fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)",
        marginBottom: 14, textAlign: "right",
      }}>
        {activeWords} parole
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }} onClick={reset}>
          Annulla
        </button>
        <button className="btn btn-primary" style={{ flex: 2, fontSize: 13 }} onClick={handleStart}>
          ▶ Start
        </button>
      </div>
    </div>
  );

  // ── RUNNING ──
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: 16, marginTop: 4,
      border: "1px solid var(--accent)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{
          fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--text-2)",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <span>⏱</span> Lettura in corso…
        </div>
        <span style={{
          fontSize: 22, fontFamily: "var(--font-mono)", fontWeight: 700,
          color: "var(--text)", letterSpacing: "0.04em",
        }}>
          {elapsed}s
        </span>
      </div>

      {/* Scrollable text during reading */}
      <div style={{
        maxHeight: mode === "script" ? 200 : "none",
        overflowY: mode === "script" ? "auto" : "visible",
        marginBottom: 16,
      }}>
        <p style={{
          fontSize: mode === "script" ? 14 : 15,
          lineHeight: 1.8, color: "var(--text)",
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          padding: "14px 16px", margin: 0,
          background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)",
          whiteSpace: "pre-wrap",
        }}>
          {activeText}
        </p>
      </div>

      <button className="btn btn-primary" style={{ width: "100%", fontSize: 14 }}
        onClick={handleDone}>
        ✓ Fine — ho finito di leggere
      </button>
    </div>
  );
}

/* ── Main SettingsPanel ── */
export default function SettingsPanel({ settings, onChange, onClose, script }: Props) {
  const set = (patch: Partial<TeleprompterSettings>) => onChange({ ...settings, ...patch });

  const handleCalibrated = (wpm: number, speed: number) => {
    const updated = { ...settings, wpm, speed };
    onChange(updated);
    saveSettings(updated);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div
        style={{
          position: "relative", background: "var(--bg-2)", borderRadius: "20px 20px 0 0",
          borderTop: "1px solid var(--border)", padding: "8px 0 40px",
          maxHeight: "85dvh", overflow: "auto", zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-2)" }} />
        </div>

        <div style={{ padding: "0 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24, marginTop: 8 }}>
            Impostazioni Teleprompter
          </h2>

          <Slider label="Velocità Scorrimento" value={settings.speed} min={1} max={10} step={0.5}
            display={`${settings.speed}/10`} onChange={(v) => set({ speed: v })} />

          <SectionLabel>Calibrazione Velocità</SectionLabel>
          <WPMCalibrator currentWpm={settings.wpm} script={script} onCalibrated={handleCalibrated} />

          <SectionLabel>Testo</SectionLabel>
          <Slider label="Dimensione Font" value={settings.fontSize} min={20} max={64} step={2}
            display={`${settings.fontSize}px`} onChange={(v) => set({ fontSize: v })} />
          <Slider label="Interlinea" value={settings.lineSpacing} min={1} max={2.5} step={0.1}
            display={settings.lineSpacing.toFixed(1)} onChange={(v) => set({ lineSpacing: v })} />
          <Slider label="Larghezza Testo" value={settings.textWidth} min={50} max={100} step={5}
            display={`${settings.textWidth}%`} onChange={(v) => set({ textWidth: v })} />

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>Stile Font</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["serif", "sans"] as const).map((f) => (
                <button key={f} onClick={() => set({ fontStyle: f })} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: settings.fontStyle === f ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${settings.fontStyle === f ? "var(--accent)" : "var(--border)"}`,
                  color: settings.fontStyle === f ? "white" : "var(--text-2)",
                  fontSize: 13, fontWeight: 600,
                  fontFamily: f === "serif" ? "var(--font-serif)" : "var(--font-display)",
                }}>
                  {f === "serif" ? "Serif" : "Sans"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>Sfondo Testo</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["none", "band", "full"] as const).map((bg) => (
                <button key={bg} onClick={() => set({ textBackground: bg })} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: settings.textBackground === bg ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${settings.textBackground === bg ? "var(--accent)" : "var(--border)"}`,
                  color: settings.textBackground === bg ? "white" : "var(--text-2)",
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
                }}>
                  {bg === "none" ? "Nessuno" : bg === "band" ? "Banda" : "Pieno"}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.4 }}>
              Banda = striscia scura dietro al testo. Pieno = overlay scuro. Nessuno = solo ombra.
            </p>
          </div>

          <Toggle label="Contorno Testo" sub="Bordo scuro sottile — utile su sfondi chiari"
            value={settings.textStroke} onChange={(v) => set({ textStroke: v })} />

          <SectionLabel>Layout</SectionLabel>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>Posizione Testo</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button key={pos} onClick={() => set({ position: pos })} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: settings.position === pos ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${settings.position === pos ? "var(--accent)" : "var(--border)"}`,
                  color: settings.position === pos ? "white" : "var(--text-2)",
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
                }}>
                  {pos === "top" ? "Alto" : pos === "center" ? "Centro" : "Basso"}
                </button>
              ))}
            </div>
          </div>

          <SectionLabel>Specchio</SectionLabel>
          <Toggle label="Specchia Video" sub="Attivo di default per la fotocamera frontale"
            value={settings.mirrorVideo} onChange={(v) => set({ mirrorVideo: v })} />
          <Toggle label="Specchia Testo" sub="Per uso con vetro teleprompter fisico"
            value={settings.mirrorText} onChange={(v) => set({ mirrorText: v })} />
        </div>
      </div>
    </div>
  );
}
