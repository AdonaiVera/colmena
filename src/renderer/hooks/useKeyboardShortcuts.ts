import { useEffect } from "react";

import type { Session } from "../../shared/types";

interface UseKeyboardShortcutsOptions {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSession: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onToggleCheatSheet: () => void;
}

export function useKeyboardShortcuts({
  sessions,
  activeSessionId,
  setActiveSession,
  onNewTab,
  onCloseTab,
  onToggleCheatSheet,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && sessions.length > 0) {
        e.preventDefault();
        const index = Math.min(num - 1, sessions.length - 1);
        setActiveSession(sessions[index].id);
        return;
      }

      if (e.shiftKey && (e.key === "[" || e.key === "]")) {
        e.preventDefault();
        if (sessions.length < 2 || !activeSessionId) return;
        const cur = sessions.findIndex((s) => s.id === activeSessionId);
        const next =
          e.key === "["
            ? cur > 0
              ? cur - 1
              : sessions.length - 1
            : cur < sessions.length - 1
              ? cur + 1
              : 0;
        setActiveSession(sessions[next].id);
        return;
      }

      if (e.key === "t" && !e.shiftKey) {
        e.preventDefault();
        onNewTab();
        return;
      }

      if (e.key === "w" && !e.shiftKey && activeSessionId) {
        e.preventDefault();
        onCloseTab(activeSessionId);
        return;
      }

      if (e.key === "/" || e.key === "?") {
        e.preventDefault();
        onToggleCheatSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    sessions,
    activeSessionId,
    setActiveSession,
    onNewTab,
    onCloseTab,
    onToggleCheatSheet,
  ]);
}
