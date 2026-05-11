"use client";
import { useState } from "react";
import { validateProCode } from "../lib/supabase";

interface Props {
  onActivate: (key: string) => void;
  onBack: () => void;
}

const ERROR_MESSAGES = {
  invalid: "Code not found — double-check your email.",
  already_used: "This code has already been used.",
  error: "Something went wrong — try again in a moment.",
};

export default function SuccessView({ onActivate, onBack }: Props) {
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    const trimmed = key.trim();
    if (!trimmed) { setKeyError("Enter your activation code."); return; }
    if (trimmed.length < 6) { setKeyError("Code looks too short — check your email."); return; }

    setActivating(true);
    setKeyError("");

    const result = await validateProCode(trimmed);

    if (result === "ok") {
      onActivate(trimmed);
    } else {
      setKeyError(ERROR_MESSAGES[result]);
    }

    setActivating(false);
  };

  const shell: React.CSSProperties = {
    height: "100dvh",
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 24px",
  };

  return (
    <div style={shell}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>

        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 20px",
          boxShadow: "0 0 32px var(--accent-glow)",
        }}>
          🎉
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 26, letterSpacing: "-0.02em", marginBottom: 10,
        }}>
          Thank you so much!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 28 }}>
          Your support means everything. Check your email — you'll receive your activation code within 24 hours.
        </p>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "20px", marginBottom: 20, textAlign: "left",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Enter your activation code</div>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
            Got the email already? Paste your code below to unlock Pro now.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="REELPRO-XXXXX"
              value={key}
              onChange={(e) => { setKey(e.target.value.toUpperCase()); setKeyError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              autoFocus
              style={{
                flex: 1, background: "var(--bg-2)",
                border: `1px solid ${keyError ? "#ff3b30" : "var(--border)"}`,
                borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-mono)",
                fontSize: 13, padding: "10px 12px", outline: "none",
                transition: "border-color 0.15s",
                textTransform: "uppercase",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = keyError ? "#ff3b30" : "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = keyError ? "#ff3b30" : "var(--border)")}
            />
            <button
              onClick={handleActivate}
              disabled={activating}
              className="btn btn-primary"
              style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: activating ? 0.7 : 1 }}
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

        <button onClick={onBack} className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }}>
          Back to my scripts
        </button>

        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 20, lineHeight: 1.6, fontFamily: "var(--font-mono)" }}>
          Questions? noreply@leomagazzu.it
        </p>
      </div>
    </div>
  );
}
