"use client";
import { useState } from "react";

const KO_FI_URL = "https://ko-fi.com/s/e02564e7cc";

interface Props {
  isPro: boolean;
  onBack: () => void;
  onActivate: (key: string) => void;
}

const CHECK = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FEATURES_FREE = [
  "Unlimited scripts",
  "Rich text editor",
  "WPM calibration",
  "Portrait video recording",
  "Offline, no account needed",
];

const FEATURES_PRO = [
  "Everything in Free",
  "Scripts synced across all devices",
  "Write on laptop, record on phone",
  "All future Pro features",
];

export default function PricingView({ isPro, onBack, onActivate }: Props) {
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activating, setActivating] = useState(false);

  const handleActivate = () => {
    const trimmed = key.trim();
    if (!trimmed) { setKeyError("Enter your activation code."); return; }
    if (trimmed.length < 6) { setKeyError("Code looks too short — check your email."); return; }
    setActivating(true);
    // Simulate activation — replace with real validation later
    setTimeout(() => {
      onActivate(trimmed);
      setActivating(false);
    }, 800);
  };

  const shell: React.CSSProperties = {
    height: "100dvh",
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const scroller: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  };

  const topPad = "max(56px, env(safe-area-inset-top, 0px) + 40px)";

  return (
    <div style={shell}>
      <div style={scroller}>
        <div style={{ padding: "0 24px 48px", paddingTop: topPad, maxWidth: 480, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button
              onClick={onBack}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: "var(--surface)", border: "1px solid var(--border-2)",
                color: "var(--text-2)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
              title="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ReelPrompt
            </div>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "4px 10px", marginBottom: 12,
            }}>
              <span style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>✦ Pro</span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em",
              marginBottom: 10,
            }}>
              Your scripts,<br />everywhere you are.
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
              Write on your laptop. Record on your phone. ReelPrompt Pro keeps your scripts in sync across all your devices — instantly.
            </p>
          </div>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>

            {/* Free card */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "20px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Free</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>forever</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)" }}>€0</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {FEATURES_FREE.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                    {CHECK} {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro card */}
            <div style={{
              background: "var(--surface)", border: "2px solid var(--accent)",
              borderRadius: 16, padding: "20px 20px",
              boxShadow: "0 0 32px var(--accent-glow)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Badge */}
              <div style={{
                position: "absolute", top: 16, right: 16,
                background: "var(--accent)", color: "white",
                fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                padding: "3px 8px", borderRadius: 6, letterSpacing: "0.05em",
              }}>
                LIFETIME
              </div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>✦ Pro</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>one payment, no expiry</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--accent)" }}>€3+</div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                Pay what you feel is fair — €3 minimum.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
                {FEATURES_PRO.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                    {CHECK} {f}
                  </div>
                ))}
              </div>

              <a
                href={KO_FI_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "14px 0", borderRadius: 12,
                  background: "var(--accent)", color: "white",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
                  textDecoration: "none", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Support ReelPrompt ✦
              </a>
            </div>

            {/* Support card — only shown to Pro users */}
            {isPro && (
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "20px 20px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☕ Buy me a coffee</div>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                  You already have Pro. If you love ReelPrompt, a coffee keeps it going — no pressure, no minimum.
                </p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "100%", padding: "12px 0", borderRadius: 12,
                    background: "var(--bg-2)", color: "var(--text-2)",
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
                    textDecoration: "none", border: "1px solid var(--border-2)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                >
                  ☕ Donate freely
                </a>
              </div>
            )}
          </div>

          {/* Activation section */}
          {!isPro && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "20px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Already supported?</div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                Enter the activation code from your email to unlock Pro.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Activation code"
                  value={key}
                  onChange={(e) => { setKey(e.target.value); setKeyError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                  style={{
                    flex: 1, background: "var(--bg-2)", border: `1px solid ${keyError ? "#ff3b30" : "var(--border)"}`,
                    borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-mono)",
                    fontSize: 13, padding: "10px 12px", outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = keyError ? "#ff3b30" : "var(--border)")}
                />
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="btn btn-primary"
                  style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0 }}
                >
                  {activating ? "..." : "Activate"}
                </button>
              </div>
              {keyError && (
                <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 8, fontFamily: "var(--font-mono)" }}>
                  {keyError}
                </p>
              )}
            </div>
          )}

          {/* Footer note */}
          <p style={{
            fontSize: 11, color: "var(--text-3)", textAlign: "center",
            marginTop: 24, lineHeight: 1.6, fontFamily: "var(--font-mono)",
          }}>
            After supporting, check your email for the activation code.{"\n"}
            Usually within 24 hours. Questions? leo@reelprompt.xyz
          </p>

        </div>
      </div>
    </div>
  );
}
