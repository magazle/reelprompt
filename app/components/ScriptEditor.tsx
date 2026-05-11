"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Script, TeleprompterSettings } from "../lib/types";
import { htmlToPlain, countWords, readTimeSec, formatReadTime } from "../lib/utils";
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

// ── Full Markdown → HTML parser ───────────────────────────────────────────
// Handles: # h1, ## h2, **bold**, *italic*, - bullet, > blockquote, ---, paragraphs

function parseInline(text: string): string {
  return text
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // *italic* (not preceded/followed by *)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
}

function markdownToHtml(md: string): string {
  const lines  = md.split("\n");
  const output: string[] = [];
  let inUl     = false;
  let inBq     = false;
  const bqLines: string[] = [];

  const flushBq = () => {
    if (bqLines.length) {
      output.push(`<blockquote>${bqLines.map(parseInline).join("<br>")}</blockquote>`);
      bqLines.length = 0;
      inBq = false;
    }
  };

  const flushUl = () => {
    if (inUl) { output.push("</ul>"); inUl = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trimEnd();

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      flushUl(); flushBq();
      output.push("<hr>");
      continue;
    }

    // H1
    if (/^# /.test(line)) {
      flushUl(); flushBq();
      output.push(`<h1>${parseInline(line.slice(2).trim())}</h1>`);
      continue;
    }

    // H2
    if (/^## /.test(line)) {
      flushUl(); flushBq();
      output.push(`<h2>${parseInline(line.slice(3).trim())}</h2>`);
      continue;
    }

    // Blockquote
    if (/^> /.test(line)) {
      flushUl();
      inBq = true;
      bqLines.push(line.slice(2).trim());
      continue;
    } else if (inBq) {
      flushBq();
    }

    // Bullet list
    if (/^[-*] /.test(line)) {
      if (!inUl) { output.push("<ul>"); inUl = true; }
      output.push(`<li>${parseInline(line.slice(2).trim())}</li>`);
      continue;
    } else {
      flushUl();
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      output.push("<br>");
      continue;
    }

    // Regular paragraph line
    output.push(`<p>${parseInline(line.trim())}</p>`);
  }

  flushUl();
  flushBq();

  return output.join("");
}

// ── Live Markdown shortcut transformer (keydown) ──────────────────────────
// Handles inline patterns on Space, block patterns on Space at line start.

function applyMarkdownTransform(e: React.KeyboardEvent<HTMLDivElement>): boolean {
  if (e.key !== " ") return false;

  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  const range  = sel.getRangeAt(0);
  const node   = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return false;

  const text   = node.textContent ?? "";
  const offset = range.startOffset;
  const before = text.slice(0, offset);

  // **bold**
  const boldMatch = before.match(/\*\*(.+)\*\*$/);
  if (boldMatch) {
    e.preventDefault();
    const r = document.createRange();
    r.setStart(node, offset - boldMatch[0].length);
    r.setEnd(node, offset);
    r.deleteContents();
    const el = document.createElement("strong");
    el.textContent = boldMatch[1];
    r.insertNode(el);
    const sp = document.createTextNode(" ");
    el.after(sp);
    sel.collapse(sp, 1);
    return true;
  }

  // *italic*
  const italicMatch = before.match(/(?<!\*)\*(?!\*)(.+)(?<!\*)\*(?!\*)$/);
  if (italicMatch) {
    e.preventDefault();
    const r = document.createRange();
    r.setStart(node, offset - italicMatch[0].length);
    r.setEnd(node, offset);
    r.deleteContents();
    const el = document.createElement("em");
    el.textContent = italicMatch[1];
    r.insertNode(el);
    const sp = document.createTextNode(" ");
    el.after(sp);
    sel.collapse(sp, 1);
    return true;
  }

  // - bullet (at line start)
  if (before === "-") {
    e.preventDefault();
    const r = document.createRange();
    r.setStart(node, offset - 1);
    r.setEnd(node, offset);
    r.deleteContents();
    document.execCommand("insertUnorderedList");
    return true;
  }

  // # h1
  if (before === "#") {
    e.preventDefault();
    const r = document.createRange();
    r.setStart(node, offset - 1);
    r.setEnd(node, offset);
    r.deleteContents();
    document.execCommand("formatBlock", false, "h1");
    return true;
  }

  // ## h2
  if (before === "##") {
    e.preventDefault();
    const r = document.createRange();
    r.setStart(node, offset - 2);
    r.setEnd(node, offset);
    r.deleteContents();
    document.execCommand("formatBlock", false, "h2");
    return true;
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

  const wordCount = countWords(script.body);

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
    const speed = parseFloat(Math.min(10, Math.max(1, ((wpm - 80) / 160) * 9 + 1)).toFixed(1));
    setState("done");
    onCalibrated(wpm, speed);
  }, [wordCount, onCalibrated]);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
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
            ✓ {currentWpm} WPM
          </div>
        )}
      </div>

      <div style={{
        margin: "16px 20px 0", background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "12px 16px",
        display: "flex", gap: 12, alignItems: "flex-start", flexShrink: 0,
      }}>
        <span style={{ fontSize: 20 }}>⏱</span>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          {state === "idle"    && <>Press <strong style={{ color: "var(--text)" }}>Start</strong> then read your entire script aloud. Read <strong style={{ color: "var(--text)" }}>the whole script</strong> — the timer needs the full reading to be accurate. Press <strong style={{ color: "var(--text)" }}>Done</strong> on the last word.</>}
          {state === "running" && <>Keep reading… press <strong style={{ color: "var(--text)" }}>Done</strong> on the <strong style={{ color: "var(--text)" }}>last word</strong>.</>}
          {state === "done"    && <>Speed set automatically. Fine-tune it in Settings anytime.</>}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        <div
          style={{
            fontSize: 17, lineHeight: 1.8,
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            color: "var(--text)", opacity: state === "idle" ? 0.6 : 1,
            transition: "opacity 0.3s", wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{ __html: script.body }}
        />
      </div>

      <div style={{
        padding: "16px 20px", borderTop: "1px solid var(--border)",
        background: "var(--bg-2)", flexShrink: 0,
        display: "flex", gap: 12, alignItems: "center",
      }}>
        {state === "running" && (
          <div style={{ fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)", minWidth: 64 }}>
            {elapsed}s
          </div>
        )}
        {state === "idle" && (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 15 }} onClick={handleStart}>▶ Start Reading</button>
        )}
        {state === "running" && (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 15 }} onClick={handleDone}>✓ Done — finished reading</button>
        )}
        {state === "done" && (
          <div style={{ flex: 1, display: "flex", gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setState("idle"); setElapsed(0); }}>Re-calibrate</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>Done ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── "MD" parse button icon ────────────────────────────────────────────────

function IconMD() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
      <text x="0" y="11" fontSize="11" fontFamily="monospace" fontWeight="700">MD</text>
    </svg>
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

  const editorRef     = useRef<HTMLDivElement>(null);
  const saveTimerRef  = useRef<NodeJS.Timeout | null>(null);
  const currentScript = useRef(script);
  currentScript.current = script;

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

  // ── Live shortcut handler ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " ") {
      const transformed = applyMarkdownTransform(e);
      if (transformed) setTimeout(handleInput, 0);
    }
  }, [handleInput]);

  // ── Paste handler: strip formatting, parse Markdown ──
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plain = e.clipboardData.getData("text/plain");
    if (!plain) return;

    const html = markdownToHtml(plain);

    // Insert parsed HTML at cursor position
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const frag = document.createDocumentFragment();
    const div  = document.createElement("div");
    div.innerHTML = html;
    while (div.firstChild) frag.appendChild(div.firstChild);
    range.insertNode(frag);

    // Move caret to end of inserted content
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    setTimeout(handleInput, 0);
  }, [handleInput]);

  // ── "Parse MD" button: reparse entire editor content ──
  const handleParseMarkdown = useCallback(() => {
    if (!editorRef.current) return;
    // Get plain text (strip existing HTML first to avoid double-parsing)
    const plain = editorRef.current.innerText;
    editorRef.current.innerHTML = markdownToHtml(plain);
    handleInput();
  }, [handleInput]);

  const handleStartRecording = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const html = editorRef.current?.innerHTML ?? "";
    const updated = onSave({ ...currentScript.current, title, body: html });
    currentScript.current = updated;
    setSaved(true);
    onStartTeleprompter(updated);
  };

  // Settings persistence is handled centrally in page.tsx handleSettingsChange.
  const handleCalibrated = (wpm: number, speed: number) => {
    onSettingsChange({ ...settings, wpm, speed });
  };

  // Settings persistence is handled centrally in page.tsx handleSettingsChange.
  const handleSettingsChange = (s: TeleprompterSettings) => {
    onSettingsChange(s);
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

      {/* ── TOOLBAR ROW 1: format ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px 6px", borderBottom: "1px solid var(--bg-3)",
        background: "var(--bg-2)", flexShrink: 0,
      }}>
        <ToolbarBtn active={isBold} title="Bold (or **text**)" onClick={() => exec("bold")}>
          <IconBold />
        </ToolbarBtn>
        <ToolbarBtn active={isItalic} title="Italic (or *text*)" onClick={() => exec("italic")}>
          <IconItalic />
        </ToolbarBtn>

        <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0, margin: "0 4px" }} />

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
      </div>

      {/* ── TOOLBAR ROW 2: actions pill ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "6px 14px 8px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)", flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 20, padding: "4px 10px",
        }}>
          <ToolbarBtn title="Bullet list (or - )" onClick={() => exec("insertUnorderedList")}>
            <IconList />
          </ToolbarBtn>
          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />
          <ToolbarBtn title="Clear formatting" onClick={() => exec("removeFormat")}>
            <IconEraser />
          </ToolbarBtn>
          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />
          <ToolbarBtn title="Parse entire document as Markdown" onClick={handleParseMarkdown}>
            <IconMD />
          </ToolbarBtn>
          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />
          <div style={{
            fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)",
            letterSpacing: "0.02em", whiteSpace: "nowrap", padding: "0 4px",
          }}>
            **b** · *i* · # h1
          </div>
        </div>
      </div>

      {/* ── EDITOR ── */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onSelect={updateToolbarState}
          data-placeholder="Write your script here…&#10;&#10;Paste Markdown and it will be formatted automatically.&#10;Type **bold**, *italic*, - bullet, # heading, > quote&#10;Or use the toolbar."
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
        borderTop: "1px solid var(--border)",
        flexShrink: 0, background: "var(--bg-2)",
      }}>
        {/* Row 1: stats + calibrate */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "10px 16px 8px", borderBottom: "1px solid var(--bg-3)",
        }}>
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
                textTransform: "uppercase", marginLeft: "auto",
              }}
            >
              <IconTarget />
              {settings.wpm ? "Re-calibrate" : "Calibrate"}
            </button>
          )}
        </div>
        {/* Row 2: full-width record button */}
        <div style={{ padding: "10px 14px 12px" }}>
          <button
            className="btn btn-primary"
            disabled={!hasContent}
            style={{
              width: "100%", opacity: hasContent ? 1 : 0.4,
              background: "#ff3b30", borderRadius: 12, height: 48, fontSize: 15,
            }}
            onClick={handleStartRecording}
          >
            ● Start Recording
          </button>
        </div>
      </div>

      {/* ── WPM CALIBRATOR ── */}
      {showCalibrator && hasContent && (
        <WPMCalibrator
          script={{ ...script, body: editorRef.current?.innerHTML ?? script.body }}
          currentWpm={settings.wpm}
          onCalibrated={handleCalibrated}
          onClose={() => setShowCalibrator(false)}
        />
      )}

      {/* ── SETTINGS ── */}
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
