"use client";
import { useState, useEffect, useCallback } from "react";
import { Script } from "../lib/types";
import {
  getScripts,
  getDeletedScripts,
  saveScript,
  deleteScript,
  restoreScript,
  permanentDeleteScript,
  createScript,
  duplicateScript,
} from "../lib/storage";

// Scripts live only in localStorage on this device.

export function useScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [deletedScripts, setDeletedScripts] = useState<Script[]>([]);

  const refreshState = useCallback(() => {
    setScripts(getScripts());
    setDeletedScripts(getDeletedScripts());
  }, []);

  // On mount: load localStorage
  useEffect(() => { refreshState(); }, [refreshState]);

  const create = useCallback(() => {
    const s = createScript();
    saveScript(s);
    refreshState();
    return s;
  }, [refreshState]);

  const save = useCallback((script: Script) => {
    const updated = { ...script, updatedAt: Date.now() };
    saveScript(updated);
    refreshState();
    return updated;
  }, [refreshState]);

  // Soft delete — moves the script to "Deleted scripts"
  const remove = useCallback((id: string) => {
    deleteScript(id);
    refreshState();
  }, [refreshState]);

  const restore = useCallback((id: string) => {
    restoreScript(id);
    refreshState();
  }, [refreshState]);

  const permanentRemove = useCallback((id: string) => {
    permanentDeleteScript(id);
    refreshState();
  }, [refreshState]);

  const duplicate = useCallback((script: Script) => {
    const d = duplicateScript(script);
    saveScript(d);
    refreshState();
    return d;
  }, [refreshState]);

  return { scripts, deletedScripts, create, save, remove, restore, permanentRemove, duplicate };
}
