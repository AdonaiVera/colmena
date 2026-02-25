import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_GROUPS } from "../../shared/types";
import type { Group } from "../../shared/types";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
  const loaded = useRef(false);

  useEffect(() => {
    window.colmena.groups.load().then((saved) => {
      setGroups(saved.length > 0 ? saved : DEFAULT_GROUPS);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    window.colmena.groups.save(groups);
  }, [groups]);

  const addGroup = useCallback((label: string) => {
    const id = `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setGroups((prev) => [...prev, { id, label }]);
  }, []);

  const renameGroup = useCallback((id: string, label: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, label } : g)));
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return { groups, addGroup, renameGroup, removeGroup };
}
