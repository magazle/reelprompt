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

// ── Guide steps ───────────────────────────────────────────────────────────

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

// ── Components ────────────────────────────────────────────────────────────

function HowToGuide({ collapsible = false }: { collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible);

  const steps = (
    <div style={{
      borderBottom: collapsible ? "1px solid var(--border)" : "none",
      paddingBottom: collapsible ? 20 : 0,
      display: "flex", flexDirection: "column",
      animation: collapsible ? "slide-up 0.2s ease forwards" : "none",
    }}>
      {GUIDE_STEPS.map((step, i) => (
        <div key={i} style={{
          display: "flex", gap: 16, alignItems: "flex-start",
          padding: "14px 0",
          borderBottom: i < GUIDE_STEPS.length - 1 ? "1px solid var(--border)" : "none",
        }}>
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
  );

  if (!collapsible) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: "var(--text-2)",
          fontFamily: "var(--font-display)",
          paddingBottom: 12, marginBottom: 4,
          borderBottom: "1px solid var(--border)",
        }}>
          How to use ReelPrompt
        </div>
        {steps}
      </div>
    );
  }

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
          letterSpacing: "0.06em", display: "inline-block",
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "none",
        }}>▾</span>
      </button>
      {open && steps}
    </div>
  );
}

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

function Footer() {
  return (
    <div style={{
      padding: "20px 24px",
      paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px) + 16px)",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12,
    }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
        © 2026 Leo Magazzu
      </span>
      <a
        href="https://github.com/magazle/reelprompt"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)",
          textDecoration: "none", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
      >
        {/* GitHub icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        GitHub
      </a>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

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
  const handleEdit = (s: Script) => { setActiveScript(s); setView("editor"); };
  const handleSave = (s: Script) => {
    const updated = save(s);
    setActiveScript(updated);
    return updated;
  };
  const handleStartTeleprompter = (s: Script) => { setActiveScript(s); setView("teleprompter"); };
  const handleSettingsChange = (s: TeleprompterSettings) => { setSettings(s); saveSettings(s); };

  if (!settings) return null;

  if (view === "teleprompter" && activeScript) {
    return (
      <TeleprompterView
        script={activeScript} settings={settings}
        onSettingsChange={handleSettingsChange} onBack={() => setView("editor")}
      />
    );
  }

  if (view === "editor" && activeScript) {
    return (
      <ScriptEditor
        script={activeScript} settings={settings}
        onSave={handleSave} onBack={() => setView("list")}
        onStartTeleprompter={handleStartTeleprompter}
        onSettingsChange={handleSettingsChange}
      />
    );
  }

  const hasScripts = scripts.length > 0;

  const filtered = query.trim()
    ? scripts.filter((s) => {
        const q     = query.toLowerCase();
        const plain = s.body.replace(/<[^>]*>/g, " ").toLowerCase();
        return s.title.toLowerCase().includes(q) || plain.includes(q);
      })
    : scripts;

  const totalWords = scripts.reduce((acc, s) => {
    const plain = s.body.replace(/<[^>]*>/g, " ").trim();
    return acc + (plain ? plain.split(/\s+/).length : 0);
  }, 0);

  // ── EMPTY STATE ──────────────────────────────────────────────────────────
  if (!hasScripts) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "56px 24px 0",
          paddingTop: "max(56px, env(safe-area-inset-top, 0px) + 40px)",
          flex: 1, display: "flex", flexDirection: "column",
        }}>
          {/* Brand */}
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28,
          }}>ReelPrompt</div>

          {/* Guide — always open, not collapsible */}
          <HowToGuide collapsible={false} />

          {/* Single CTA */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 16, paddingBottom: 40, paddingTop: 32,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32,
            }}>🎬</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }}>Ready to record?</h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 260, lineHeight: 1.5, textAlign: "center" }}>
              Create your first script and start recording like a pro.
            </p>
            <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: 4 }}>
              <IconPlus /> Create your first script
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── SCRIPTS LIST ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "56px 24px 0", paddingTop: "max(56px, env(safe-area-inset-top, 0px) + 40px)" }}>
        {/* Header */}
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

        {/* Stats */}
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
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, padding: "0 24px", overflowY: "auto" }}>
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

        {/* Guide — collapsible */}
        <div style={{ marginTop: 32 }}>
          <HowToGuide collapsible={true} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
