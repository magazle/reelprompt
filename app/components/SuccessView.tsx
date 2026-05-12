"use client";
import { useState } from "react";
import { validateProCode } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

interface Props {
  onBack: () => void;
}

const ERROR_MESSAGES = {
  invalid: "Code not found — double-check your email.",
  already_used: "This code has already been used.",
  error: "Something went wrong — try again in a moment.",
};

type Step = "code" | "email" | "sent";

export default function SuccessView({ onBack }: Props) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>("code");

  // Step 1 — code
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);

  // Step 2 — email
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

  // Offline check
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const handleValidateCode = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setCodeError("Enter your activation code."); return; }
    if (trimmed.length < 6) { setCodeError("Code looks too short — check your email."); return; }

    setValidatingCode(true);
    setCodeError("");
    const result = await validateProCode(trimmed);

    if (result === "ok") {
      // Store code in sessionStorage — isPro is written only after magic link
      localStorage.setItem("reelprompt:pending-code", trimmed);
      setStep("email");
    } else {
      setCodeError(ERROR_MESSAGES[result]);
    }
    setValidatingCode(false);
  };

  const handleSendMagicLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) { setEmailError("Enter a valid email address."); return; }
    if (isOffline) { setEmailError("You're offline — connect to the internet to sign in."); return; }

    setSendingLink(true);
    setEmailError("");
    const { error } = await signIn(trimmed);

    if (error) { setEmailError("Something went wrong — try again."); setSendingLink(false); return; }
    setStep("sent");
    setSendingLink(false);
  };

  const shell: React.CSSProperties = {
    height: "100dvh", background: "var(--bg)", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px",
  };

  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Step 1 — Code */}
        {step === "code" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", boxShadow: "0 0 32px var(--accent-glow)" }}>🎉</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", marginBottom: 8 }}>Thank you!</h1>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
                Enter the activation code from your email to get started.
              </p>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Step 1 of 2 — Activation code</div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                Check your email for the code. Usually arrives within 24 hours.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" placeholder="REELPRO-XXXXX" value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                  autoFocus
                  style={{ flex: 1, background: "var(--bg-2)", border: `1px solid ${codeError ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, padding: "10px 12px", outline: "none", textTransform: "uppercase", transition: "border-color 0.15s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = codeError ? "#ff3b30" : "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = codeError ? "#ff3b30" : "var(--border)")}
                />
                <button onClick={handleValidateCode} disabled={validatingCode} className="btn btn-primary"
                  style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: validatingCode ? 0.7 : 1 }}>
                  {validatingCode ? "..." : "Next →"}
                </button>
              </div>
              {codeError && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 8, fontFamily: "var(--font-mono)" }}>{codeError}</p>}
            </div>

            <button onClick={onBack} className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}>Back</button>
            <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 16, fontFamily: "var(--font-mono)" }}>
              Questions? <a href="/help" style={{ color: "var(--accent)", textDecoration: "none" }}>Visit the Help Desk</a>
            </p>
          </>
        )}

        {/* Step 2 — Email */}
        {step === "email" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", boxShadow: "0 0 32px var(--accent-glow)" }}>✦</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", marginBottom: 8 }}>Code confirmed!</h1>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
                Now enter your email to receive a magic link and activate sync.
              </p>
            </div>

            {isOffline && (
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--border-2)", marginBottom: 14, fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                📡 You're offline. Connect to the internet to receive the magic link.
              </div>
            )}

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Step 2 of 2 — Your email</div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                We'll send a magic link to sign in — no password needed.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                  autoFocus
                  style={{ flex: 1, background: "var(--bg-2)", border: `1px solid ${emailError ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 13, padding: "10px 12px", outline: "none", transition: "border-color 0.15s" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = emailError ? "#ff3b30" : "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = emailError ? "#ff3b30" : "var(--border)")}
                />
                <button onClick={handleSendMagicLink} disabled={sendingLink || isOffline} className="btn btn-primary"
                  style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: sendingLink || isOffline ? 0.7 : 1 }}>
                  {sendingLink ? "..." : "Send"}
                </button>
              </div>
              {emailError && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 8, fontFamily: "var(--font-mono)" }}>{emailError}</p>}
            </div>

            <button onClick={() => setStep("code")} className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}>← Back</button>
          </>
        )}

        {/* Step 3 — Sent */}
        {step === "sent" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px", boxShadow: "0 0 32px var(--accent-glow)" }}>📬</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", marginBottom: 10 }}>Check your email</h1>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 8, fontFamily: "var(--font-mono)" }}>
              We sent a magic link to
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 24 }}>{email}</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 28, fontFamily: "var(--font-mono)" }}>
              Tap the link in the email to sign in and activate Pro. You can close this page.
            </p>
            <button onClick={onBack} className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}>
              Back to my scripts
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
