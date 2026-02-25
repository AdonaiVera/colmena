import { useCallback, useState } from "react";
import { nanoid } from "nanoid";

import { useSessionStore } from "../hooks/useSessionStore";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useGitBranch } from "../hooks/useGitBranch";
import { useSplitTerminal } from "../hooks/useSplitTerminal";
import { useActivityDetection } from "../hooks/useActivityDetection";
import { useNotifications } from "../hooks/useNotifications";
import { useGroups } from "../hooks/useGroups";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { NewSessionDialog } from "./NewSessionDialog";
import { CloseSessionDialog } from "./CloseSessionDialog";
import { SettingsPanel } from "./SettingsPanel";
import { TerminalArea } from "./TerminalArea";
import type { ClaudeMode, ClaudeModel } from "../../shared/types";

export function TerminalMode() {
  const {
    sessions,
    activeSessionId,
    restored,
    createSession,
    removeSession,
    renameSession,
    moveSession,
    updateSession,
    setActiveSession,
    moveSessionsToGroup,
  } = useSessionStore();

  const { groups, addGroup, renameGroup, removeGroup } = useGroups();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [diffPanelOpen, setDiffPanelOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
  const split = useSplitTerminal();

  const { soundEnabled, toggleSound, handleActivityChange } = useNotifications({
    activeSessionId,
  });
  useActivityDetection({ sessions, updateSession, onActivityChange: handleActivityChange });
  useGitBranch({ sessions, updateSession });

  const toggleCheatSheet = useCallback(() => setShowCheatSheet((prev) => !prev), []);
  const toggleDiffPanel = useCallback(() => setDiffPanelOpen((prev) => !prev), []);

  const handleConfirmNewSession = useCallback(
    async (config: {
      workingDir: string;
      mode: ClaudeMode;
      model: ClaudeModel;
      group: string;
      existingBranch?: string;
    }) => {
      setSessionLoading(true);
      const sessionId = nanoid();
      let gitResult;
      let gitInfo;
      if (config.mode === "new") {
        gitResult = await window.colmena.git.setup(
          sessionId,
          config.workingDir,
          config.existingBranch,
        );
      } else {
        gitInfo = await window.colmena.git.getInfo(config.workingDir);
      }
      createSession(
        sessionId,
        config.workingDir,
        config.mode,
        config.model,
        config.group,
        gitResult,
        gitInfo,
      );
      setShowNewDialog(false);
      setSessionLoading(false);
    },
    [createSession],
  );

  const handleRenameSession = useCallback(
    (sessionId: string, name: string) => {
      renameSession(sessionId, name);
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;
      if (session.status === "exited") {
        if (session.claudeSessionId) {
          window.colmena.session.setClaudeSessionName(
            session.workingDir,
            session.claudeSessionId,
            name,
          );
        }
      } else if (session.activityState !== "running") {
        window.colmena.pty.write(sessionId, `/rename ${name}\r`);
      }
    },
    [sessions, renameSession],
  );

  const handleRequestClose = useCallback((sessionId: string) => {
    setClosingSessionId(sessionId);
  }, []);

  const handleConfirmClose = useCallback(() => {
    if (!closingSessionId) return;
    window.colmena.pty.destroy(closingSessionId);
    window.colmena.pty.destroy(`split-${closingSessionId}`);
    removeSession(closingSessionId);
    setClosingSessionId(null);
  }, [closingSessionId, removeSession]);

  const handleStatusChange = useCallback(
    (sessionId: string, status: "running" | "exited") => {
      updateSession(sessionId, { status });
    },
    [updateSession],
  );

  const handleRemoveGroup = useCallback(
    (groupId: string, targetId: string) => {
      if (targetId) moveSessionsToGroup(groupId, targetId);
      removeGroup(groupId);
    },
    [moveSessionsToGroup, removeGroup],
  );

  useKeyboardShortcuts({
    sessions,
    activeSessionId,
    setActiveSession,
    onNewTab: () => setShowNewDialog(true),
    onCloseTab: handleRequestClose,
    onToggleCheatSheet: toggleCheatSheet,
    onToggleDiffPanel: toggleDiffPanel,
    onToggleSplitTerminal: split.toggle,
  });

  const active = sessions.find((s) => s.id === activeSessionId);
  const diffPath = active?.worktreePath || (active?.baseBranch ? active?.workingDir : undefined);
  const closingSession = closingSessionId
    ? sessions.find((s) => s.id === closingSessionId)
    : undefined;

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
        onCloseSession={handleRequestClose}
        onRenameSession={handleRenameSession}
        onMoveSession={moveSession}
        showCheatSheet={showCheatSheet}
        onToggleCheatSheet={toggleCheatSheet}
        groups={groups}
        onManageGroups={() => setShowSettings(true)}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TitleBar
          active={active}
          splitOpen={split.isOpen}
          diffPanelOpen={diffPanelOpen}
          showDiffButton={!!(diffPath && active?.baseBranch)}
          onToggleSplit={split.toggle}
          onToggleDiff={toggleDiffPanel}
        />

        <TerminalArea
          sessions={sessions}
          activeSessionId={activeSessionId}
          restored={restored}
          diffPanelOpen={diffPanelOpen}
          diffPath={diffPath}
          activeBranch={active?.baseBranch}
          activeSessionName={active?.name}
          onCloseDiffPanel={() => setDiffPanelOpen(false)}
          onStatusChange={handleStatusChange}
          onNewTab={() => setShowNewDialog(true)}
          splitOpen={split.isOpen}
          splitRatio={split.splitRatio}
          onSplitDrag={split.handleDrag}
          onSetContainerHeight={split.setContainerHeight}
        />
      </div>

      <NewSessionDialog
        open={showNewDialog}
        loading={sessionLoading}
        groups={groups}
        onConfirm={handleConfirmNewSession}
        onCancel={() => setShowNewDialog(false)}
      />

      <CloseSessionDialog
        open={!!closingSessionId}
        sessionName={closingSession?.name || "Session"}
        onConfirm={handleConfirmClose}
        onCancel={() => setClosingSessionId(null)}
      />

      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        groups={groups}
        sessions={sessions}
        soundEnabled={soundEnabled}
        onToggleSound={() => toggleSound(!soundEnabled)}
        onAddGroup={addGroup}
        onRenameGroup={renameGroup}
        onRemoveGroup={handleRemoveGroup}
      />
    </div>
  );
}
