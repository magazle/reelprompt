"use client";
import { Script } from "../lib/types";

// "More" screen: deleted scripts, help and support.
// (File name kept as AccountView.tsx for continuity; there are no accounts anymore.)

const KO_FI_DONATE_URL = "https://ko-fi.com/s/111eb93270";

interface Props {
  onBack: () => void;
  deletedScripts: Script[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MoreView({ onBack, deletedScripts, onRestore, onPermanentDelete }: Props) {
  const shell: React.CSSProperties = { height: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" };
  const scroller: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };
  const topPad = "max(56px, env(safe-area-inset-top, 0px) + 40px)";
  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 };
  const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, marginBottom: 4 };
  const cardText: React.CSSProperties = { fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" };
  const linkBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 0", borderRadius: 12, background: "var(--bg-2)", color: "var(--text-2)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid var(--border-2)" };

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

          {/* Deleted scripts */}
          <div style={card}>
            <div style={cardTitle}>🗑 Deleted scripts</div>
            {deletedScripts.length === 0 ? (
              <p style={{ ...cardText, marginBottom: 0 }}>Nothing here. Scripts you delete will appear here, so you can restore them.</p>
            ) : (
              <>
                <p style={cardText}>Restore or permanently delete scripts you've trashed.</p>
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
                        <button onClick={() => { if (confirm("Delete this script forever?")) onPermanentDelete(s.id); }}
                          style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "rgba(255,59,48,0.08)", color: "#ff3b30", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Help */}
          <div style={card}>
            <div style={cardTitle}>📬 Help & feedback</div>
            <p style={cardText}>Report a bug, ask a question, or just say hi — we read everything.</p>
            <a href="/help" style={linkBtn}>Open the Help Desk →</a>
          </div>

          {/* Ko-fi donate */}
          <div style={card}>
            <div style={cardTitle}>☕ Buy me a coffee</div>
            <p style={cardText}>ReelPrompt is free. If you love it, a coffee helps keep it going — no minimum, no pressure.</p>
            <a href={KO_FI_DONATE_URL} target="_blank" rel="noopener noreferrer" style={linkBtn}>☕ Donate freely</a>
          </div>

        </div>
      </div>
    </div>
  );
}
