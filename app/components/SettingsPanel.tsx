"use client";
import { TeleprompterSettings } from "../lib/types";

interface Props {
  settings: TeleprompterSettings;
  onChange: (s: TeleprompterSettings) => void;
  onClose: () => void;
}

function Slider({
  label, value, min, max, step, onChange, display
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--accent)",
          height: 4,
          cursor: "pointer"
        }}
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: "1px solid var(--border)"
    }}>
      <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none",
          background: value ? "var(--accent)" : "var(--surface-2)",
          position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%", background: "white",
          transition: "left 0.2s", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
        }} />
      </button>
    </div>
  );
}

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  const set = (patch: Partial<TeleprompterSettings>) => onChange({ ...settings, ...patch });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column", justifyContent: "flex-end"
    }}
      onClick={onClose}
    >
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />
      <div
        style={{
          position: "relative",
          background: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
          borderRadius: "20px 20px 0 0",
          padding: "8px 0 40px",
          maxHeight: "80dvh",
          overflow: "auto",
          zIndex: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-2)" }} />
        </div>

        <div style={{ padding: "0 24px 0" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 24, marginTop: 8 }}>Teleprompter Settings</h2>

          <Slider
            label="Scroll Speed"
            value={settings.speed} min={1} max={10} step={0.5}
            display={`${settings.speed}/10`}
            onChange={(v) => set({ speed: v })}
          />
          <Slider
            label="Font Size"
            value={settings.fontSize} min={20} max={60} step={2}
            display={`${settings.fontSize}px`}
            onChange={(v) => set({ fontSize: v })}
          />
          <Slider
            label="Line Spacing"
            value={settings.lineSpacing} min={1} max={2.5} step={0.1}
            display={settings.lineSpacing.toFixed(1)}
            onChange={(v) => set({ lineSpacing: v })}
          />
          <Slider
            label="Text Width"
            value={settings.textWidth} min={50} max={100} step={5}
            display={`${settings.textWidth}%`}
            onChange={(v) => set({ textWidth: v })}
          />

          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500, marginBottom: 10 }}>
              Text Position
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => set({ position: pos })}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10,
                    background: settings.position === pos ? "var(--accent)" : "var(--surface)",
                    border: "1px solid",
                    borderColor: settings.position === pos ? "var(--accent)" : "var(--border)",
                    color: settings.position === pos ? "white" : "var(--text-2)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-display)", textTransform: "capitalize"
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <Toggle label="Mirror Text" value={settings.mirrorText} onChange={(v) => set({ mirrorText: v })} />
            <Toggle label="Mirror Video Preview" value={settings.mirrorVideo} onChange={(v) => set({ mirrorVideo: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}
