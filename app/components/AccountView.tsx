"use client";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const KO_FI_DONATE_URL = "https://ko-fi.com/s/111eb93270";

interface Props {
  onBack: () => void;
  onSignOut: () => void;
}

type FormState = "idle" | "sending" | "sent" | "error";

export default function AccountView({ onBack, onSignOut }: Props) {
  const { user, signOut } = useAuth();
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setFormState("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          userEmail: user?.email ?? "unknown",
        }),
      });
      if (!res.ok) throw new Error();
      setFormState("sent");
      setMessage("");
    } catch {
      setFormState("error");
    }
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

          {/* Pro badge */}
          <div style={{
            background: "var(--surface)", border: "2px solid var(--accent)",
            borderRadius: 16, padding: "20px",
            boxShadow: "0 0 32px var(--accent-glow)",
            marginBottom: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>✦ Pro</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  Lifetime access · synced across devices
                </div>
              </div>
              <div style={{
                background: "var(--accent)", color: "white",
                fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                padding: "4px 10px", borderRadius: 6, letterSpacing: "0.05em",
              }}>
                ACTIVE
              </div>
            </div>
          </div>

          {/* Ko-fi donate */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "20px",
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☕ Buy me a coffee</div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
              Love ReelPrompt? A coffee helps keep it going — no minimum, no pressure.
            </p>
            <a
              href={KO_FI_DONATE_URL}
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

          {/* Contact form */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "20px",
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📬 Contact & Feedback</div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
              Change email, report a bug, or just say hi — we read everything.
            </p>

            {formState === "sent" ? (
              <div style={{
                padding: "14px", borderRadius: 10,
                background: "var(--bg-2)", border: "1px solid var(--border)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Message sent!</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  We'll get back to you at {user?.email}
                </div>
                <button
                  onClick={() => setFormState("idle")}
                  style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)" }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Your message…"
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); if (formState === "error") setFormState("idle"); }}
                  rows={4}
                  style={{
                    width: "100%", background: "var(--bg-2)",
                    border: `1px solid ${formState === "error" ? "#ff3b30" : "var(--border)"}`,
                    borderRadius: 10, color: "var(--text)",
                    fontFamily: "var(--font-display)", fontSize: 14,
                    padding: "12px 14px", outline: "none", resize: "none",
                    marginBottom: 10, transition: "border-color 0.15s",
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = formState === "error" ? "#ff3b30" : "var(--border)")}
                />
                {formState === "error" && (
                  <p style={{ fontSize: 11, color: "#ff3b30", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
                    Something went wrong — try again.
                  </p>
                )}
                <button
                  onClick={handleSend}
                  disabled={formState === "sending" || !message.trim()}
                  className="btn btn-primary"
                  style={{
                    width: "100%", fontSize: 14,
                    opacity: formState === "sending" || !message.trim() ? 0.6 : 1,
                  }}
                >
                  {formState === "sending" ? "Sending…" : "Send message"}
                </button>
              </>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="btn btn-ghost"
            style={{ width: "100%", fontSize: 14, color: "var(--text-3)" }}
          >
            Sign out
          </button>

        </div>
      </div>
    </div>
  );
}
