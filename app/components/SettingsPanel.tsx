"use client";
import { TeleprompterSettings } from "../lib/types";

interface Props {
  settings: TeleprompterSettings;
  onChange: (s: TeleprompterSettings) => void;
  onClose: () => void;
}

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

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  const set = (patch: Partial<TeleprompterSettings>) => onChange({ ...settings, ...patch });

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
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, marginTop: 8 }}>Settings</h2>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.4 }}>
            Settings are saved automatically as your default.
          </p>

          {/* ── SCROLL ── */}
          <Slider label="Scroll Speed" value={settings.speed} min={1} max={10} step={0.5}
            display={`${settings.speed}/10`} onChange={(v) => set({ speed: v })} />
          {settings.wpm && (
            <p style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)", marginTop: -14, marginBottom: 20 }}>
              ✓ Calibrated to your pace — {settings.wpm} WPM
            </p>
          )}

          {/* ── TEXT ── */}
          <SectionLabel>Text</SectionLabel>
          <Slider label="Font Size" value={settings.fontSize} min={20} max={64} step={2}
            display={`${settings.fontSize}px`} onChange={(v) => set({ fontSize: v })} />
          <Slider label="Line Spacing" value={settings.lineSpacing} min={1} max={2.5} step={0.1}
            display={settings.lineSpacing.toFixed(1)} onChange={(v) => set({ lineSpacing: v })} />
          <Slider label="Text Width" value={settings.textWidth} min={50} max={100} step={5}
            display={`${settings.textWidth}%`} onChange={(v) => set({ textWidth: v })} />

          {/* Font style */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>Font Style</p>
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

          {/* Text background */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>Text Background</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["none", "band", "full"] as const).map((bg) => (
                <button key={bg} onClick={() => set({ textBackground: bg })} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: settings.textBackground === bg ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${settings.textBackground === bg ? "var(--accent)" : "var(--border)"}`,
                  color: settings.textBackground === bg ? "white" : "var(--text-2)",
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
                }}>
                  {bg === "none" ? "None" : bg === "band" ? "Band" : "Full"}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.4 }}>
              Band = dark strip behind text only. Full = darkened overlay. None = shadow only.
            </p>
          </div>

          <Toggle label="Text Outline" sub="Thin dark stroke — helps on bright backgrounds"
            value={settings.textStroke} onChange={(v) => set({ textStroke: v })} />

          {/* ── LAYOUT ── */}
          <SectionLabel>Layout</SectionLabel>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>Text Position</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button key={pos} onClick={() => set({ position: pos })} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                  background: settings.position === pos ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${settings.position === pos ? "var(--accent)" : "var(--border)"}`,
                  color: settings.position === pos ? "white" : "var(--text-2)",
                  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)", textTransform: "capitalize",
                }}>
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* ── MIRROR ── */}
          <SectionLabel>Mirror</SectionLabel>
          <Toggle label="Mirror Video" sub="On by default for front camera"
            value={settings.mirrorVideo} onChange={(v) => set({ mirrorVideo: v })} />
          <Toggle label="Mirror Text" sub="For use with physical teleprompter glass"
            value={settings.mirrorText} onChange={(v) => set({ mirrorText: v })} />
        </div>
      </div>
    </div>
  );
}
