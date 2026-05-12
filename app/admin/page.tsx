"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

interface ProUser { email: string; activated_at: string | null; note: string | null; }
interface ProCode { code: string; used: boolean; used_at: string | null; note: string | null; }
type Tab = "users" | "codes";
type CodeFilter = "all" | "free" | "used";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}
function copyText(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }

export default function AdminPage() {
  const { user, loading, sessionToken } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<ProUser[]>([]);
  const [codes, setCodes] = useState<ProCode[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addStatus, setAddStatus] = useState<"idle"|"loading"|"ok"|"exists"|"error">("idle");
  const [codeNote, setCodeNote] = useState("");
  const [genStatus, setGenStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [pendingRemoveUser, setPendingRemoveUser] = useState<string | null>(null);
  const [pendingDeleteCode, setPendingDeleteCode] = useState<string | null>(null);
  const [codeFilter, setCodeFilter] = useState<CodeFilter>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!sessionToken) return;
    setFetching(true); setError(null);
    try {
      const res = await fetch("/api/admin", { headers: { Authorization: `Bearer ${sessionToken}` } });
      if (res.status === 403) { setError("Not authorized."); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users ?? []); setCodes(data.codes ?? []);
    } catch { setError("Fetch failed — try again."); }
    finally { setFetching(false); }
  }, [sessionToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function apiPost(body: Record<string, unknown>) {
    return fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(body),
    });
  }

  async function handleAddUser() {
    const email = addEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    setAddStatus("loading");
    const res = await apiPost({ action: "add_user", email });
    if (res.status === 409) { setAddStatus("exists"); return; }
    if (!res.ok) { setAddStatus("error"); return; }
    const data = await res.json();
    setUsers((prev) => [data.user, ...prev]); setAddEmail(""); setAddStatus("ok");
    setTimeout(() => setAddStatus("idle"), 2000);
  }

  async function handleGenerateCode() {
    setGenStatus("loading"); setNewCode(null);
    const res = await apiPost({ action: "generate_code", note: codeNote.trim() || undefined });
    if (!res.ok) { setGenStatus("error"); return; }
    const data = await res.json();
    setCodes((prev) => [data.code, ...prev]); setGenStatus("ok"); setNewCode(data.code.code); setCodeNote("");
  }

  async function handleRemoveUser(email: string) {
    const res = await apiPost({ action: "remove_user", email });
    if (!res.ok) { setError("Remove failed."); return; }
    setUsers((prev) => prev.filter((u) => u.email !== email)); setPendingRemoveUser(null);
  }

  async function handleDeleteCode(code: string) {
    const res = await apiPost({ action: "delete_code", code });
    if (!res.ok) { setError("Delete failed."); return; }
    setCodes((prev) => prev.filter((c) => c.code !== code)); setPendingDeleteCode(null);
  }

  function handleCopy(text: string) {
    copyText(text); setCopied(text); setTimeout(() => setCopied(null), 1500);
  }

  const available = codes.filter((c) => !c.used).length;
  const usedCount  = codes.filter((c) =>  c.used).length;
  const filteredCodes = codes.filter((c) =>
    codeFilter === "free" ? !c.used : codeFilter === "used" ? c.used : true
  );

  const s = {
    shell:     { background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-display)" } as React.CSSProperties,
    inner:     { maxWidth: 680, margin: "0 auto", padding: "max(56px, env(safe-area-inset-top, 0px) + 32px) 24px 80px" } as React.CSSProperties,
    card:      { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 14 } as React.CSSProperties,
    mono:      { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" } as React.CSSProperties,
    label:     { fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
    input:     { flex: 1, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 13, padding: "10px 12px", outline: "none" } as React.CSSProperties,
    badge:     (used: boolean) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", background: used ? "var(--bg-3)" : "rgba(22,163,74,0.12)", color: used ? "var(--text-3)" : "var(--accent)" }),
    filterBtn: (active: boolean) => ({ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", transition: "all 0.15s", background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-3)", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.07)" : "none" }),
    deleteBtn: { flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "4px 6px", borderRadius: 6, fontSize: 16, lineHeight: 1 } as React.CSSProperties,
    confirmRow:{ display: "flex", gap: 6, flexShrink: 0 } as React.CSSProperties,
    confirmYes:{ fontSize: 11, fontFamily: "var(--font-mono)", background: "rgba(255,59,48,0.1)", color: "#ff3b30", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" } as React.CSSProperties,
    confirmNo: { fontSize: 11, fontFamily: "var(--font-mono)", background: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" } as React.CSSProperties,
  };

  const centered: React.CSSProperties = { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, background: "var(--bg)", fontFamily: "var(--font-display)" };

  if (loading) return <div style={centered}><p style={{ ...s.mono, color: "var(--text-3)" }}>Loading…</p></div>;
  if (!user) return <div style={centered}><p style={{ fontSize: 14, color: "var(--text-2)" }}>Sign in to access the admin panel.</p><a href="/" style={{ ...s.mono, color: "var(--accent)", textDecoration: "none" }}>← Home</a></div>;
  if (error === "Not authorized.") return <div style={centered}><p style={{ fontSize: 14, color: "var(--text-2)" }}>⛔ Not authorized.</p><a href="/" style={{ ...s.mono, color: "var(--accent)", textDecoration: "none" }}>← Home</a></div>;

  return (
    <div style={s.shell}>
      <div style={s.inner}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>ReelPrompt</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Admin</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {fetching && <span style={{ ...s.mono, color: "var(--text-3)", fontSize: 11 }}>syncing…</span>}
            <button onClick={fetchData} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
            <a href="/" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }} title="Back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Pro Users",       value: users.length, accent: false },
            { label: "Codes Available", value: available,    accent: available > 0 },
            { label: "Codes Used",      value: usedCount,    accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: accent ? "var(--accent)" : "var(--text)" }}>{value}</div>
              <div style={{ ...s.label, marginBottom: 0 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 14 }}>
            <p style={{ ...s.mono, color: "#ff3b30", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg-2)", borderRadius: 12, padding: 4 }}>
          {(["users", "codes"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)", transition: "all 0.15s", background: tab === t ? "var(--surface)" : "transparent", color: tab === t ? "var(--text)" : "var(--text-3)", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.07)" : "none" }}>
              {t === "users" ? `Pro Users (${users.length})` : `Codes (${available} free)`}
            </button>
          ))}
        </div>

        {/* ── USERS ── */}
        {tab === "users" && (
          <>
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>✦ Add Pro user</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="email" placeholder="email@example.com" value={addEmail}
                  onChange={(e) => { setAddEmail(e.target.value); setAddStatus("idle"); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                  style={s.input} />
                <button onClick={handleAddUser} disabled={addStatus === "loading" || !addEmail.includes("@")} className="btn btn-primary"
                  style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: addStatus === "loading" || !addEmail.includes("@") ? 0.6 : 1 }}>
                  {addStatus === "loading" ? "…" : "Add"}
                </button>
              </div>
              {addStatus === "ok"     && <p style={{ ...s.mono, color: "var(--accent)", marginTop: 8 }}>✓ Added.</p>}
              {addStatus === "exists" && <p style={{ ...s.mono, color: "var(--text-3)", marginTop: 8 }}>Already a Pro user.</p>}
              {addStatus === "error"  && <p style={{ ...s.mono, color: "#ff3b30", marginTop: 8 }}>Failed — try again.</p>}
            </div>

            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Pro users</div>
              {users.length === 0 ? <p style={{ ...s.mono, color: "var(--text-3)" }}>No users yet.</p> : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {users.map((u) => (
                    <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                        <div style={{ ...s.mono, fontSize: 11, marginTop: 2 }}>
                          {fmtDate(u.activated_at)}
                          {u.note && <span style={{ color: "var(--text-3)", marginLeft: 6 }}>· {u.note}</span>}
                        </div>
                      </div>
                      {pendingRemoveUser === u.email ? (
                        <div style={s.confirmRow}>
                          <button onClick={() => handleRemoveUser(u.email)} style={s.confirmYes}>Confirm</button>
                          <button onClick={() => setPendingRemoveUser(null)} style={s.confirmNo}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setPendingRemoveUser(u.email)} style={s.deleteBtn} title="Remove">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CODES ── */}
        {tab === "codes" && (
          <>
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⊕ Generate code</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" placeholder="Note (optional, e.g. 'friend: marco')" value={codeNote}
                  onChange={(e) => setCodeNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateCode()}
                  style={s.input} />
                <button onClick={handleGenerateCode} disabled={genStatus === "loading"} className="btn btn-primary"
                  style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, flexShrink: 0, opacity: genStatus === "loading" ? 0.6 : 1 }}>
                  {genStatus === "loading" ? "…" : "Generate"}
                </button>
              </div>
              {newCode && (
                <div onClick={() => handleCopy(newCode)}
                  style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent)" }}>{newCode}</span>
                  <span style={{ ...s.mono, fontSize: 11, color: copied === newCode ? "var(--accent)" : "var(--text-3)" }}>{copied === newCode ? "copied!" : "tap to copy"}</span>
                </div>
              )}
              {genStatus === "error" && <p style={{ ...s.mono, color: "#ff3b30", marginTop: 8 }}>Failed — try again.</p>}
            </div>

            <div style={s.card}>
              {/* header + filter */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>All codes</div>
                <div style={{ display: "flex", gap: 2, background: "var(--bg-2)", borderRadius: 10, padding: 3 }}>
                  {(["all", "free", "used"] as CodeFilter[]).map((f) => (
                    <button key={f} onClick={() => setCodeFilter(f)} style={s.filterBtn(codeFilter === f)}>
                      {f === "all"  ? `All (${codes.length})`  :
                       f === "free" ? `Free (${available})` :
                                      `Used (${usedCount})`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCodes.length === 0 ? <p style={{ ...s.mono, color: "var(--text-3)" }}>No codes.</p> : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {filteredCodes.map((c) => (
                    <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={s.badge(c.used)}>{c.used ? "USED" : "FREE"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div onClick={() => !c.used && handleCopy(c.code)}
                          style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", cursor: c.used ? "default" : "pointer", color: c.used ? "var(--text-3)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={!c.used ? "Click to copy" : undefined}>
                          {c.code}
                          {!c.used && copied === c.code && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--accent)", fontWeight: 400 }}>copied!</span>}
                        </div>
                        <div style={{ ...s.mono, fontSize: 11, marginTop: 2 }}>
                          {c.used ? fmtDate(c.used_at) : "available"}
                          {c.note && <span style={{ color: "var(--text-3)", marginLeft: 6 }}>· {c.note}</span>}
                        </div>
                      </div>
                      {pendingDeleteCode === c.code ? (
                        <div style={s.confirmRow}>
                          <button onClick={() => handleDeleteCode(c.code)} style={s.confirmYes}>Confirm</button>
                          <button onClick={() => setPendingDeleteCode(null)} style={s.confirmNo}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setPendingDeleteCode(c.code)} style={s.deleteBtn} title="Delete">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
