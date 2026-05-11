import { Script, TeleprompterSettings, DEFAULT_SETTINGS } from "./types";

const SCRIPTS_KEY  = "reelprompt:scripts";
const SETTINGS_KEY = "reelprompt:settings";

export function getScripts(): Script[] {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveScripts(scripts: Script[]): void {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

export function getSettings(): TeleprompterSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    // Always merge with defaults so new fields are present after upgrades
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(s: TeleprompterSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
