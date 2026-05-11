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

export default function Home() {
  const { scripts, create, save, remove, duplicate } = useScripts();
  const [view, setView]               = useState<View>("list");
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [settings, setSettings]       = useState<TeleprompterSettings | null>(null);

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

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
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

        {scripts.length > 0 && (
          <div style={{ display: "flex", gap: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{scripts.length}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scripts</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {scripts.reduce((acc, s) => acc + (s.body.replace(/<[^>]*>/g, " ").trim() ? s.body.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length : 0), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Words</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: "0 24px 40px", overflowY: "auto" }}>
        {scripts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, textAlign: "center", gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 8 }}>🎬</div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>No scripts yet</h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 260, lineHeight: 1.5 }}>
              Create your first script and start recording like a pro.
            </p>
            <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: 8 }}>
              <IconPlus /> Create script
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scripts.map((s) => (
              <ScriptCard key={s.id} script={s} onEdit={handleEdit} onDuplicate={duplicate} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
