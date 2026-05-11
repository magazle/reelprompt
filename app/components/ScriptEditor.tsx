"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Script, TeleprompterSettings } from "../lib/types";
import { saveSettings } from "../lib/storage";
import {
  IconBack, IconCheck, IconBold, IconItalic,
  IconList, IconEraser, IconSettings, IconTarget,
} from "./Icons";
import SettingsPanel from "./SettingsPanel";

interface Props {
  script: Script;
  settings: TeleprompterSettings;
  onSave: (s: Script) => Script;
  onBack: () => void;
  onStartTeleprompter: (s: Script) => void;
  onSettingsChange: (s: TeleprompterSettings) => void;
}

const COLOURS = [
  { label: "White",  value: "#f0f0f0" },
  { label: "Yellow", value: "#FFD60A" },
  { label: "Red",    value: "#FF453A" },
  { label: "Green",  value: "#30D158" },
  { label: "Blue",   value: "#64D2FF" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function htmlToPlain(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(html: string): number {
  const plain = htmlToPlain(html);
  return plain ? plain.split(" ").length : 0;
}

function readTimeSec(words: number, wpm: number | null) {
  return Math.round((words / (wpm ?? 130)) * 60);
}

function formatReadTime(secs: number) {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

// ── Markdown live transformer ─────────────────────────────────────────────
// Called on Space and Enter keydown inside the contentEditable.
// Inspects the current text node for Markdown patterns and transforms them.
function applyMarkdownTransform(e: React.KeyboardEvent<HTMLDivElement>): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  const node  = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return false;

  const text   = node.textContent ?? "";
  const offset = range.startOffset;
  // Only look at text before the caret
  const before = text.slice(0, offset);

  // ── Inline patterns (applied on Space) ──
  if (e.key === " ") {
    // **bold** → <strong>
    const boldMatch = before.match(/\*\*(.+)\*\*$/);
    if (boldMatch) {
      e.preventDefault();
      const matched = boldMatch[0];
      const inner   = boldMatch[1];
      const start   = offset - matched.length;
      // Replace the markdown syntax with a bold node + space
      const r = document.createRange();
      r.setStart(node, start);
      r.setEnd(node, offset);
      r.deleteContents();
      const strong = document.createElement("strong");
      strong.textContent = inner;
      r.insertNode(strong);
      // Move caret after strong, insert space
      const space = document.createTextNode(" ");
      strong.after(space);
      sel.collapse(space, 1);
      return true;
    }

    // *italic* → <em>
    const italicMatch = before.match(/(?<!\*)\*(?!\*)(.+)(?<!\*)\*(?!\*)$/);
    if (italicMatch) {
      e.preventDefault();
      const matched = italicMatch[0];
      const inner   = italicMatch[1];
      const start   = offset - matched.length;
      const r = document.createRange();
      r.setStart(node, start);
      r.setEnd(node, offset);
      r.deleteContents();
      const em = document.createElement("em");
      em.textContent = inner;
      r.insertNode(em);
      const space = document.createTextNode(" ");
      em.after(space);
      sel.collapse(space, 1);
      return true;
    }
  }

  // ── Block patterns (applied on Space, triggered at start of line) ──
  if (e.key === " ") {
    // "- " → bullet list item
    if (before === "-") {
      e.preventDefault();
      // Delete the "-" character
      const r = document.createRange();
      r.setStart(node, offset - 1);
      r.setEnd(node, offset);
      r.deleteContents();
      document.execCommand("insertUnorderedList");
      return true;
    }

    // "# " → H1 (large bold block)
    if (before === "#") {
      e.preventDefault();
      const r = document.createRange();
      r.setStart(node, offset - 1);
      r.setEnd(node, offset);
      r.deleteContents();
      document.execCommand("formatBlock", false, "h1");
      return true;
    }

    // "## " → H2
    if (before === "##") {
      e.preventDefault();
      const r = document.createRange();
      r.setStart(node, offset - 2);
      r.setEnd(node, offset);
      r.deleteContents();
      document.execCommand("formatBlock", false, "h2");
      return true;
    }
  }

  return false;
}

// ── Toolbar button ────────────────────────────────────────────────────────

function ToolbarBtn({ active, title, onClick, children }: {
  active?: boolean; title: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
        background: active ? "var(--accent)" : "var(--surface-2)",
        color: active ? "white" : "var(--text-2)",
        flexShrink: 0, transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── WPM Calibrator overlay ────────────────────────────────────────────────

type CalState = "idle" | "running" | "done";

function WPMCalibrator({ script, currentWpm, onCalibrated, onClose }: {
  script: Script;
  currentWpm: number | null;
  onCalibrated: (wpm: number, speed: number) => void;
  onClose: () => void;
}) {
  const [state, setState]     = useState<CalState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const plainText = htmlToPlain(script.body);
  const wordCount = plainText.trim().split(/\s+/).length;

  const handleStart = useCallback(() => {
    setState("running");
    startRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 200);
  }, []);

  const handleDone = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const seconds = (Date.now() - startRef.current) / 1000;
    if (seconds < 2) return;
    const wpm   = Math.round((wordCount / seconds) * 60);
    const speed = parseFloat(
      Math.min(10, Math.max(1, ((wpm - 80) / 160) * 9 + 1)).toFixed(1)
    );
    setState("done");
    onCalibrated(wpm, speed);
  }, [wordCount, onCalibrated]);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <button className="btn btn-icon" onClick={onClose}><IconBack /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Calibrate Speed</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            Read your script aloud · timer only, no microphone
          </div>
        </div>
        {currentWpm && (
          <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)", display: "flex", gap: 4, alignItems: "center" }}>
            <span>✓</span> {currentWpm} WPM
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        margin: "16px 20px 0",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "12px 16px",
        display: "flex", gap: 12, alignItems: "flex-start", flexShrink: 0,
      }}>
        <span style={{ fontSize: 20 }}>⏱</span>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          {state === "idle" && <>Press <strong style={{ color: "var(--text)" }}>Start</strong> then read your entire script aloud at your natural pace. Read <strong style={{ color: "var(--text)" }}>the whole script</strong> — the timer needs the full reading to calculate your WPM accurately. Press <strong style={{ color: "var(--text)" }}>Done</strong> when you finish the last word.</>}
          {state === "running" && <>Keep reading… Press <strong style={{ color: "var(--text)" }}>Done</strong> when you finish <strong style={{ color: "var(--text)" }}>the last word</strong>.</>}
          {state === "done" && <>Scroll speed has been set automatically. You can fine-tune it in Settings at any time.</>}
        </div>
      </div>

      {/* Script text */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        <div
          style={{
            fontSize: 17, lineHeight: 1.8,
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            color: "var(--text)",
            opacity: state === "idle" ? 0.6 : 1,
            transition: "opacity 0.3s", wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{ __html: script.body }}
        />
      </div>

      {/* Footer */}
      <div style={{
        padding: "16px 20px", borderTop: "1px solid var(--border)",
        background: "var(--bg-2)", flexShrink: 0,
        display: "flex", gap: 12, alignItems: "center",
      }}>
        {state === "running" && (
          <div style={{
            fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 700,
            color: "var(--accent)", letterSpacing: "0.04em", minWidth: 64,
          }}>{elapsed}s</div>
        )}
        {state === "idle" && (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 15 }} onClick={handleStart}>
            ▶ Start Reading
          </button>
        )}
        {state === "running" && (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 15 }} onClick={handleDone}>
            ✓ Done — finished reading
          </button>
        )}
        {state === "done" && (
          <div style={{ flex: 1, display: "flex", gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setState("idle"); setElapsed(0); }}>
              Re-calibrate
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
              Done ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ScriptEditor ─────────────────────────────────────────────────────

export default function ScriptEditor({
  script, settings, onSave, onBack, onStartTeleprompter, onSettingsChange,
}: Props) {
  const [title, setTitle]               = useState(script.title);
  const [saved, setSaved]               = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalibrator, setShowCalibrator] = useState(false);
  const [isBold, setIsBold]             = useState(false);
  const [isItalic, setIsItalic]         = useState(false);
  const [wordCount, setWordCount]       = useState(countWords(script.body));

  const editorRef      = useRef<HTMLDivElement>(null);
  const saveTimerRef   = useRef<NodeJS.Timeout | null>(null);
  const currentScript  = useRef(script);
  currentScript.current = script;

  // Inject saved HTML on first mount only
  useEffect(() => {
    if (editorRef.current && script.body) {
      editorRef.current.innerHTML = script.body;
      setWordCount(countWords(script.body));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSave = useCallback((html: string, t: string) => {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const updated = onSave({ ...currentScript.current, title: t, body: html });
      currentScript.current = updated;
      setSaved(true);
    }, 800);
  }, [onSave]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setWordCount(countWords(html));
    triggerSave(html, title);
  }, [title, triggerSave]);

  const handleTitleChange = (t: string) => {
    setTitle(t);
    triggerSave(editorRef.current?.innerHTML ?? "", t);
  };

  const updateToolbarState = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
  };

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateToolbarState();
    handleInput();
  };

  const applyColour = (hex: string) => {
    editorRef.current?.focus();
    if (hex === "#f0f0f0") document.execCommand("removeFormat", false);
    else document.execCommand("foreColor", false, hex);
    handleInput();
  };

  // ── Markdown live detection ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      const transformed = applyMarkdownTransform(e);
      if (transformed) {
        // Give the DOM a tick to settle then save
        setTimeout(handleInput, 0);
      }
    }
  }, [handleInput]);

  const handleStartRecording = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const html = editorRef.current?.innerHTML ?? "";
    const updated = onSave({ ...currentScript.current, title, body: html });
    currentScript.current = updated;
    setSaved(true);
    onStartTeleprompter({ ...currentScript.current, title, body: html });
  };

  const handleCalibrated = (wpm: number, speed: number) => {
    const updated = { ...settings, wpm, speed };
    onSettingsChange(updated);
    saveSettings(updated);
  };

  const handleSettingsChange = (s: TeleprompterSettings) => {
    onSettingsChange(s);
    saveSettings(s);
  };

  const hasContent = wordCount > 0;
  const readTime   = formatReadTime(readTimeSec(wordCount, settings.wpm));

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      background: "var(--bg)", overflow: "hidden", position: "relative",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <button className="btn btn-icon" onClick={onBack}><IconBack /></button>
        <input
          className="input"
          placeholder="Script title…"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          style={{
            flex: 1, background: "transparent", border: "none", padding: "4px 0",
            fontSize: 17, fontWeight: 700, borderRadius: 0,
            borderBottom: "1px solid var(--border)",
          }}
        />
        <div style={{
          fontSize: 11, color: saved ? "var(--green)" : "var(--text-3)",
          fontFamily: "var(--font-mono)", display: "flex", alignItems: "center",
          gap: 4, transition: "color 0.3s", flexShrink: 0,
        }}>
          {saved ? <><IconCheck /> saved</> : "saving…"}
        </div>
        <button className="btn btn-icon" title="Settings" onClick={() => setShowSettings(true)}>
          <IconSettings />
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)", flexShrink: 0, overflowX: "auto",
      }}>
        <ToolbarBtn active={isBold} title="Bold (or type **text**)" onClick={() => exec("bold")}>
          <IconBold />
        </ToolbarBtn>
        <ToolbarBtn active={isItalic} title="Italic (or type *text*)" onClick={() => exec("italic")}>
          <IconItalic />
        </ToolbarBtn>

        <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />

        {COLOURS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onMouseDown={(e) => { e.preventDefault(); applyColour(c.value); }}
            style={{
              width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--border-2)",
              background: c.value, cursor: "pointer", flexShrink: 0, transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ))}

        <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />

        <ToolbarBtn title="Bullet list (or type - )" onClick={() => exec("insertUnorderedList")}>
          <IconList />
        </ToolbarBtn>
        <ToolbarBtn title="Clear formatting" onClick={() => exec("removeFormat")}>
          <IconEraser />
        </ToolbarBtn>

        {/* Markdown hint */}
        <div style={{
          marginLeft: "auto", flexShrink: 0,
          fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em", whiteSpace: "nowrap", paddingRight: 4,
        }}>
          **bold** · *italic* · - list · # h1
        </div>
      </div>

      {/* ── RICH TEXT EDITOR ── */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onSelect={updateToolbarState}
          data-placeholder="Write your script here…&#10;&#10;Markdown works: **bold**, *italic*, - bullet, # heading&#10;Or use the toolbar above."
          className="rich-editor"
          style={{
            minHeight: "100%", padding: "20px",
            fontSize: 16, lineHeight: 1.7,
            color: "var(--text)", outline: "none",
            fontFamily: "var(--font-display)", wordBreak: "break-word",
          }}
        />
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderTop: "1px solid var(--border)",
        flexShrink: 0, background: "var(--bg-2)", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{wordCount}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginLeft: 4 }}>words</span>
          </div>
          {hasContent && (
            <div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{readTime}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginLeft: 4 }}>
                {settings.wpm ? `@ ${settings.wpm} WPM` : "est."}
              </span>
            </div>
          )}
          {hasContent && (
            <button
              title="Calibrate scroll speed to your reading pace"
              onClick={() => setShowCalibrator(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                color: settings.wpm ? "var(--green)" : "var(--accent)",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                textTransform: "uppercase",
              }}
            >
              <IconTarget />
              {settings.wpm ? "Re-calibrate" : "Calibrate"}
            </button>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={!hasContent}
          style={{ opacity: hasContent ? 1 : 0.4, whiteSpace: "nowrap" }}
          onClick={handleStartRecording}
        >
          Start Recording →
        </button>
      </div>

      {/* ── WPM CALIBRATOR OVERLAY ── */}
      {showCalibrator && hasContent && (
        <WPMCalibrator
          script={{ ...script, body: editorRef.current?.innerHTML ?? script.body }}
          currentWpm={settings.wpm}
          onCalibrated={handleCalibrated}
          onClose={() => setShowCalibrator(false)}
        />
      )}

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
