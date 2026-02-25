import { useCallback, useEffect, useRef, useState } from "react";

import { buildClaudeCommand } from "../../shared/types";
import { getBaseName } from "../lib/utils";
import type {
  Session,
  ClaudeMode,
  ClaudeModel,
  PersistedTab,
  GitSetupResult,
  GitInfoResult,
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
    group: s.group,
    workingDir: s.workingDir,
    command: s.command,
    mode: s.mode,
    model: s.model,
    worktreePath: s.worktreePath,
    baseBranch: s.baseBranch,
    repoRoot: s.repoRoot,
    isExistingBranch: s.isExistingBranch,
    claudeSessionId: s.claudeSessionId,
    userSetName: s.userSetName,
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
        group: tab.group,
        workingDir: tab.workingDir,
        command: tab.command,
        mode: tab.mode || "new",
        model: tab.model || "default",
        status: "running" as const,
        activityState: "idling" as const,
        worktreePath: tab.worktreePath,
        baseBranch: tab.baseBranch,
        repoRoot: tab.repoRoot,
        isExistingBranch: tab.isExistingBranch,
        createdAt: Date.now(),
        claudeSessionId: tab.claudeSessionId,
        userSetName: tab.userSetName,
      }));
      setState({ sessions, activeSessionId: sessions[0].id, restored: true });

      for (const tab of tabs) {
        if (tab.claudeSessionId && !tab.userSetName) {
          window.colmena.session
            .getClaudeSessionName(tab.workingDir, tab.claudeSessionId)
            .then((name) => {
              if (!name) return;
              setState((prev) => ({
                ...prev,
                sessions: prev.sessions.map((s) => (s.id === tab.id ? { ...s, name } : s)),
              }));
            });
        }
      }
    });
  }, []);

  useEffect(() => {
    const off = window.colmena.session.onSyncName((colmenaId, claudeSessionId, name) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === colmenaId ? { ...s, name, claudeSessionId } : s,
        ),
      }));
    });
    return () => {
      off();
    };
  }, []);

  const createSession = useCallback(
    (
      sessionId: string,
      workingDir: string,
      mode: ClaudeMode,
      model: ClaudeModel,
      group: string,
      gitResult?: GitSetupResult,
      gitInfo?: GitInfoResult,
    ): Session => {
      const command = buildClaudeCommand(mode, model);
      const effectiveDir = gitResult?.success ? gitResult.worktreePath : workingDir;

      const session: Session = {
        id: sessionId,
        name: "",
        group,
        workingDir: effectiveDir,
        command,
        mode,
        model,
        status: "running",
        activityState: "idling",
        gitBranch: gitResult?.success ? gitResult.branchName : undefined,
        worktreePath: gitResult?.success ? gitResult.worktreePath : undefined,
        baseBranch: gitResult?.success
          ? gitResult.baseBranch
          : gitInfo?.isRepo
            ? gitInfo.defaultBranch
            : undefined,
        repoRoot: gitResult?.success
          ? gitResult.repoRoot
          : gitInfo?.isRepo
            ? gitInfo.repoRoot
            : undefined,
        isExistingBranch: gitResult?.success ? gitResult.isExistingBranch : undefined,
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
          session.isExistingBranch,
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
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, name, userSetName: true } : s,
      ),
    }));
  }, []);

  const moveSession = useCallback(
    (sessionId: string, targetId: string | null, position: "before" | "after", group: string) => {
      setState((prev) => {
        const sessions = [...prev.sessions];
        const fromIdx = sessions.findIndex((s) => s.id === sessionId);
        if (fromIdx === -1) return prev;
        const [session] = sessions.splice(fromIdx, 1);
        const updated = { ...session, group };
        if (targetId === null) {
          sessions.push(updated);
        } else {
          const targetIdx = sessions.findIndex((s) => s.id === targetId);
          if (targetIdx === -1) {
            sessions.push(updated);
          } else if (position === "before") {
            sessions.splice(targetIdx, 0, updated);
          } else {
            sessions.splice(targetIdx + 1, 0, updated);
          }
        }
        return { ...prev, sessions };
      });
    },
    [],
  );

  const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const setActiveSession = useCallback((sessionId: string) => {
    setState((prev) => ({ ...prev, activeSessionId: sessionId }));
  }, []);

  const moveSessionsToGroup = useCallback((fromGroup: string, toGroup: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        (s.group ?? "focus") === fromGroup ? { ...s, group: toGroup } : s,
      ),
    }));
  }, []);

  return {
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
    restored: state.restored,
    createSession,
    removeSession,
    renameSession,
    moveSession,
    updateSession,
    setActiveSession,
    moveSessionsToGroup,
  };
}
