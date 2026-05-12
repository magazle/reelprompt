"use client";
import { useState } from "react";
import { checkProUser } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const KO_FI_URL = "https://ko-fi.com/s/e02564e7cc";

interface Props {
  isPro: boolean;
  onBack: () => void;
  onActivate: () => void; // navigates to ?pro=success (SuccessView)
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

type LoginState = "idle" | "checking" | "sent" | "error";

export default function PricingView({ isPro, onBack, onActivate }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginError, setLoginError] = useState("");

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const handleLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setLoginError("Enter a valid email address.");
      return;
    }
    if (isOffline) {
      setLoginError("You're offline — connect to the internet to sign in.");
      return;
    }
    setLoginState("checking");
    setLoginError("");

    const isProUser = await checkProUser(trimmed);
    if (!isProUser) {
      setLoginError("No Pro account found for this email. Have you completed activation at reelprompt.xyz/?pro=success after purchase?");
      setLoginState("error");
      return;
    }

    const { error } = await signIn(trimmed);
    if (error) {
      setLoginError("Something went wrong — try again.");
      setLoginState("error");
      return;
    }
    setLoginState("sent");
  };

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

          {/* ── SECTION 1: New User ── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>New user</div>

            {/* Free card */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
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

            {/* Pro card */}
            <div style={{ background: "var(--surface)", border: "2px solid var(--accent)", borderRadius: 16, padding: "20px", boxShadow: "0 0 32px var(--accent-glow)", marginBottom: 14 }}>
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
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>Pay what you feel is fair — €3 minimum.</p>
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
              <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>How it works</div>
                {[
                  "1. Pay on Ko-fi — you'll receive an activation code by email",
                  "2. Ko-fi redirects you back here automatically",
                  "3. Follow the activation steps: enter your code, then your email",
                  "4. Tap the magic link — Pro is activated instantly",
                ].map((step) => (
                  <div key={step} style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>{step}</div>
                ))}
              </div>
            </div>

            {/* Ko-fi donate — Pro users only */}
            {isPro && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☕ Buy me a coffee</div>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>You already have Pro. If you love ReelPrompt, a coffee keeps it going — no pressure, no minimum.</p>
                <a href="https://ko-fi.com/s/111eb93270" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 0", borderRadius: 12, background: "var(--bg-2)", color: "var(--text-2)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid var(--border-2)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}>
                  ☕ Donate freely
                </a>
              </div>
            )}
          </div>

          {/* ── SECTION 2: Already Registered ── */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 28, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Already registered</div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>

              {loginState === "sent" ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📬</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Check your email</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, fontFamily: "var(--font-mono)", marginBottom: 16 }}>
                    We sent a magic link to <strong style={{ color: "var(--text-2)" }}>{email}</strong>.<br />
                    Tap it to sign in on this device.
                  </p>
                  <button onClick={() => { setLoginState("idle"); setEmail(""); setLoginError(""); }}
                    style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                    Use a different email
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Sign in to your account</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                    Enter the email you used to activate Pro — we'll send a magic link to sign in on this device.
                  </p>
                  {isOffline && (
                    <p style={{ fontSize: 11, color: "#ff3b30", marginBottom: 10, fontFamily: "var(--font-mono)" }}>📡 You're offline — connect to sign in.</p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginBottom: loginError ? 0 : 0 }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLoginError(""); setLoginState("idle"); }}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      style={{ flex: 1, background: "var(--bg-2)", border: `1px solid ${loginError ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 13, padding: "10px 12px", outline: "none", transition: "border-color 0.15s" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = loginError ? "#ff3b30" : "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = loginError ? "#ff3b30" : "var(--border)")}
                    />
                    <button onClick={handleLogin} disabled={loginState === "checking" || isOffline} className="btn btn-primary"
                      style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: loginState === "checking" || isOffline ? 0.7 : 1 }}>
                      {loginState === "checking" ? "Checking…" : "Send →"}
                    </button>
                  </div>
                  {loginError && (
                    <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 8, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>{loginError}</p>
                  )}
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                    Never activated?{" "}
                    <button onClick={onActivate} style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", padding: 0, textDecoration: "underline" }}>
                      Complete activation →
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 24, lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
            Questions? <a href="/help" style={{ color: "var(--accent)", textDecoration: "none" }}>Visit the Help Desk</a>
          </p>

        </div>
      </div>
    </div>
  );
}
