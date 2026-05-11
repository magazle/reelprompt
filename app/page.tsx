"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Script, TeleprompterSettings } from "./lib/types";
import { getSettings, saveSettings } from "./lib/storage";
import { useScripts } from "./hooks/useScripts";
import { countWords } from "./lib/utils";
import ScriptCard from "./components/ScriptCard";
import ScriptEditor from "./components/ScriptEditor";
import TeleprompterView from "./components/TeleprompterView";
import { IconPlus } from "./components/Icons";

type View = "list" | "editor" | "teleprompter";
type SortOrder = "recent" | "oldest" | "az";

const GUIDE_STEPS = [
  {
    emoji: "✍️",
    title: "Write",
    body: "Type or paste Markdown. Use the toolbar for bold, colours and headings.",
  },
  {
    emoji: "⚡",
    title: "Calibrate",
    body: "Tap Calibrate, read aloud, and ReelPrompt sets scroll speed to your pace.",
  },
  {
    emoji: "🎬",
    title: "Record",
    body: "3-2-1 countdown, then read. The overlay never appears in the video.",
  },
  {
    emoji: "💾",
    title: "Save",
    body: "Download the clean video and upload to Instagram, TikTok or YouTube.",
  },
];


// ── PWA Install Banner ────────────────────────────────────────────────────
// Android/Chrome: captures the beforeinstallprompt event and shows a button.
// iOS Safari: detects the platform and shows manual instructions.
// Dismissed state persists for the session only (no localStorage — not worth
// the friction of a permanent dismiss that blocks future installs).

function useInstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(standalone);
    if (standalone) return;

    // iOS detection (no beforeinstallprompt support)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Android / Chrome / Edge — capture the prompt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      promptRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!promptRef.current) return;
    promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      promptRef.current = null;
    }
  }, []);

  // canShowTip covers browsers that support neither beforeinstallprompt (Chrome/Edge)
  // nor the iOS Safari path — e.g. Brave, Firefox, Samsung Internet.
  // We show a generic manual tip so the user always has a path to install.
  const canShowTip = !isStandalone && !canInstall && !isIOS;

  return { canInstall, isIOS, isStandalone, canShowTip, triggerInstall };
}

function InstallBanner() {
  const { canInstall, isIOS, isStandalone, canShowTip, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isStandalone || dismissed) return null;

  if (canInstall) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "12px 16px",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, marginBottom: 20, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📲</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Add to Home Screen</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Use offline, fullscreen</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={triggerInstall}
            className="btn btn-primary"
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10 }}
          >
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="btn btn-icon"
            style={{ width: 36, height: 36, borderRadius: 10, fontSize: 16 }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 12, padding: "12px 16px",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, marginBottom: 20, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📲</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Add to Home Screen</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
              Tap <strong style={{ color: "var(--text-2)" }}>Share</strong> → <strong style={{ color: "var(--text-2)" }}>Add to Home Screen</strong>
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="btn btn-icon"
          style={{ width: 36, height: 36, borderRadius: 10, fontSize: 16, flexShrink: 0 }}
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }

  if (canShowTip) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "11px 14px",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📲</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Add to Home Screen</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              Browser menu → <strong style={{ color: "var(--text-2)" }}>Install app</strong> or <strong style={{ color: "var(--text-2)" }}>Add to Home Screen</strong>
            </div>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="btn btn-icon"
          style={{ width: 36, height: 36, borderRadius: 10, fontSize: 15, flexShrink: 0 }}
          title="Dismiss">
          ✕
        </button>
      </div>
    );
  }

  return null;
}

// ── How-it-works carousel ─────────────────────────────────────────────────
// Shows 3 cards at a time; the arrow advances by 1 and wraps back to start.

function HowToGuide() {
  const [offset, setOffset] = useState(0);
  const visible = 3;
  const max = GUIDE_STEPS.length - visible; // 2

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
      {/* Cards */}
      <div style={{ flex: 1, display: "flex", gap: 8, overflow: "hidden" }}>
        {GUIDE_STEPS.slice(offset, offset + visible).map((step, i) => (
          <div key={offset + i} style={{
            flex: 1, minWidth: 0,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "12px 12px 14px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <span style={{ fontSize: 18 }}>{step.emoji}</span>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
              {step.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5, whiteSpace: "pre-line" }}>
              {step.body}
            </div>
          </div>
        ))}
      </div>

      {/* Advance arrow */}
      <button
        onClick={() => setOffset((o) => (o >= max ? 0 : o + 1))}
        style={{
          flexShrink: 0, width: 36, alignSelf: "stretch",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-2)", fontSize: 16, transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
        title={offset >= max ? "Back to start" : "Next"}
      >
        {offset >= max ? "↺" : "›"}
      </button>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search" placeholder="Search scripts…" value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, color: "var(--text)", fontFamily: "var(--font-display)",
          fontSize: 14, padding: "10px 14px 10px 38px", outline: "none", transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      {value && (
        <button onClick={() => onChange("")} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-3)", fontSize: 16, lineHeight: 1, padding: 2,
        }}>×</button>
      )}
    </div>
  );
}

// ── Sort toggle ───────────────────────────────────────────────────────────

const SORT_LABELS: Record<SortOrder, string> = { recent: "Recent", oldest: "Oldest", az: "A–Z" };
const SORT_CYCLE: SortOrder[] = ["recent", "oldest", "az"];

function SortButton({ sort, onToggle }: { sort: SortOrder; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title="Change sort order"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)",
        background: "none", border: "1px solid var(--border)", borderRadius: 8,
        cursor: "pointer", padding: "5px 10px", transition: "color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      ↕ {SORT_LABELS[sort]}
    </button>
  );
}

// ── Footer (hidden on narrow mobile) ─────────────────────────────────────

function Footer() {
  return (
    <div style={{
      padding: "16px 24px",
      paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px) + 12px)",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
        © 2026 Leo Magazzu
      </span>
      <a href="https://github.com/magazle/reelprompt" target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.15s" }}
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

// ── Root ──────────────────────────────────────────────────────────────────

export default function Home() {
  const { scripts, create, save, remove, duplicate } = useScripts();
  const [view, setView]                 = useState<View>("list");
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  // Lazy initialiser: getSettings() is synchronous — no useEffect, no null flash
  const [settings, setSettings]         = useState<TeleprompterSettings>(getSettings);
  const [query, setQuery]               = useState("");
  const [sort, setSort]                 = useState<SortOrder>("recent");

  const handleCreate = () => { const s = create(); setActiveScript(s); setView("editor"); };
  const handleEdit   = (s: Script) => { setActiveScript(s); setView("editor"); };
  const handleSave   = (s: Script) => { const u = save(s); setActiveScript(u); return u; };
  const handleRecord = useCallback((s: Script) => { setActiveScript(s); setView("teleprompter"); }, []);
  const handleStartTeleprompter = (s: Script) => { setActiveScript(s); setView("teleprompter"); };
  // Single source of truth for settings persistence — components only call onSettingsChange
  const handleSettingsChange = (s: TeleprompterSettings) => { setSettings(s); saveSettings(s); };
  const cycleSort = () => setSort((s) => SORT_CYCLE[(SORT_CYCLE.indexOf(s) + 1) % SORT_CYCLE.length]);

  if (view === "teleprompter" && activeScript) {
    return <TeleprompterView script={activeScript} settings={settings} onSettingsChange={handleSettingsChange} onBack={() => setView("editor")} />;
  }

  if (view === "editor" && activeScript) {
    return <ScriptEditor script={activeScript} settings={settings} onSave={handleSave} onBack={() => setView("list")} onStartTeleprompter={handleStartTeleprompter} onSettingsChange={handleSettingsChange} />;
  }

  const hasScripts  = scripts.length > 0;
  const totalWords  = scripts.reduce((acc, s) => acc + countWords(s.body), 0);

  // Filter
  const afterFilter = query.trim()
    ? scripts.filter((s) => {
        const q = query.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.body.replace(/<[^>]*>/g, " ").toLowerCase().includes(q);
      })
    : scripts;

  // Sort
  const filtered = [...afterFilter].sort((a, b) => {
    if (sort === "oldest") return a.updatedAt - b.updatedAt;
    if (sort === "az")     return a.title.localeCompare(b.title);
    return b.updatedAt - a.updatedAt; // recent (default)
  });

  const topPad = "max(56px, env(safe-area-inset-top, 0px) + 40px)";

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

  // ── Empty state (no scripts yet) ─────────────────────────────────────────

  if (!hasScripts) {
    return (
      <div style={shell}>
        <div style={scroller}>
          <div style={{ padding: "0 24px 40px", paddingTop: topPad }}>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28 }}>
              ReelPrompt
            </div>

            {/* PWA install prompt */}
            <InstallBanner />

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                How it works
              </div>
              <HowToGuide />
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✍️</div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Write your first script</h2>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Write or paste your script, calibrate your speed, then record.
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

  // ── List state ────────────────────────────────────────────────────────────

  return (
    <div style={shell}>
      <div style={scroller}>
        <div style={{ padding: "0 24px 40px", paddingTop: topPad }}>

          {/* Header — title, stats badges, and New button all in one row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>ReelPrompt</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                  Your Scripts
                </h1>
                <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  {scripts.length} · {totalWords.toLocaleString()} words
                </span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ borderRadius: 14, flexShrink: 0 }} onClick={handleCreate}>
              <IconPlus /> New
            </button>
          </div>

          {/* PWA install prompt */}
          <InstallBanner />

          {/* Search + sort — always visible once there are scripts */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <SortButton sort={sort} onToggle={cycleSort} />
            </div>
          </div>

          {/* How-it-works — only shown to first-time users; hidden once scripts exist and user has seen it */}
          {/* Collapsed behind a disclosure after first script — show it only on the empty state */}

          {/* Cards */}
          {filtered.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((s) => (
                <ScriptCard
                  key={s.id}
                  script={s}
                  onEdit={handleEdit}
                  onDuplicate={duplicate}
                  onDelete={remove}
                  onRecord={handleRecord}
                />
              ))}
            </div>
          ) : (
            /* Empty search result state */
            <div style={{ textAlign: "center", padding: "48px 0 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No scripts match "{query}"</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>Try a different search term or create a new script.</p>
              <button className="btn btn-ghost" onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
