import { ChevronDown, ChevronRight } from "lucide-react";

import type { Session } from "../../shared/types";
import { SessionItem } from "./SessionItem";

export type DropTarget = { id: string; before: boolean } | { groupId: string };

interface GroupSectionProps {
  id: string;
  label: string;
  sessions: Session[];
  collapsed: boolean;
  activeSessionId: string | null;
  onToggle: () => void;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  draggedId: string | null;
  dropTarget: DropTarget | null;
  onDragStart: (sessionId: string) => void;
  onDragOver: (target: DropTarget) => void;
  onDrop: (targetId: string | null, before: boolean, groupId: string) => void;
  onDragEnd: () => void;
}

const DropLine = () => (
  <div
    style={{
      height: 2,
      background: "var(--accent)",
      margin: "1px 8px",
      borderRadius: 1,
      pointerEvents: "none",
    }}
  />
);

export function GroupSection({
  id,
  label,
  sessions,
  collapsed,
  activeSessionId,
  onToggle,
  onSelectSession,
  onCloseSession,
  onRenameSession,
  draggedId,
  dropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: GroupSectionProps) {
  const isGroupDrop = dropTarget && "groupId" in dropTarget && dropTarget.groupId === id;

  const showLineBefore = (sessionId: string) =>
    draggedId !== sessionId &&
    dropTarget !== null &&
    "id" in dropTarget &&
    dropTarget.id === sessionId &&
    dropTarget.before;

  const showLineAfterLast = (sessionId: string) => {
    if (sessions[sessions.length - 1]?.id !== sessionId) return false;
    return (
      draggedId !== sessionId &&
      dropTarget !== null &&
      "id" in dropTarget &&
      dropTarget.id === sessionId &&
      !dropTarget.before
    );
  };

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={onToggle}
        onDragOver={(e) => { e.preventDefault(); onDragOver({ groupId: id }); }}
        onDrop={(e) => { e.preventDefault(); onDrop(null, false, id); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px",
          cursor: "pointer",
          borderRadius: "var(--radius)",
          color: isGroupDrop ? "var(--accent)" : "var(--text-muted)",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          backgroundColor: isGroupDrop ? "var(--surface-hover)" : "transparent",
          transition: "var(--transition)",
          userSelect: "none",
          border: isGroupDrop ? "1px dashed var(--accent)" : "1px solid transparent",
        }}
        onMouseEnter={(e) => { if (!isGroupDrop) e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { if (!isGroupDrop) e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ opacity: 0.5, fontWeight: 400 }}>{sessions.length}</span>
      </div>

      {!collapsed && (
        <div style={{ paddingTop: 2 }}>
          {sessions.map((session, idx) => (
            <div key={session.id}>
              {showLineBefore(session.id) && <DropLine />}
              <SessionItem
                session={session}
                index={idx}
                isActive={session.id === activeSessionId}
                onSelect={() => onSelectSession(session.id)}
                onClose={() => onCloseSession(session.id)}
                onRename={(name) => onRenameSession(session.id, name)}
                isDragged={session.id === draggedId}
                onDragStart={() => onDragStart(session.id)}
                onDragOver={(before) => onDragOver({ id: session.id, before })}
                onDrop={(before) => onDrop(session.id, before, id)}
                onDragEnd={onDragEnd}
              />
              {showLineAfterLast(session.id) && <DropLine />}
            </div>
          ))}

          {sessions.length === 0 && (
            <div
              onDragOver={(e) => { e.preventDefault(); onDragOver({ groupId: id }); }}
              onDrop={(e) => { e.preventDefault(); onDrop(null, false, id); }}
              style={{
                padding: "6px 12px",
                color: "var(--text-muted)",
                fontSize: 11,
                textAlign: "center",
                opacity: 0.5,
                border: isGroupDrop ? "1px dashed var(--accent)" : "1px dashed var(--border)",
                borderRadius: "var(--radius)",
                margin: "2px 4px",
              }}
            >
              empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}
