import { useCallback, useEffect, useRef, useState } from "react";

import { buildClaudeCommand } from "../../shared/types";
import { getBaseName } from "../lib/utils";
import type {
  Session,
  ClaudeMode,
  ClaudeModel,
  PersistedTab,
  GitSetupResult,
} from "../../shared/types";

interface SessionStoreState {
  sessions: Session[];
  activeSessionId: string | null;
  restored: boolean;
}

const DEFAULT_STATE: SessionStoreState = {
  sessions: [],
  activeSessionId: null,
  restored: false,
};

function toPersistedTabs(sessions: Session[]): PersistedTab[] {
  return sessions.map((s) => ({
    id: s.id,
    name: s.name,
    workingDir: s.workingDir,
    command: s.command,
    mode: s.mode,
    model: s.model,
    worktreePath: s.worktreePath,
    baseBranch: s.baseBranch,
    repoRoot: s.repoRoot,
  }));
}

export function useSessionStore() {
  const [state, setState] = useState<SessionStoreState>(DEFAULT_STATE);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!state.restored) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.colmena.store.saveTabs(toPersistedTabs(state.sessions));
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state.sessions, state.restored]);

  useEffect(() => {
    window.colmena.store.loadTabs().then((tabs) => {
      if (tabs.length === 0) {
        setState((prev) => ({ ...prev, restored: true }));
        return;
      }
      const sessions: Session[] = tabs.map((tab, i) => ({
        id: tab.id,
        name: tab.name || `Tab ${i + 1}`,
        workingDir: tab.workingDir,
        command: tab.command,
        mode: tab.mode || "new",
        model: tab.model || "default",
        status: "running" as const,
        activityState: "idling" as const,
        worktreePath: tab.worktreePath,
        baseBranch: tab.baseBranch,
        repoRoot: tab.repoRoot,
        createdAt: Date.now(),
      }));
      setState({
        sessions,
        activeSessionId: sessions[0].id,
        restored: true,
      });
    });
  }, []);

  const createSession = useCallback(
    (
      sessionId: string,
      workingDir: string,
      mode: ClaudeMode,
      model: ClaudeModel,
      gitResult?: GitSetupResult,
    ): Session => {
      const command = buildClaudeCommand(mode, model);
      const effectiveDir = gitResult?.success ? gitResult.worktreePath : workingDir;

      const session: Session = {
        id: sessionId,
        name: "",
        workingDir: effectiveDir,
        command,
        mode,
        model,
        status: "running",
        activityState: "idling",
        gitBranch: gitResult?.success ? gitResult.branchName : undefined,
        worktreePath: gitResult?.success ? gitResult.worktreePath : undefined,
        baseBranch: gitResult?.success ? gitResult.baseBranch : undefined,
        repoRoot: gitResult?.success ? gitResult.repoRoot : undefined,
        createdAt: Date.now(),
      };

      setState((prev) => {
        const tabNumber = prev.sessions.length + 1;
        const folderName = workingDir ? getBaseName(workingDir) : undefined;
        const name = folderName || `Tab ${tabNumber}`;
        return {
          ...prev,
          sessions: [...prev.sessions, { ...session, name }],
          activeSessionId: session.id,
        };
      });

      return session;
    },
    [],
  );

  const removeSession = useCallback((sessionId: string) => {
    setState((prev) => {
      const session = prev.sessions.find((s) => s.id === sessionId);
      if (session?.worktreePath && session?.repoRoot && session?.gitBranch) {
        window.colmena.git.cleanup(
          sessionId,
          session.repoRoot,
          session.worktreePath,
          session.gitBranch,
        );
      }

      const sessions = prev.sessions.filter((s) => s.id !== sessionId);
      let activeSessionId = prev.activeSessionId;
      if (activeSessionId === sessionId) {
        activeSessionId = sessions.length > 0 ? sessions[sessions.length - 1].id : null;
      }
      return { ...prev, sessions, activeSessionId };
    });
  }, []);

  const renameSession = useCallback((sessionId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, name } : s)),
    }));
  }, []);

  const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const setActiveSession = useCallback((sessionId: string) => {
    setState((prev) => ({ ...prev, activeSessionId: sessionId }));
  }, []);

  return {
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
    restored: state.restored,
    createSession,
    removeSession,
    renameSession,
    updateSession,
    setActiveSession,
  };
}
