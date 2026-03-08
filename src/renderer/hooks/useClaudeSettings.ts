import { useCallback, useEffect, useRef, useState } from "react";

import type { ClaudeSettingsData, HooksScope } from "../../shared/types";

const EMPTY_DATA: ClaudeSettingsData = { presets: {}, denyRules: [], customHooks: {} };

export function useClaudeSettings(projectDir?: string) {
  const [data, setData] = useState<ClaudeSettingsData>(EMPTY_DATA);
  const [scope, setScope] = useState<HooksScope>("user");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const skipDirty = useRef(true);

  const reload = useCallback(
    (s: HooksScope) => {
      skipDirty.current = true;
      window.colmena.claudeSettings.load(s, projectDir).then((result) => {
        setData(result);
        setLoaded(true);
        setDirty(false);
        setTimeout(() => {
          skipDirty.current = false;
        }, 50);
      });
    },
    [projectDir],
  );

  useEffect(() => {
    reload(scope);
  }, [scope, reload]);

  useEffect(() => {
    if (!loaded || skipDirty.current) return;
    setDirty(true);
  }, [data, loaded]);

  const save = useCallback(() => {
    window.colmena.claudeSettings.save(data, scope, projectDir);
    setDirty(false);
  }, [data, scope, projectDir]);

  const togglePreset = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      presets: { ...prev.presets, [id]: !prev.presets[id] },
    }));
  }, []);

  const addDenyRule = useCallback((rule: string) => {
    setData((prev) => ({
      ...prev,
      denyRules: [...prev.denyRules, rule],
    }));
  }, []);

  const removeDenyRule = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      denyRules: prev.denyRules.filter((_, i) => i !== index),
    }));
  }, []);

  const addCustomHook = useCallback((event: string, matcher: string, command: string) => {
    setData((prev) => {
      const existing = prev.customHooks[event] || [];
      return {
        ...prev,
        customHooks: {
          ...prev.customHooks,
          [event]: [...existing, { matcher, hooks: [{ type: "command", command }] }],
        },
      };
    });
  }, []);

  const removeCustomHook = useCallback((event: string, index: number) => {
    setData((prev) => {
      const existing = [...(prev.customHooks[event] || [])];
      existing.splice(index, 1);
      const customHooks = { ...prev.customHooks };
      if (existing.length === 0) {
        delete customHooks[event];
      } else {
        customHooks[event] = existing;
      }
      return { ...prev, customHooks };
    });
  }, []);

  return {
    ...data,
    scope,
    loaded,
    dirty,
    setScope,
    save,
    togglePreset,
    addDenyRule,
    removeDenyRule,
    addCustomHook,
    removeCustomHook,
  };
}
