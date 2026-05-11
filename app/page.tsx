"use client";
import { useState, useEffect } from "react";
import { Script, TeleprompterSettings } from "./lib/types";
import { getSettings, saveSettings } from "./lib/storage";
import { useScripts } from "./hooks/useScripts";
import ScriptCard from "./components/ScriptCard";
import ScriptEditor from "./components/ScriptEditor";
import TeleprompterView from "./components/TeleprompterView";
import { IconPlus } from "./components/Icons";

type View = "list" | "editor" | "teleprompter";

// ── How-to guide steps ───────────────────────────────────────────────────
const GUIDE_STEPS = [
  {
    emoji: "✍️",
    title: "Write your script",
    body: "Type freely or paste Markdown. Use the toolbar for bold, colours, bullets and headings to mark up your text for easier reading.",
  },
  {
    emoji: "⚡",
    title: "Calibrate your speed",
    body: "Hit Calibrate in the editor footer, read your script aloud, and ReelPrompt sets the scroll speed to match your natural pace.",
  },
  {
    emoji: "🎬",
    title: "Record",
    body: "Tap the red button to start a 3-2-1 countdown, then read. The script scrolls over your camera preview — the recorded video contains only you, no overlay.",
  },
  {
    emoji: "💾",
    title: "Save and share",
    body: "When done, download the clean video and upload it directly to Instagram, TikTok, or wherever you publish.",
  },
];

function HowToGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "none", border: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", padding: "14px 0",
          borderTop: "1px solid var(--border)",
          borderBottom: open ? "none" : "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", fontFamily: "var(--font-display)" }}>
          How to use ReelPrompt
        </span>
        <span style={{
          fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em", transition: "transform 0.2s",
          display: "inline-block", transform: open ? "rotate(180deg)" : "none",
        }}>▾</span>
      </button>

      {open && (
        <div style={{
          borderBottom: "1px solid var(--border)",
          paddingBottom: 20, marginBottom: 4,
          display: "flex", flexDirection: "column", gap: 0,
          animation: "slide-up 0.2s ease forwards",
        }}>
          {GUIDE_STEPS.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 16, alignItems: "flex-start",
              padding: "14px 0",
              borderBottom: i < GUIDE_STEPS.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              {/* Step number + emoji */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  {step.emoji}
                </div>
                {i < GUIDE_STEPS.length - 1 && (
                  <div style={{ width: 1, height: 16, background: "var(--border)" }} />
                )}
              </div>
              {/* Text */}
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                  {step.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        style={{
          position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none",
        }}
      >
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        placeholder="Search scripts…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, color: "var(--text)", fontFamily: "var(--font-display)",
          fontSize: 14, padding: "10px 14px 10px 38px", outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-3)", fontSize: 16, lineHeight: 1, padding: 2,
          }}
        >×</button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Home() {
  const { scripts, create, save, remove, duplicate } = useScripts();
  const [view, setView]                 = useState<View>("list");
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [settings, setSettings]         = useState<TeleprompterSettings | null>(null);
  const [query, setQuery]               = useState("");

  useEffect(() => { setSettings(getSettings()); }, []);

  const handleCreate = () => {
    const s = create();
    setActiveScript(s);
    setView("editor");
  };

  const handleEdit = (s: Script) => {
    setActiveScript(s);
    setView("editor");
  };

  const handleSave = (s: Script) => {
    const updated = save(s);
    setActiveScript(updated);
    return updated;
  };

  const handleStartTeleprompter = (s: Script) => {
    setActiveScript(s);
    setView("teleprompter");
  };

  const handleSettingsChange = (s: TeleprompterSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  if (!settings) return null;

  if (view === "teleprompter" && activeScript) {
    return (
      <TeleprompterView
        script={activeScript}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onBack={() => setView("editor")}
      />
    );
  }

  if (view === "editor" && activeScript) {
    return (
      <ScriptEditor
        script={activeScript}
        settings={settings}
        onSave={handleSave}
        onBack={() => setView("list")}
        onStartTeleprompter={handleStartTeleprompter}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  // Filter scripts by search query (title + body plain text)
  const filtered = query.trim()
    ? scripts.filter((s) => {
        const q    = query.toLowerCase();
        const plain = s.body.replace(/<[^>]*>/g, " ").toLowerCase();
        return s.title.toLowerCase().includes(q) || plain.includes(q);
      })
    : scripts;

  const totalWords = scripts.reduce((acc, s) => {
    const plain = s.body.replace(/<[^>]*>/g, " ").trim();
    return acc + (plain ? plain.split(/\s+/).length : 0);
  }, 0);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "56px 24px 0", paddingTop: "max(56px, env(safe-area-inset-top, 0px) + 40px)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
            }}>ReelPrompt</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Your<br />Scripts
            </h1>
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 14, flexShrink: 0 }} onClick={handleCreate}>
            <IconPlus /> New
          </button>
        </div>

        {/* Stats row — only when scripts exist */}
        {scripts.length > 0 && (
          <div style={{ display: "flex", gap: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{scripts.length}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scripts</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{totalWords.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Words</div>
            </div>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div style={{ flex: 1, padding: "0 24px 40px", overflowY: "auto" }}>

        {scripts.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* CTA */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center", gap: 16, paddingTop: 48, paddingBottom: 48,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: "var(--surface)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, marginBottom: 4,
              }}>🎬</div>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>No scripts yet</h2>
              <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 260, lineHeight: 1.5 }}>
                Create your first script and start recording like a pro.
              </p>
              <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: 4 }}>
                <IconPlus /> Create your first script
              </button>
            </div>

            {/* Guide always visible on empty state */}
            <HowToGuide />
          </div>
        ) : (
          /* ── SCRIPTS LIST ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Search — only when 3+ scripts */}
            {scripts.length >= 3 && (
              <div style={{ paddingTop: 4 }}>
                <SearchBar value={query} onChange={setQuery} />
              </div>
            )}

            {/* Script cards */}
            {filtered.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map((s) => (
                  <ScriptCard key={s.id} script={s} onEdit={handleEdit} onDuplicate={duplicate} onDelete={remove} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 14 }}>
                No scripts match "{query}"
              </div>
            )}

            {/* Guide — collapsible, always accessible */}
            <div style={{ marginTop: 32 }}>
              <HowToGuide />
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
