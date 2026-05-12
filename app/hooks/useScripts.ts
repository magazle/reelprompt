"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Script } from "../lib/types";
import {
  getAllScripts,
  getScripts,
  getDeletedScripts,
  saveScript,
  deleteScript,
  restoreScript,
  permanentDeleteScript,
  createScript,
  duplicateScript,
} from "../lib/storage";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";

// ── Supabase helpers ──────────────────────────────────────────────────────────

type RemoteScript = {
  id: string;
  title: string;
  body: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function toRemote(s: Script, userId: string): RemoteScript & { user_id: string } {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    body: s.body,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt ?? null,
  };
}

function fromRemote(r: RemoteScript): Script {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ...(r.deleted_at ? { deletedAt: r.deleted_at } : {}),
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
    `${SUPABASE_URL}/rest/v1/scripts?select=id,title,body,created_at,updated_at,deleted_at&order=updated_at.desc`,
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

async function hardDeleteRemoteScript(id: string, token: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/scripts?id=eq.${id}`, {
    method: "DELETE",
    headers: writeHeaders(token),
  });
}

// ── Merge: local + remote, winner = most recent updatedAt ─────────────────────
// Soft deletes propagate: if either side has deletedAt, the merged record keeps it.

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
  const [deletedScripts, setDeletedScripts] = useState<Script[]>([]);
  const [syncing, setSyncing] = useState(false);
  const authRef = useRef({ userId, sessionToken });
  useEffect(() => { authRef.current = { userId, sessionToken }; }, [userId, sessionToken]);

  const refreshState = useCallback(() => {
    setScripts(getScripts());
    setDeletedScripts(getDeletedScripts());
  }, []);

  // On mount: load localStorage immediately
  useEffect(() => { refreshState(); }, [refreshState]);

  const runSync = useCallback(async (uid: string, token: string) => {
    setSyncing(true);
    try {
      const remote = await fetchRemoteScripts(token);
      const local = getAllScripts(); // includes soft-deleted
      const merged = mergeScripts(local, remote);
      // Persist all merged records (including soft-deleted)
      for (const s of merged) saveScript(s);
      // Push local-only records to remote
      const remoteIds = new Set(remote.map((s) => s.id));
      const localOnly = merged.filter((s) => !remoteIds.has(s.id));
      await Promise.all(localOnly.map((s) => upsertRemoteScript(s, uid, token)));
      refreshState();
    } catch {
      // Sync failure is silent — local data still works
    } finally {
      setSyncing(false);
    }
  }, [refreshState]);

  useEffect(() => {
    if (!userId || !sessionToken) return;
    let cancelled = false;
    runSync(userId, sessionToken).then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [userId, sessionToken, runSync]);

  const syncNow = useCallback(() => {
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) runSync(userId, sessionToken);
  }, [runSync]);

  const create = useCallback(() => {
    const s = createScript();
    saveScript(s);
    refreshState();
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) upsertRemoteScript(s, userId, sessionToken).catch(console.error);
    return s;
  }, [refreshState]);

  const save = useCallback((script: Script) => {
    const updated = { ...script, updatedAt: Date.now() };
    saveScript(updated);
    refreshState();
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) upsertRemoteScript(updated, userId, sessionToken).catch(console.error);
    return updated;
  }, [refreshState]);

  // Soft delete — sets deletedAt locally and upserts to remote
  const remove = useCallback((id: string) => {
    deleteScript(id);
    refreshState();
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) {
      const all = getAllScripts();
      const s = all.find((x) => x.id === id);
      if (s) upsertRemoteScript(s, userId, sessionToken).catch(console.error);
    }
  }, [refreshState]);

  // Restore from trash — clears deletedAt locally and upserts to remote
  const restore = useCallback((id: string) => {
    restoreScript(id);
    refreshState();
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) {
      const all = getAllScripts();
      const s = all.find((x) => x.id === id);
      if (s) upsertRemoteScript(s, userId, sessionToken).catch(console.error);
    }
  }, [refreshState]);

  // Permanent delete — removes from localStorage and hard-deletes from Supabase
  const permanentRemove = useCallback((id: string) => {
    permanentDeleteScript(id);
    refreshState();
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) hardDeleteRemoteScript(id, sessionToken).catch(console.error);
  }, [refreshState]);

  const duplicate = useCallback((script: Script) => {
    const d = duplicateScript(script);
    saveScript(d);
    refreshState();
    const { userId, sessionToken } = authRef.current;
    if (userId && sessionToken) upsertRemoteScript(d, userId, sessionToken).catch(console.error);
    return d;
  }, [refreshState]);

  return { scripts, deletedScripts, syncing, syncNow, create, save, remove, restore, permanentRemove, duplicate };
}
