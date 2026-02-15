import { useCallback, useState } from "react";

import { useSessionStore } from "./hooks/useSessionStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { Sidebar } from "./components/Sidebar";
import { Terminal } from "./components/Terminal";
import { NewSessionDialog } from "./components/NewSessionDialog";
import { WelcomeScreen } from "./components/WelcomeScreen";
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

  const toggleCheatSheet = useCallback(() => {
    setShowCheatSheet((prev) => !prev);
  }, []);

  const handleConfirmNewSession = useCallback(
    (config: { workingDir: string; mode: ClaudeMode; model: ClaudeModel }) => {
      createSession(config.workingDir, config.mode, config.model);
      setShowNewDialog(false);
    },
    [createSession]
  );

  const handleCloseSession = useCallback(
    (sessionId: string) => {
      window.colmena.pty.destroy(sessionId);
      removeSession(sessionId);
    },
    [removeSession]
  );

  const handleStatusChange = useCallback(
    (sessionId: string, status: "running" | "exited") => {
      updateSession(sessionId, { status });
    },
    [updateSession]
  );

  useKeyboardShortcuts({
    sessions,
    activeSessionId,
    setActiveSession,
    onNewTab: () => setShowNewDialog(true),
    onCloseTab: handleCloseSession,
    onToggleCheatSheet: toggleCheatSheet,
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
                onStatusChange={(status) =>
                  handleStatusChange(session.id, status)
                }
              />
            ))}

          {restored && sessions.length === 0 && (
            <WelcomeScreen onNewTab={() => setShowNewDialog(true)} />
          )}
        </div>
      </div>

      <NewSessionDialog
        open={showNewDialog}
        onConfirm={handleConfirmNewSession}
        onCancel={() => setShowNewDialog(false)}
      />
    </div>
  );
}
