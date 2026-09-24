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
  const card: React.CSSProperties = { background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 20, padding: "20px", marginBottom: 12 };
  const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, margin: "0 0 4px" };
  const cardText: React.CSSProperties = { fontSize: 12, color: "var(--text-3)", marginBottom: 14, lineHeight: 1.5, fontFamily: "var(--font-mono)" };
  const linkBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "14px 0", borderRadius: 26, background: "var(--ink)", color: "#FFFFFF", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, textDecoration: "none", border: "none" };

  return (
    <div style={shell}>
      <div style={scroller}>
        <div style={{ padding: "0 24px 48px", paddingTop: topPad, maxWidth: 480, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button onClick={onBack}
              aria-label="Back" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--ink)", color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>More</h1>
          </div>

          {/* Deleted scripts */}
          <div style={card}>
            <h2 style={{ ...cardTitle, fontSize: 18 }}>Deleted scripts</h2>
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
                          style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "var(--highlight)", color: "var(--ink)", border: "none", borderRadius: 16, padding: "8px 12px", fontWeight: 600, cursor: "pointer" }}>
                          Restore
                        </button>
                        <button onClick={() => { if (confirm("Delete this script forever?")) onPermanentDelete(s.id); }}
                          style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "#FDE8E6", color: "var(--danger)", border: "none", borderRadius: 16, padding: "8px 12px", fontWeight: 600, cursor: "pointer" }}>
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
            <h2 style={{ ...cardTitle, fontSize: 18 }}>Help & feedback</h2>
            <p style={cardText}>Report a bug, ask a question, or just say hi — we read everything.</p>
            <a href="/help" style={linkBtn}>Open the Help Desk →</a>
          </div>

          {/* Ko-fi donate */}
          <div style={card}>
            <h2 style={{ ...cardTitle, fontSize: 18 }}>Buy me a coffee</h2>
            <p style={cardText}>ReelPrompt is free. If you love it, a coffee helps keep it going — no minimum, no pressure.</p>
            <a href={KO_FI_DONATE_URL} target="_blank" rel="noopener noreferrer" style={linkBtn}>Donate on Ko-fi</a>
          </div>

        </div>
      </div>
    </div>
  );
}
