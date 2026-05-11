"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Script } from "../lib/types";
import {
  getScripts,
  saveScript,
  deleteScript,
  createScript,
  duplicateScript,
} from "../lib/storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";

// ── Supabase helpers (raw fetch, no JS client) ────────────────────────────────

type RemoteScript = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function toRemote(s: Script, userId: string): RemoteScript & { user_id: string } {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    body: s.body,
    created_at: new Date(s.createdAt).toISOString(),
    updated_at: new Date(s.updatedAt).toISOString(),
  };
}

function fromRemote(r: RemoteScript): Script {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

function readHeaders(token: string) {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token}`,
  };
}

function writeHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token}`,
    "Prefer": "resolution=merge-duplicates",
  };
}

async function fetchRemoteScripts(token: string): Promise<Script[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scripts?select=id,title,body,created_at,updated_at&order=updated_at.desc`,
    { headers: readHeaders(token) }
  );
  if (!res.ok) return [];
  const data: RemoteScript[] = await res.json();
  return data.map(fromRemote);
}

async function upsertRemoteScript(script: Script, userId: string, token: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scripts`, {
    method: "POST",
    headers: writeHeaders(token),
    body: JSON.stringify(toRemote(script, userId)),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[useScripts] upsert failed", res.status, body);
  }
}

async function deleteRemoteScript(id: string, token: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/scripts?id=eq.${id}`, {
    method: "DELETE",
    headers: writeHeaders(token),
  });
}

// ── Merge: local + remote, winner = most recent updatedAt ─────────────────────

function mergeScripts(local: Script[], remote: Script[]): Script[] {
  const map = new Map<string, Script>();
  for (const s of remote) map.set(s.id, s);
  for (const s of local) {
    const existing = map.get(s.id);
    if (!existing || s.updatedAt > existing.updatedAt) map.set(s.id, s);
  }
  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useScripts(userId?: string, sessionToken?: string) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [syncing, setSyncing] = useState(false);
  // Ref to avoid stale closures in callbacks
  const authRef = useRef({ userId, sessionToken });
  useEffect(() => { authRef.current = { userId, sessionToken }; }, [userId, sessionToken]);

  // On mount: load localStorage immediately, then sync with remote if logged in
  useEffect(() => {
    const local = getScripts();
    setScripts(local);
  }, []);

  // When user logs in (userId/token appear): pull remote, merge, persist
  useEffect(() => {
    if (!userId || !sessionToken) return;
    let cancelled = false;

    (async () => {
      setSyncing(true);
      console.log("[useScripts] sync start — userId:", userId, "token present:", !!sessionToken);
      try {
        const remote = await fetchRemoteScripts(sessionToken);
        if (cancelled) return;
        const local = getScripts();
        const merged = mergeScripts(local, remote);
        // Persist merged list locally
        for (const s of merged) saveScript(s);
        setScripts(merged);
        // Push any local-only scripts up to remote
        const remoteIds = new Set(remote.map((s) => s.id));
        const localOnly = merged.filter((s) => !remoteIds.has(s.id));
        await Promise.all(localOnly.map((s) => upsertRemoteScript(s, userId, sessionToken)));
      } catch {
        // Sync failure is silent — local data still works
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, sessionToken]);

  const refresh = useCallback(() => {
    setScripts(getScripts());
  }, []);

  const create = useCallback(() => {
    const s = createScript();
    saveScript(s);
    setScripts(getScripts());
    // Fire-and-forget remote upsert
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) upsertRemoteScript(s, userId, sessionToken).catch((e) => console.error("[useScripts] create sync error", e));
    return s;
  }, []);

  const save = useCallback((script: Script) => {
    const updated = { ...script, updatedAt: Date.now() };
    saveScript(updated);
    setScripts(getScripts());
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) upsertRemoteScript(updated, userId, sessionToken).catch((e) => console.error("[useScripts] save sync error", e));
    return updated;
  }, []);

  const remove = useCallback((id: string) => {
    deleteScript(id);
    setScripts(getScripts());
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) deleteRemoteScript(id, sessionToken).catch((e) => console.error("[useScripts] delete sync error", e));
  }, []);

  const duplicate = useCallback((script: Script) => {
    const d = duplicateScript(script);
    saveScript(d);
    setScripts(getScripts());
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) upsertRemoteScript(d, userId, sessionToken).catch((e) => console.error("[useScripts] duplicate sync error", e));
    return d;
  }, []);

  return { scripts, syncing, create, save, remove, duplicate, refresh };
}
