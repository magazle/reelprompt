import { Script, TeleprompterSettings, DEFAULT_SETTINGS } from "./types";

const SCRIPTS_KEY  = "reelprompt:scripts";
const SETTINGS_KEY = "reelprompt:settings";

// ── Scripts ──────────────────────────────────────────────────────────────────

export function getScripts(): Script[] {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveScripts(scripts: Script[]): void {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

/** Save (upsert) a single script into the list */
export function saveScript(script: Script): void {
  const all = getScripts();
  const idx = all.findIndex((s) => s.id === script.id);
  if (idx >= 0) all[idx] = script;
  else all.unshift(script);
  saveScripts(all);
}

/** Create a blank script and return it (does NOT persist — caller must saveScript) */
export function createScript(): Script {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    body: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Delete a script by id */
export function deleteScript(id: string): void {
  saveScripts(getScripts().filter((s) => s.id !== id));
}

/** Duplicate a script and return the copy (does NOT persist — caller must saveScript) */
export function duplicateScript(script: Script): Script {
  return {
    ...script,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: script.title ? `${script.title} (copy)` : "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): TeleprompterSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    // Merge with defaults so new fields are always present after upgrades
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(s: TeleprompterSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
