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
    body: "Type freely or paste Markdown. Use the toolbar to add bold, colours, bullets and headings — your text will look exactly the same on the teleprompter.",
  },
  {
    emoji: "⚡",
    title: "Calibrate your speed",
    body: "Tap Calibrate in the editor, read your script aloud at your natural pace, and ReelPrompt sets the scroll speed automatically.",
  },
  {
    emoji: "🎬",
    title: "Record",
    body: "Press the red button for a 3-2-1 countdown, then read. The script scrolls over your camera preview — the recorded video contains only you, no text overlay.",
  },
  {
    emoji: "💾",
    title: "Save and share",
    body: "Download the clean video when done and upload it directly to Instagram, TikTok, or wherever you publish.",
  },
  {
    emoji: "📲",
    title: "Install as an app",
    body: "Add ReelPrompt to your home screen for instant access.\n\niOS: tap the Share button in Safari → \"Add to Home Screen\".\n\nAndroid: tap the menu (⋮) in Chrome → \"Add to Home Screen\" or \"Install app\".",
  },
];

// ── Carousel guide ────────────────────────────────────────────────────────

function HowToGuide() {
  const [current, setCurrent] = useState(0);
  const total = GUIDE_STEPS.length;
  const step  = GUIDE_STEPS[current];

  const prev = () => setCurrent((i) => Math.max(0, i - 1));
  const next = () => setCurrent((i) => Math.min(total - 1, i + 1));

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Card body */}
      <div style={{ padding: "20px 20px 16px", minHeight: 160 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--bg)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>
            {step.emoji}
          </div>
          <span style={{
            fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-3)",
            letterSpacing: "0.1em",
          }}>
            {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1.3 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, whiteSpace: "pre-line" }}>
          {step.body}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderTop: "1px solid var(--border)",
        background: "var(--bg-2)",
      }}>
        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {GUIDE_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 18 : 6,
                height: 6, borderRadius: 3, border: "none",
                background: i === current ? "var(--accent)" : "var(--border-2)",
                cursor: "pointer", padding: 0,
                transition: "width 0.2s, background 0.2s",
              }}
            />
          ))}
        </div>

        {/* Arrow buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={prev}
            disabled={current === 0}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--surface)", color: current === 0 ? "var(--text-3)" : "var(--text)",
              cursor: current === 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, transition: "opacity 0.15s",
              opacity: current === 0 ? 0.35 : 1,
            }}
          >‹</button>
          <button
            onClick={next}
            disabled={current === total - 1}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
              background: current === total - 1 ? "var(--surface)" : "var(--accent)",
              color: "white",
              cursor: current === total - 1 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, transition: "background 0.15s",
              opacity: current === total - 1 ? 0.35 : 1,
            }}
          >›</button>
        </div>
      </div>
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

// ── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <div style={{
      padding: "20px 24px",
      paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px) + 16px)",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexShrink: 0,
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

  const handleCreate = () => { const s = create(); setActiveScript(s); setView("editor"); };
  const handleEdit   = (s: Script) => { setActiveScript(s); setView("editor"); };
  const handleSave   = (s: Script) => { const u = save(s); setActiveScript(u); return u; };
  const handleStartTeleprompter = (s: Script) => { setActiveScript(s); setView("teleprompter"); };
  const handleSettingsChange    = (s: TeleprompterSettings) => { setSettings(s); saveSettings(s); };

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
  const filtered   = query.trim()
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

  // ── Shared top section ───────────────────────────────────────────────────
  const topPadding = "max(56px, env(safe-area-inset-top, 0px) + 40px)";

  // ── EMPTY STATE ──────────────────────────────────────────────────────────
  if (!hasScripts) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: `0 24px`, paddingTop: topPadding }}>

            {/* Brand */}
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28,
            }}>ReelPrompt</div>

            {/* Guide carousel — fixed at top */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-3)",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
              }}>How it works</div>
              <HowToGuide />
            </div>

            {/* CTA */}
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", textAlign: "center",
              gap: 14, paddingBottom: 48,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: "var(--surface)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>🎬</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Ready to record?</h2>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Create your first script and start recording like a pro.
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleCreate}>
                <IconPlus /> Create your first script
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── SCRIPTS LIST ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "0 24px", paddingTop: topPadding }}>

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

          {/* Guide carousel */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-3)",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
            }}>How it works</div>
            <HowToGuide />
          </div>

          {/* Search — only when 3+ scripts */}
          {scripts.length >= 3 && (
            <SearchBar value={query} onChange={setQuery} />
          )}

          {/* Script cards */}
          {filtered.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 40 }}>
              {filtered.map((s) => (
                <ScriptCard key={s.id} script={s} onEdit={handleEdit} onDuplicate={duplicate} onDelete={remove} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 14 }}>
              No scripts match "{query}"
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
