"use client";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: signInError } = await signIn(trimmed);
    if (signInError) {
      setError("Something went wrong — try again.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,31,20,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)", borderRadius: "20px 20px 0 0",
          borderTop: "1px solid var(--border)",
          width: "100%", maxWidth: 480,
          animation: "slide-up 0.3s ease forwards",
          padding: "0 0 max(24px, env(safe-area-inset-bottom, 0px))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-2)" }} />
        </div>

        <div style={{ padding: "8px 24px 24px" }}>
          {!sent ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Sign in to Pro</h2>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 20 }}>
                Enter your email — we'll send you a magic link to sign in on any device.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                autoFocus
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{
                  width: "100%", background: "var(--bg-2)",
                  border: `1px solid ${error ? "#ff3b30" : "var(--border)"}`,
                  borderRadius: 12, color: "var(--text)",
                  fontFamily: "var(--font-display)", fontSize: 15,
                  padding: "12px 14px", outline: "none",
                  marginBottom: error ? 8 : 16, transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = error ? "#ff3b30" : "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = error ? "#ff3b30" : "var(--border)")}
              />
              {error && (
                <p style={{ fontSize: 11, color: "#ff3b30", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
                  {error}
                </p>
              )}
              <button
                onClick={handleSend}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Check your email</h2>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                  We sent a magic link to <strong>{email}</strong>.<br />
                  Tap it to sign in — no password needed.
                </p>
              </div>
              <button onClick={onClose} className="btn btn-ghost" style={{ width: "100%", marginTop: 20 }}>
                Got it
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
