"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Script, TeleprompterSettings } from "./lib/types";
import { getSettings, saveSettings } from "./lib/storage";
import { useScripts } from "./hooks/useScripts";
import { countWords, readTimeSec, formatClock } from "./lib/utils";
import ScriptCard from "./components/ScriptCard";
import ScriptEditor from "./components/ScriptEditor";
import TeleprompterView from "./components/TeleprompterView";
import PrompterView from "./components/PrompterView";
import MoreView from "./components/AccountView";
import { IconPlus } from "./components/Icons";

type View = "list" | "editor" | "teleprompter" | "prompter" | "more";
type SortOrder = "recent" | "oldest" | "az";


// ── PWA Install Banner ────────────────────────────────────────────────────

function useInstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(standalone);
    if (standalone) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios/i.test(navigator.userAgent);
    setIsIOS(ios);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => { e.preventDefault(); promptRef.current = e; setCanInstall(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!promptRef.current) return;
    promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === "accepted") { setCanInstall(false); promptRef.current = null; }
  }, []);

  const canShowTip = !isStandalone && !canInstall && !isIOS;
  return { canInstall, isIOS, isStandalone, canShowTip, triggerInstall };
}

function InstallBanner() {
  const { canInstall, isIOS, isStandalone, canShowTip, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  if (isStandalone || dismissed) return null;

  if (canInstall) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 20, marginBottom: 20, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Add to Home Screen</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Use offline, fullscreen</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={triggerInstall} className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>Install</button>
        <button onClick={() => setDismissed(true)} className="btn btn-icon" style={{ width: 40, height: 40, fontSize: 16 }} aria-label="Dismiss">✕</button>
      </div>
    </div>
  );

  if (isIOS) return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 20, marginBottom: 20, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Add to Home Screen</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>Tap <strong style={{ color: "var(--text-2)" }}>Share</strong> → <strong style={{ color: "var(--text-2)" }}>Add to Home Screen</strong></div>
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="btn btn-icon" style={{ width: 40, height: 40, fontSize: 16, flexShrink: 0 }} aria-label="Dismiss">✕</button>
    </div>
  );

  if (canShowTip) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 14px", background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Add to Home Screen</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Browser menu → <strong style={{ color: "var(--text-2)" }}>Install app</strong> or <strong style={{ color: "var(--text-2)" }}>Add to Home Screen</strong></div>
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="btn btn-icon" style={{ width: 40, height: 40, fontSize: 15, flexShrink: 0 }} aria-label="Dismiss">✕</button>
    </div>
  );

  return null;
}


// ── Logo ──────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div aria-hidden="true" style={{ width: 28, height: 20, borderRadius: 5, border: "2px solid var(--ink)", background: "var(--stripes)" }} />
      <div style={{ fontFamily: "var(--font-headline)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>ReelPrompt</div>
    </div>
  );
}

const MenuIcon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICON_HELP  = "M12 17h.01M9.1 9a3 3 0 1 1 4.4 2.6c-.9.5-1.5 1.1-1.5 2.1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z";
const ICON_TRASH = "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3";
const ICON_MAIL  = "M4 6h16v12H4zM4 7l8 6 8-6";

// ── Search bar ────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"
        style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
        <circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16" y2="16" />
      </svg>
      <input type="search" placeholder="Search scripts" aria-label="Search scripts" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: 48, background: "var(--bg-2)", border: "2px solid transparent", borderRadius: 24, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 15, padding: "0 40px 0 42px", outline: "none", transition: "border-color 0.15s" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ink)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
      />
      {value && <button onClick={() => onChange("")} aria-label="Clear search" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 18, lineHeight: 1 }}>×</button>}
    </div>
  );
}

// ── Sort chips ────────────────────────────────────────────────────────────

const SORT_LABELS: Record<SortOrder, string> = { recent: "Recent", oldest: "Oldest", az: "A–Z" };
const SORT_CYCLE: SortOrder[] = ["recent", "oldest", "az"];

function SortChips({ sort, onChange }: { sort: SortOrder; onChange: (s: SortOrder) => void }) {
  return (
    <div role="group" aria-label="Sort scripts" style={{ display: "flex", gap: 8 }}>
      {SORT_CYCLE.map((key) => {
        const active = key === sort;
        return (
          <button key={key} onClick={() => onChange(key)} aria-pressed={active}
            style={{ height: 36, padding: "0 14px", borderRadius: 18, cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600,
              background: active ? "var(--ink)" : "var(--surface)", color: active ? "#FFFFFF" : "var(--ink)",
              border: active ? "2px solid var(--ink)" : "2px solid var(--border)" }}>
            {SORT_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}


// ── How To Use modal ─────────────────────────────────────────────────────

const HOW_TO_STEPS = [
  { title: "Write your script", body: "Type or paste your script in the editor. Use the toolbar for bold, italic, colour highlights and bullet lists." },
  { title: "Calibrate your speed", body: "Tap Calibrate in the editor footer, press Start and read aloud at your natural pace, then press Done. ReelPrompt sets the scroll speed automatically." },
  { title: "Record", body: "Tap ▶ on any script card to open the teleprompter. A 3-2-1 countdown gives you time to compose yourself — the script scrolls over your camera preview. The text is never captured in the video." },
  { title: "Save and share", body: "When you stop recording you get a clean video — no overlay, just you. Download it and upload directly to Instagram, TikTok, YouTube or wherever you publish." },
];

function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,31,20,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", borderTop: "1px solid var(--border)", width: "100%", maxWidth: 560, maxHeight: "92dvh", display: "flex", flexDirection: "column", animation: "slide-up 0.3s ease forwards" }} onClick={(e) => e.stopPropagation()}>
        {/* drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-2)" }} />
        </div>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0 }}>How it works</h2>
          <button onClick={onClose} aria-label="Close" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {/* scrollable body */}
        <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>

          {/* What is a teleprompter */}
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
              A <strong>teleprompter</strong> scrolls your script in front of the camera so you can speak naturally without memorizing lines — the same tool used by news anchors and professional video creators. ReelPrompt brings it to your phone, for free.
            </p>
          </div>

          {/* Steps */}
          {HOW_TO_STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: "var(--font-mono)" }}>{i + 1}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{step.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}

          {/* Install tip */}
          <div style={{ margin: "16px 20px 0", padding: "14px 16px", background: "var(--bg-2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
              Tip: install ReelPrompt on your home screen for fullscreen recording without the browser bar.
            </p>
          </div>

          <div style={{ padding: "20px 20px 0" }}>
            <a href="/help"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "11px 0", borderRadius: 12, background: "var(--bg-2)", color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12, textDecoration: "none", marginBottom: 20 }}>
              Need help? Visit the Help Desk →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <div style={{ padding: "16px 24px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px) + 12px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0, maxWidth: 600, width: "100%", margin: "0 auto" }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>© 2026 Leo Magazzu</span>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <a href="/help" style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}>
          Help
        </a>
        <a href="/privacy" style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}>
          Privacy
        </a>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function Home() {
  const { scripts, deletedScripts, create, save, remove, restore, permanentRemove, duplicate } = useScripts();
  const [view, setView]                 = useState<View>("list");
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [settings, setSettings]         = useState<TeleprompterSettings>(getSettings);
  const [query, setQuery]               = useState("");
  const [sort, setSort]                 = useState<SortOrder>("recent");
  const [showHowTo, setShowHowTo]       = useState(false);
  const [showMenu, setShowMenu]         = useState(false);

  const handleCreate = () => {
    const s = create();
    setActiveScript(s);
    setView("editor");
  };
  const handleEdit   = (s: Script) => { setActiveScript(s); setView("editor"); };
  const handleSave   = (s: Script) => { const u = save(s); setActiveScript(u); return u; };
  const handleRecord = useCallback((s: Script) => { setActiveScript(s); setView("teleprompter"); }, []);
  const handleStartTeleprompter = (s: Script) => { setActiveScript(s); setView("teleprompter"); };
  const handleSettingsChange = (s: TeleprompterSettings) => { setSettings(s); saveSettings(s); };
  const cycleSort = () => setSort((s) => SORT_CYCLE[(SORT_CYCLE.indexOf(s) + 1) % SORT_CYCLE.length]);

  // ── Views ─────────────────────────────────────────────────────────────────

  if (view === "more") {
    return <MoreView onBack={() => setView("list")} deletedScripts={deletedScripts} onRestore={restore} onPermanentDelete={permanentRemove} />;
  }
  if (view === "prompter" && activeScript) {
    return <PrompterView script={activeScript} settings={settings} onSettingsChange={handleSettingsChange} onBack={() => setView("editor")} />;
  }
  if (view === "teleprompter" && activeScript) {
    return <TeleprompterView script={activeScript} settings={settings} onSettingsChange={handleSettingsChange} onBack={() => setView("editor")} />;
  }
  if (view === "editor" && activeScript) {
    return <ScriptEditor script={activeScript} settings={settings} onSave={handleSave} onBack={() => setView("list")} onStartTeleprompter={handleStartTeleprompter} onStartTextOnly={(s: Script) => { setActiveScript(s); setView("prompter"); }} onSettingsChange={handleSettingsChange} />;
  }

  const hasScripts = scripts.length > 0;
  const totalWords = scripts.reduce((acc, s) => acc + countWords(s.body), 0);
  const totalClock = formatClock(readTimeSec(totalWords, settings.wpm));
  const mostRecentId = scripts.reduce<Script | null>((a, s) => (!a || s.updatedAt > a.updatedAt ? s : a), null)?.id;

  const afterFilter = query.trim()
    ? scripts.filter((s) => { const q = query.toLowerCase(); return s.title.toLowerCase().includes(q) || s.body.replace(/<[^>]*>/g, " ").toLowerCase().includes(q); })
    : scripts;

  const filtered = [...afterFilter].sort((a, b) => {
    if (sort === "oldest") return a.updatedAt - b.updatedAt;
    if (sort === "az")     return a.title.localeCompare(b.title);
    return b.updatedAt - a.updatedAt;
  });

  const topPad = "max(56px, env(safe-area-inset-top, 0px) + 40px)";
  const shell: React.CSSProperties = { height: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" };
  const scroller: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };

  const hamburgerBtn: React.CSSProperties = { height: 44, width: 44, borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--ink)", color: "var(--ink)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-display)" };
  const menuItem: React.CSSProperties = { width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 12, border: "none", background: "none", color: "var(--text)", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 };
  const newScriptBar = (
    <div style={{ padding: "12px 20px 4px", flexShrink: 0, maxWidth: 600, width: "100%", margin: "0 auto" }}>
      <button className="btn" onClick={handleCreate}
        style={{ width: "100%", height: 58, borderRadius: 29, background: "var(--ink)", color: "#FFFFFF", fontSize: 16 }}>
        <IconPlus /> New script
      </button>
    </div>
  );

  const headerRight = (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setShowMenu((v) => !v)} style={hamburgerBtn} aria-label="Menu" aria-expanded={showMenu}>
        {showMenu ? "✕" : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>}
      </button>
      {showMenu && (
        <>
          {/* backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setShowMenu(false)} />
          {/* dropdown */}
          <div style={{ position: "absolute", top: 46, right: 0, zIndex: 99, background: "var(--surface)", border: "2px solid var(--ink)", borderRadius: 18, padding: 6, minWidth: 210, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", animation: "scale-in 0.15s ease forwards", transformOrigin: "top right" }}>
            <button onClick={() => { setShowMenu(false); setTimeout(() => setShowHowTo(true), 50); }} style={menuItem}>
              <MenuIcon d={ICON_HELP} /> How it works
            </button>
            <div style={{ height: 1, background: "var(--border)", margin: "4px 6px" }} />
            <button onClick={() => { setShowMenu(false); setTimeout(() => setView("more"), 50); }} style={menuItem}>
              <MenuIcon d={ICON_TRASH} /> Deleted scripts{deletedScripts.length > 0 ? ` (${deletedScripts.length})` : ""}
            </button>
            <button onClick={() => { setShowMenu(false); setTimeout(() => setView("more"), 50); }} style={menuItem}>
              <MenuIcon d={ICON_MAIL} /> Help & support
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────────

  const page: React.CSSProperties = { padding: "0 20px 32px", paddingTop: topPad, maxWidth: 600, margin: "0 auto" };

  if (!hasScripts) {
    return (
      <div style={shell}>
        <div style={scroller}>
          <div style={page}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <Logo />
              {headerRight}
            </div>
            <InstallBanner />
            <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 0.95, margin: "8px 0 14px" }}>Every take starts with a script.</h1>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.5, margin: 0, maxWidth: 420 }}>
              Write or paste it, calibrate your reading speed, then record with the text scrolling over your camera.
            </p>
          </div>
        </div>
        {newScriptBar}
        <Footer />
        {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
      </div>
    );
  }

  // ── List state ────────────────────────────────────────────────────────────

  return (
    <div style={shell}>
      <div style={scroller}>
        <div style={page}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Logo />
            {headerRight}
          </div>
          <InstallBanner />
          <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 0.95, margin: "0 0 8px" }}>Ready<br />for a take?</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 20px" }}>
            {scripts.length} {scripts.length === 1 ? "script" : "scripts"}, {totalClock} of reading
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {scripts.length > 3 && <SearchBar value={query} onChange={setQuery} />}
            <SortChips sort={sort} onChange={setSort} />
          </div>
          {filtered.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((s) => (
                <ScriptCard key={s.id} script={s} highlight={s.id === mostRecentId} onEdit={handleEdit} onDuplicate={duplicate} onDelete={remove} onRecord={handleRecord} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 0 24px" }}>
              <p style={{ fontFamily: "var(--font-headline)", fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>No script matches &ldquo;{query}&rdquo;</p>
              <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 20px" }}>Search looks in titles and script text.</p>
              <button className="btn btn-ghost" onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </div>
      </div>
      {newScriptBar}
      <Footer />
      {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
    </div>
  );
}
