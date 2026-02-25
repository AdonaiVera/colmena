import { useCallback, useState } from "react";
import { Settings } from "lucide-react";

import type { Group, Session } from "../../shared/types";
import { ColmenaLogo } from "./ColmenaLogo";
import { GroupSection } from "./GroupSection";
import type { DropTarget } from "./GroupSection";
import { CheatSheet } from "./CheatSheet";
import { MOD_KEY } from "../lib/shortcuts";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onCloseSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  onMoveSession: (
    sessionId: string,
    targetId: string | null,
    position: "before" | "after",
    group: string,
  ) => void;
  showCheatSheet: boolean;
  onToggleCheatSheet: () => void;
  groups: Group[];
  onManageGroups: () => void;
}

const footerBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  background: "none",
  border: "none",
  borderRadius: "var(--radius)",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "6px 8px",
  fontSize: 12,
  transition: "var(--transition)",
};

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onCloseSession,
  onRenameSession,
  onMoveSession,
  showCheatSheet,
  onToggleCheatSheet,
  groups,
  onManageGroups,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const groupIds = new Set(groups.map((g) => g.id));
  const ungroupedSessions = sessions.filter((s) => {
    const gid = s.group ?? "focus";
    return !groupIds.has(gid);
  });

  const handleDragStart = useCallback((sessionId: string) => setDraggedId(sessionId), []);
  const handleDragOver = useCallback((target: DropTarget) => setDropTarget(target), []);
  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string | null, before: boolean, groupId: string) => {
      if (!draggedId) return;
      onMoveSession(draggedId, targetId, before ? "before" : "after", groupId);
      setDraggedId(null);
      setDropTarget(null);
    },
    [draggedId, onMoveSession],
  );

  const toggleGroup = useCallback(
    (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] })),
    [],
  );

  return (
    <div
      style={{
        width: 220,
        height: "100%",
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="titlebar-drag" style={{ height: 52 }} />

      <div
        style={{
          padding: "0 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ColmenaLogo size={22} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--accent)" }}>Colmena</span>
        </div>
        <button
          className="titlebar-no-drag"
          onClick={onNewSession}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: 12,
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          + New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {groups.map((group) => (
          <GroupSection
            key={group.id}
            id={group.id}
            label={group.label}
            sessions={sessions.filter((s) => (s.group ?? "focus") === group.id)}
            collapsed={!!collapsed[group.id]}
            activeSessionId={activeSessionId}
            onToggle={() => toggleGroup(group.id)}
            onSelectSession={onSelectSession}
            onCloseSession={onCloseSession}
            onRenameSession={onRenameSession}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
        {ungroupedSessions.length > 0 && (
          <GroupSection
            key="__ungrouped"
            id="__ungrouped"
            label="Ungrouped"
            sessions={ungroupedSessions}
            collapsed={!!collapsed["__ungrouped"]}
            activeSessionId={activeSessionId}
            onToggle={() => toggleGroup("__ungrouped")}
            onSelectSession={onSelectSession}
            onCloseSession={onCloseSession}
            onRenameSession={onRenameSession}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        )}
      </div>

      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
        <button
          className="titlebar-no-drag"
          onClick={onToggleCheatSheet}
          style={footerBtn}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <span style={{ fontSize: 14 }}>?</span>
          <span>Shortcuts</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              opacity: 0.6,
              fontFamily: "var(--font-mono)",
            }}
          >
            {MOD_KEY}+?
          </span>
        </button>
        <button
          className="titlebar-no-drag"
          onClick={onManageGroups}
          style={footerBtn}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>
      </div>

      <CheatSheet open={showCheatSheet} onClose={onToggleCheatSheet} />
    </div>
  );
}
