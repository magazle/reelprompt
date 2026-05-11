"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Script } from "../lib/types";
import { IconBack, IconCheck, IconBold, IconItalic, IconList, IconEraser } from "./Icons";

interface Props {
  script: Script;
  onSave: (s: Script) => Script;
  onBack: () => void;
  onStartTeleprompter: (s: Script) => void;
}

// Colour swatches available in the toolbar
const COLOURS = [
  { label: "White",  value: "#f0f0f0" },
  { label: "Yellow", value: "#FFD60A" },
  { label: "Red",    value: "#FF453A" },
  { label: "Green",  value: "#30D158" },
  { label: "Blue",   value: "#64D2FF" },
];

// Strip HTML tags to get a plain-text word count
function countWords(html: string): number {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? plain.split(" ").length : 0;
}

// Estimated read time in seconds at 130 wpm
function readTimeSec(words: number) {
  return Math.round((words / 130) * 60);
}

function formatReadTime(secs: number) {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

interface ToolbarButtonProps {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}
function ToolbarBtn({ active, title, onClick, children }: ToolbarButtonProps) {
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

export default function ScriptEditor({ script, onSave, onBack, onStartTeleprompter }: Props) {
  const [title, setTitle]   = useState(script.title);
  const [saved, setSaved]   = useState(true);
  const editorRef           = useRef<HTMLDivElement>(null);
  const saveTimerRef        = useRef<NodeJS.Timeout | null>(null);
  const currentScript       = useRef(script);
  currentScript.current     = script;

  // Track active formatting states
  const [isBold, setIsBold]     = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [wordCount, setWordCount] = useState(countWords(script.body));

  // Boot: inject saved HTML into contentEditable
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
    const html = editorRef.current?.innerHTML ?? "";
    triggerSave(html, t);
  };

  // Update toolbar active state on selection change
  const updateToolbarState = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
  };

  // execCommand wrappers — keep focus in editor
  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateToolbarState();
    handleInput();
  };

  const applyColour = (hex: string) => {
    editorRef.current?.focus();
    // If default white, remove span so it inherits
    if (hex === "#f0f0f0") {
      document.execCommand("removeFormat", false);
    } else {
      document.execCommand("foreColor", false, hex);
    }
    handleInput();
  };

  const handleStartRecording = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const html = editorRef.current?.innerHTML ?? "";
    const updated = onSave({ ...currentScript.current, title, body: html });
    currentScript.current = updated;
    setSaved(true);
    onStartTeleprompter({ ...currentScript.current, title, body: html });
  };

  const hasContent = wordCount > 0;
  const readTime = formatReadTime(readTimeSec(wordCount));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0
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
            borderBottom: "1px solid var(--border)"
          }}
        />
        <div style={{
          fontSize: 11, color: saved ? "var(--green)" : "var(--text-3)",
          fontFamily: "var(--font-mono)", display: "flex", alignItems: "center",
          gap: 4, transition: "color 0.3s", flexShrink: 0
        }}>
          {saved ? <><IconCheck /> saved</> : "saving…"}
        </div>
      </div>

      {/* ── FORMATTING TOOLBAR ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)", flexShrink: 0, overflowX: "auto",
        WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
      }}>
        <ToolbarBtn active={isBold} title="Bold" onClick={() => exec("bold")}>
          <IconBold />
        </ToolbarBtn>
        <ToolbarBtn active={isItalic} title="Italic" onClick={() => exec("italic")}>
          <IconItalic />
        </ToolbarBtn>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />

        {/* Colour swatches */}
        {COLOURS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onMouseDown={(e) => { e.preventDefault(); applyColour(c.value); }}
            style={{
              width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--border-2)",
              background: c.value, cursor: "pointer", flexShrink: 0,
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />

        <ToolbarBtn title="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <IconList />
        </ToolbarBtn>

        {/* Paragraph break hint */}
        <ToolbarBtn title="Clear formatting" onClick={() => exec("removeFormat")}>
          <IconEraser />
        </ToolbarBtn>
      </div>

      {/* ── RICH TEXT EDITOR ── */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onSelect={updateToolbarState}
          data-placeholder="Write your script here…&#10;&#10;Select text to colour it. Use Bold for emphasis, Italic for tone, Green for stage directions."
          className="rich-editor"
          style={{
            minHeight: "100%",
            padding: "20px",
            fontSize: 16,
            lineHeight: 1.7,
            color: "var(--text)",
            outline: "none",
            fontFamily: "var(--font-display)",
            wordBreak: "break-word",
          }}
        />
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderTop: "1px solid var(--border)",
        flexShrink: 0, background: "var(--bg-2)", gap: 12
      }}>
        <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{wordCount}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginLeft: 4 }}>words</span>
          </div>
          {hasContent && (
            <div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{readTime}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", marginLeft: 4 }}>est.</span>
            </div>
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
    </div>
  );
}
