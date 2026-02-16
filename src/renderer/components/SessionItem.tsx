import { useCallback, useEffect, useRef, useState } from "react";

import type { Session } from "../../shared/types";
import { CLAUDE_MODES, CLAUDE_MODELS } from "../../shared/types";

interface SessionItemProps {
  session: Session;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  idling: "var(--text-secondary)",
  running: "var(--accent)",
  finished: "var(--success)",
  needs_input: "var(--error)",
};

function sessionSubtitle(session: Session): string {
  const mode = CLAUDE_MODES.find((m) => m.value === session.mode);
  const model = CLAUDE_MODELS.find((m) => m.value === session.model);
  const parts: string[] = [];
  if (mode && mode.value !== "new") parts.push(mode.label);
  if (model && model.value !== "default") parts.push(model.label);
  if (session.gitBranch) parts.push(session.gitBranch);
  return parts.length > 0 ? parts.join(" · ") : "Claude Code";
}

export function SessionItem({
  session,
  index,
  isActive,
  onSelect,
  onClose,
  onRename,
}: SessionItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = useCallback(() => {
    if (editValue.trim()) onRename(editValue.trim());
    setEditing(false);
  }, [editValue, onRename]);

  return (
    <div
      onClick={onSelect}
      onDoubleClick={() => {
        setEditing(true);
        setEditValue(session.name || `Tab ${index + 1}`);
      }}
      style={{
        padding: "8px 12px",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        backgroundColor: isActive ? "var(--surface-hover)" : "transparent",
        border: isActive ? "1px solid var(--border)" : "1px solid transparent",
        marginBottom: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "var(--transition)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "var(--surface-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: STATUS_COLORS[session.activityState] || "var(--text-secondary)",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditing(false);
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--accent)",
                borderRadius: 3,
                color: "var(--text)",
                fontSize: 12,
                fontWeight: 500,
                padding: "1px 4px",
                width: "100%",
                outline: "none",
              }}
            />
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isActive ? "var(--text)" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {session.name || `Tab ${index + 1}`}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {sessionSubtitle(session)}
              </div>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 14,
            padding: "0 2px",
            lineHeight: 1,
            opacity: 0.5,
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.color = "var(--error)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          x
        </button>
      )}
    </div>
  );
}
