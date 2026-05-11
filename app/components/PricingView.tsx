"use client";
import { useState } from "react";
import { validateProCode } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

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
  const { signIn } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [sent, setSent] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const handleActivate = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode  = code.trim().toUpperCase();

    // Validate both fields upfront
    let hasError = false;
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }
    if (!trimmedCode) {
      setCodeError("Enter your activation code.");
      hasError = true;
    } else if (trimmedCode.length < 6) {
      setCodeError("Code looks too short — check your Ko-fi email.");
      hasError = true;
    }
    if (hasError) return;
    if (isOffline) { setEmailError("You're offline — connect to the internet to sign in."); return; }

    setSubmitting(true);
    setEmailError("");
    setCodeError("");

    // Validate the code against Supabase
    const result = await validateProCode(trimmedCode);
    if (result !== "ok") {
      const msgs = {
        invalid:      "Code not found — check the email from Ko-fi.",
        already_used: "This code has already been used. Contact support if unexpected.",
        error:        "Something went wrong — try again.",
      };
      setCodeError(msgs[result]);
      setSubmitting(false);
      return;
    }

    // Store code so useAuth can register the user after magic link click
    localStorage.setItem("reelprompt:pending-code", trimmedCode);

    // Send magic link
    const { error } = await signIn(trimmedEmail);
    if (error) {
      setEmailError("Couldn't send magic link — try again.");
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
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
                  "1. Pay on Ko-fi — you'll get an activation code by email",
                  "2. Come back here → Already a Pro member?",
                  "3. Enter your email + the activation code",
                  "4. Tap the magic link in your email to activate",
                ].map((step) => (
                  <div key={step} style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>{step}</div>
                ))}
              </div>
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

          {/* Already a Pro member */}
          {!isPro && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Already a Pro member?</div>

              {/* Collapsed */}
              {!showSignIn && !sent && (
                <button onClick={() => setShowSignIn(true)}
                  style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}>
                  Sign in →
                </button>
              )}

              {/* Form: email + code */}
              {showSignIn && !sent && (
                <>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                    Enter your email and the activation code from your Ko-fi confirmation email.
                  </p>
                  {isOffline && (
                    <p style={{ fontSize: 11, color: "#ff3b30", marginBottom: 10, fontFamily: "var(--font-mono)" }}>📡 You're offline — connect to sign in.</p>
                  )}

                  {/* Email field */}
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      autoFocus
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                      style={{ width: "100%", background: "var(--bg-2)", border: `1px solid ${emailError ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 13, padding: "10px 12px", outline: "none", transition: "border-color 0.15s" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = emailError ? "#ff3b30" : "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = emailError ? "#ff3b30" : "var(--border)")}
                    />
                    {emailError && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 6, fontFamily: "var(--font-mono)" }}>{emailError}</p>}
                  </div>

                  {/* Code field */}
                  <div style={{ marginBottom: 14 }}>
                    <input
                      type="text"
                      placeholder="REELPRO-XXXXX"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                      style={{ width: "100%", background: "var(--bg-2)", border: `1px solid ${codeError ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, padding: "10px 12px", outline: "none", textTransform: "uppercase", transition: "border-color 0.15s", letterSpacing: "0.05em" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = codeError ? "#ff3b30" : "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = codeError ? "#ff3b30" : "var(--border)")}
                    />
                    {codeError && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 6, fontFamily: "var(--font-mono)" }}>{codeError}</p>}
                  </div>

                  <button
                    onClick={handleActivate}
                    disabled={submitting || isOffline}
                    className="btn btn-primary"
                    style={{ width: "100%", fontSize: 14, opacity: submitting || isOffline ? 0.7 : 1 }}>
                    {submitting ? "Sending magic link…" : "Activate Pro →"}
                  </button>
                </>
              )}

              {/* Sent confirmation */}
              {sent && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📬</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Check your email</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, fontFamily: "var(--font-mono)", marginBottom: 16 }}>
                    We sent a magic link to <strong style={{ color: "var(--text-2)" }}>{email}</strong>.<br />
                    Tap it to activate Pro — you can close this page while you wait.
                  </p>
                  <button
                    onClick={() => { setSent(false); setShowSignIn(true); setEmail(""); setCode(""); setEmailError(""); setCodeError(""); }}
                    style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                    Use different details
                  </button>
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 24, lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
            Need help? <a href="/help" style={{ color: "var(--accent)", textDecoration: "none" }}>Visit the Help Desk</a>
          </p>

        </div>
      </div>
    </div>
  );
}
