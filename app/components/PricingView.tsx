"use client";

const KO_FI_URL = "https://ko-fi.com/s/e02564e7cc";

interface Props {
  isPro: boolean;
  onBack: () => void;
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

export default function PricingView({ isPro, onBack }: Props) {
  const shell: React.CSSProperties = { height: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" };
  const scroller: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };
  const topPad = "max(56px, env(safe-area-inset-top, 0px) + 40px)";

  return (
    <div style={shell}>
      <div style={scroller}>
        <div style={{ padding: "0 24px 48px", paddingTop: topPad, maxWidth: 480, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button onClick={onBack}
              style={{ width: 38, height: 38, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              title="Back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>ReelPrompt</div>
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>✦ Pro</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 10 }}>
              Your scripts,<br />everywhere you are.
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
              Write on your laptop. Record on your phone. ReelPrompt Pro keeps your scripts in sync across all your devices — instantly.
            </p>
          </div>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>

            {/* Free */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Free</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>forever</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)" }}>€0</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {FEATURES_FREE.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-2)" }}>{CHECK} {f}</div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div style={{ background: "var(--surface)", border: "2px solid var(--accent)", borderRadius: 16, padding: "20px", boxShadow: "0 0 32px var(--accent-glow)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>✦ Pro</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>one payment, no expiry</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ background: "var(--accent)", color: "white", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: 6, letterSpacing: "0.05em" }}>LIFETIME</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--accent)" }}>€3+</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                Pay what you feel is fair — €3 minimum.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
                {FEATURES_PRO.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-2)" }}>{CHECK} {f}</div>
                ))}
              </div>
              <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 0", borderRadius: 12, background: "var(--accent)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, textDecoration: "none", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}>
                Support ReelPrompt ✦
              </a>
              <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 12, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                After purchase you'll receive an activation code by email.<br />
                <a href="/help#pro" style={{ color: "var(--accent)", textDecoration: "none" }}>How does activation work?</a>
              </p>
            </div>

            {/* Ko-fi donate — Pro users only */}
            {isPro && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☕ Buy me a coffee</div>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                  You already have Pro. If you love ReelPrompt, a coffee keeps it going — no pressure, no minimum.
                </p>
                <a href="https://ko-fi.com/s/111eb93270" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 0", borderRadius: 12, background: "var(--bg-2)", color: "var(--text-2)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid var(--border-2)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}>
                  ☕ Donate freely
                </a>
              </div>
            )}

          </div>

          {/* Already have a code? */}
          {!isPro && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                Already have an activation code?{" "}
                <a href="/?pro=success" style={{ color: "var(--accent)", textDecoration: "none" }}>Activate here →</a>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
