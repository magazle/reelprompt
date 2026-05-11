"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Script } from "../lib/types";
import { IconBack, IconCheck } from "./Icons";

interface Props {
  script: Script;
  onSave: (s: Script) => Script;
  onBack: () => void;
  onStartTeleprompter: (s: Script) => void;
}

export default function ScriptEditor({ script, onSave, onBack, onStartTeleprompter }: Props) {
  const [title, setTitle] = useState(script.title);
  const [body, setBody] = useState(script.body);
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentScript = useRef(script);
  currentScript.current = script;

  const doSave = useCallback((t: string, b: string) => {
    const updated = onSave({ ...currentScript.current, title: t, body: b });
    currentScript.current = updated;
    setSaved(true);
  }, [onSave]);

  useEffect(() => {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(title, body), 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [title, body, doSave]);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--bg)",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0
      }}>
        <button className="btn btn-icon" onClick={onBack}>
          <IconBack />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            className="input"
            placeholder="Script title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px 0",
              fontSize: 17,
              fontWeight: 700,
              borderRadius: 0,
              borderBottom: "1px solid var(--border)"
            }}
          />
        </div>
        <div style={{
          fontSize: 11,
          color: saved ? "var(--green)" : "var(--text-3)",
          fontFamily: "var(--font-mono)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "color 0.3s",
          flexShrink: 0
        }}>
          {saved ? <><IconCheck /> saved</> : "saving…"}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <textarea
          className="input"
          placeholder="Write your script here…&#10;&#10;Speak naturally, as if talking to your audience. Use short sentences. Leave breathing room."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{
            height: "100%",
            borderRadius: 0,
            border: "none",
            padding: "20px",
            fontSize: 16,
            lineHeight: 1.7,
            minHeight: "unset",
            background: "var(--bg)"
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg-2)"
      }}>
        <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {words} words
        </span>
        <button
          className="btn btn-primary"
          disabled={!body.trim()}
          style={{ opacity: body.trim() ? 1 : 0.4 }}
          onClick={() => {
            doSave(title, body);
            onStartTeleprompter({ ...currentScript.current, title, body });
          }}
        >
          Start Recording →
        </button>
      </div>
    </div>
  );
}
