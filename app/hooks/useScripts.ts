"use client";
import { useState, useEffect, useCallback } from "react";
import { Script } from "../lib/types";
import {
  getScripts,
  saveScript,
  deleteScript,
  createScript,
  duplicateScript,
} from "../lib/storage";

export function useScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);

  useEffect(() => {
    setScripts(getScripts());
  }, []);

  const refresh = useCallback(() => {
    setScripts(getScripts());
  }, []);

  const create = useCallback(() => {
    const s = createScript();
    saveScript(s);
    refresh();
    return s;
  }, [refresh]);

  const save = useCallback(
    (script: Script) => {
      const updated = { ...script, updatedAt: Date.now() };
      saveScript(updated);
      refresh();
      return updated;
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      deleteScript(id);
      refresh();
    },
    [refresh]
  );

  const duplicate = useCallback(
    (script: Script) => {
      const d = duplicateScript(script);
      saveScript(d);
      refresh();
      return d;
    },
    [refresh]
  );

  return { scripts, create, save, remove, duplicate, refresh };
}
