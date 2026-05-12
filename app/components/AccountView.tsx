"use client";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const KO_FI_DONATE_URL = "https://ko-fi.com/s/111eb93270";

interface Props {
  onBack: () => void;
  onSignOut: () => void;
  deletedScripts: import("../lib/types").Script[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

type FormState = "idle" | "sending" | "sent" | "error";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AccountView({ onBack, onSignOut, deletedScripts, onRestore, onPermanentDelete }: Props) {
  const { user, signOut, signIn } = useAuth();
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [syncSent, setSyncSent] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState("");

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const handleSignOut = async () => {
    await signOut(); // Supabase clears session + useAuth clears localStorage via SIGNED_OUT event
    onSignOut();     // page.tsx resets isPro state + goes to list
  };

  const handleSendMagicLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) { setSyncError("Enter a valid email address."); return; }
    if (isOffline) { setSyncError("You're offline — connect to the internet to sign in."); return; }
    setSyncLoading(true);
    setSyncError("");
    const { error } = await signIn(trimmed);
    if (error) { setSyncError("Something went wrong — try again."); setSyncLoading(false); return; }
    setSyncSent(true);
    setSyncLoading(false);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setFormState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), userEmail: user?.email ?? "unknown" }),
      });
      if (!res.ok) throw new Error();
      setFormState("sent");
      setMessage("");
    } catch {
      setFormState("error");
    }
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

          {/* Offline warning */}
          {isOffline && (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--border-2)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📡</span>
              <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, fontFamily: "var(--font-mono)", margin: 0 }}>
                You're offline. Sync is paused — your scripts are still available locally.
              </p>
            </div>
          )}

          {/* Pro badge */}
          <div style={{ background: "var(--surface)", border: "2px solid var(--accent)", borderRadius: 16, padding: "20px", boxShadow: "0 0 32px var(--accent-glow)", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: user?.email ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>✦ Pro</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  {user ? "Lifetime access · synced across devices" : "Lifetime access · sign in to sync"}
                </div>
              </div>
              <div style={{ background: "var(--accent)", color: "white", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", padding: "4px 10px", borderRadius: 6, letterSpacing: "0.05em" }}>ACTIVE</div>
            </div>
            {user?.email && (
              <div style={{ padding: "10px 12px", background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Signed in as</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>{user.email}</div>
              </div>
            )}
          </div>

          {/* Sync section — only when NOT logged in */}
          {!user && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☁ Sync across devices</div>
              {syncSent ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Check your email</div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                    We sent a magic link to <strong>{email}</strong>.<br />Tap it to sign in on any device.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                    Enter your email to receive a magic link — no password needed.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="email" placeholder="your@email.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); setSyncError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                      style={{ flex: 1, background: "var(--bg-2)", border: `1px solid ${syncError ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 13, padding: "10px 12px", outline: "none", transition: "border-color 0.15s" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = syncError ? "#ff3b30" : "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = syncError ? "#ff3b30" : "var(--border)")}
                    />
                    <button onClick={handleSendMagicLink} disabled={syncLoading || isOffline} className="btn btn-primary"
                      style={{ padding: "10px 14px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: syncLoading || isOffline ? 0.7 : 1 }}>
                      {syncLoading ? "..." : "Send"}
                    </button>
                  </div>
                  {syncError && <p style={{ fontSize: 11, color: "#ff3b30", marginTop: 8, fontFamily: "var(--font-mono)" }}>{syncError}</p>}
                </>
              )}
            </div>
          )}

          {/* Ko-fi donate */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>☕ Buy me a coffee</div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
              Love ReelPrompt? A coffee helps keep it going — no minimum, no pressure.
            </p>
            <a href={KO_FI_DONATE_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 0", borderRadius: 12, background: "var(--bg-2)", color: "var(--text-2)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid var(--border-2)", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}>
              ☕ Donate freely
            </a>
          </div>

          {/* Contact form */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📬 Contact & Feedback</div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
              Change email, report a bug, or just say hi — we read everything.
            </p>
            {formState === "sent" ? (
              <div style={{ padding: "14px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Message sent!</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  {user?.email ? `We'll get back to you at ${user.email}` : "We'll get back to you soon."}
                </div>
                <button onClick={() => setFormState("idle")} style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)" }}>Send another</button>
              </div>
            ) : (
              <>
                <textarea placeholder="Your message…" value={message}
                  onChange={(e) => { setMessage(e.target.value); if (formState === "error") setFormState("idle"); }}
                  rows={4}
                  style={{ width: "100%", background: "var(--bg-2)", border: `1px solid ${formState === "error" ? "#ff3b30" : "var(--border)"}`, borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 14, padding: "12px 14px", outline: "none", resize: "none", marginBottom: 10, transition: "border-color 0.15s", lineHeight: 1.5 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = formState === "error" ? "#ff3b30" : "var(--border)")}
                />
                {formState === "error" && <p style={{ fontSize: 11, color: "#ff3b30", marginBottom: 8, fontFamily: "var(--font-mono)" }}>Something went wrong — try again.</p>}
                <button onClick={handleSend} disabled={formState === "sending" || !message.trim()} className="btn btn-primary"
                  style={{ width: "100%", fontSize: 14, opacity: formState === "sending" || !message.trim() ? 0.6 : 1 }}>
                  {formState === "sending" ? "Sending…" : "Send message"}
                </button>
              </>
            )}
          </div>

          {/* Deleted scripts */}
          {deletedScripts.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🗑 Deleted scripts</div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
                Restore or permanently delete scripts you've trashed.
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {deletedScripts.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-2)" }}>
                        {s.title || "Untitled"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                        Deleted {fmtDate(s.deletedAt!)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => onRestore(s.id)}
                        style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "rgba(22,163,74,0.1)", color: "var(--accent)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
                        Restore
                      </button>
                      <button onClick={() => onPermanentDelete(s.id)}
                        style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "rgba(255,59,48,0.08)", color: "#ff3b30", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign out — always visible for Pro users */}
          <button onClick={handleSignOut} className="btn btn-ghost"
            style={{ width: "100%", fontSize: 14, color: "var(--text-3)" }}>
            Sign out
          </button>

        </div>
      </div>
    </div>
  );
}
