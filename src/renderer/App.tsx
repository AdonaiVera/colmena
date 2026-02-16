import { useCallback, useState } from "react";
import { nanoid } from "nanoid";

import { useSessionStore } from "./hooks/useSessionStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useGitBranch } from "./hooks/useGitBranch";
import { Sidebar } from "./components/Sidebar";
import { Terminal } from "./components/Terminal";
import { NewSessionDialog } from "./components/NewSessionDialog";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { DiffPanel } from "./components/DiffPanel";
import { getBaseName } from "./lib/utils";
import type { ClaudeMode, ClaudeModel } from "../shared/types";

export function App() {
  const {
    sessions,
    activeSessionId,
    restored,
    createSession,
    removeSession,
    renameSession,
    updateSession,
    setActiveSession,
  } = useSessionStore();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [diffPanelOpen, setDiffPanelOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  useGitBranch({ sessions, updateSession });

  const toggleCheatSheet = useCallback(() => {
    setShowCheatSheet((prev) => !prev);
  }, []);

  const toggleDiffPanel = useCallback(() => {
    setDiffPanelOpen((prev) => !prev);
  }, []);

  const handleConfirmNewSession = useCallback(
    async (config: { workingDir: string; mode: ClaudeMode; model: ClaudeModel }) => {
      setSessionLoading(true);
      const sessionId = nanoid();
      const gitResult =
        config.mode === "new"
          ? await window.colmena.git.setup(sessionId, config.workingDir)
          : undefined;
      createSession(sessionId, config.workingDir, config.mode, config.model, gitResult);
      setShowNewDialog(false);
      setSessionLoading(false);
    },
    [createSession],
  );

  const handleCloseSession = useCallback(
    (sessionId: string) => {
      window.colmena.pty.destroy(sessionId);
      removeSession(sessionId);
    },
    [removeSession],
  );

  const handleStatusChange = useCallback(
    (sessionId: string, status: "running" | "exited") => {
      updateSession(sessionId, { status });
    },
    [updateSession],
  );

  useKeyboardShortcuts({
    sessions,
    activeSessionId,
    setActiveSession,
    onNewTab: () => setShowNewDialog(true),
    onCloseTab: handleCloseSession,
    onToggleCheatSheet: toggleCheatSheet,
    onToggleDiffPanel: toggleDiffPanel,
  });

  const active = sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--bg)",
      }}
    >
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSession}
        onNewSession={() => setShowNewDialog(true)}
        onCloseSession={handleCloseSession}
        onRenameSession={renameSession}
        showCheatSheet={showCheatSheet}
        onToggleCheatSheet={toggleCheatSheet}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="titlebar-drag"
          style={{
            height: 52,
            backgroundColor: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--text)", fontSize: 12, fontWeight: 500 }}>
            {active?.name || "No tab selected"}
          </span>
          {active?.workingDir && (
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              {getBaseName(active.workingDir)}
            </span>
          )}
          {active?.gitBranch && (
            <span style={{ color: "var(--accent)", fontSize: 11 }}>{active.gitBranch}</span>
          )}
          <div style={{ flex: 1 }} />
          {active?.worktreePath && active?.baseBranch && (
            <button
              className="titlebar-no-drag"
              onClick={toggleDiffPanel}
              style={{
                background: diffPanelOpen ? "var(--surface-hover)" : "none",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: diffPanelOpen ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                padding: "4px 10px",
                fontSize: 11,
                transition: "var(--transition)",
              }}
            >
              Diff
            </button>
          )}
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {restored &&
            sessions.map((session) => (
              <Terminal
                key={session.id}
                sessionId={session.id}
                workingDir={session.workingDir}
                command={session.command}
                isActive={session.id === activeSessionId}
                onStatusChange={(status) => handleStatusChange(session.id, status)}
              />
            ))}

          {restored && sessions.length === 0 && (
            <WelcomeScreen onNewTab={() => setShowNewDialog(true)} />
          )}

          {active?.worktreePath && active?.baseBranch && (
            <DiffPanel
              open={diffPanelOpen}
              onClose={() => setDiffPanelOpen(false)}
              worktreePath={active.worktreePath}
              baseBranch={active.baseBranch}
              sessionName={active.name}
            />
          )}
        </div>
      </div>

      <NewSessionDialog
        open={showNewDialog}
        loading={sessionLoading}
        onConfirm={handleConfirmNewSession}
        onCancel={() => setShowNewDialog(false)}
      />
    </div>
  );
}
