import { Script } from "./types";

const STORAGE_KEY = "reelprompt_scripts";

export function getScripts(): Script[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScript(script: Script): void {
  const scripts = getScripts();
  const idx = scripts.findIndex((s) => s.id === script.id);
  if (idx >= 0) {
    scripts[idx] = script;
  } else {
    scripts.unshift(script);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
}

export function deleteScript(id: string): void {
  const scripts = getScripts().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
}

export function getScript(id: string): Script | undefined {
  return getScripts().find((s) => s.id === id);
}

export function createScript(): Script {
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function duplicateScript(script: Script): Script {
  return {
    ...script,
    id: crypto.randomUUID(),
    title: script.title + " (copy)",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const SETTINGS_KEY = "reelprompt_settings";
import { TeleprompterSettings, DEFAULT_SETTINGS } from "./types";

export function getSettings(): TeleprompterSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TeleprompterSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
