import { Script, TeleprompterSettings, DEFAULT_SETTINGS } from "./types";

const SCRIPTS_KEY  = "reelprompt:scripts";
const SETTINGS_KEY = "reelprompt:settings";

// ── Scripts ──────────────────────────────────────────────────────────────────

export function getScripts(): Script[] {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    const all: Script[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => !s.deletedAt);
  } catch { return []; }
}

export function getDeletedScripts(): Script[] {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    const all: Script[] = raw ? JSON.parse(raw) : [];
    return all.filter((s) => !!s.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  } catch { return []; }
}

export function getAllScripts(): Script[] {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveScripts(scripts: Script[]): void {
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

/** Soft-delete a script (sets deletedAt, keeps the record) */
export function deleteScript(id: string): void {
  const all = getAllScripts();
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) all[idx] = { ...all[idx], deletedAt: Date.now(), updatedAt: Date.now() };
  saveScripts(all);
}

/** Restore a soft-deleted script */
export function restoreScript(id: string): void {
  const all = getAllScripts();
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) {
    const { deletedAt, ...rest } = all[idx];
    void deletedAt;
    all[idx] = { ...rest, updatedAt: Date.now() };
  }
  saveScripts(all);
}

/** Permanently remove a script from localStorage */
export function permanentDeleteScript(id: string): void {
  saveScripts(getAllScripts().filter((s) => s.id !== id));
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
