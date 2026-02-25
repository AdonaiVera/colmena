import { useEffect, useRef, useState } from "react";
import { Trash2, Volume2, VolumeX } from "lucide-react";

import type { Group, Session } from "../../shared/types";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  sessions: Session[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAddGroup: (label: string) => void;
  onRenameGroup: (id: string, label: string) => void;
  onRemoveGroup: (groupId: string, targetGroupId: string) => void;
}

const sectionHeader: React.CSSProperties = {
  padding: "10px 16px 4px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "5px 16px",
};

export function SettingsPanel({
  open,
  onClose,
  groups,
  sessions,
  soundEnabled,
  onToggleSound,
  onAddGroup,
  onRenameGroup,
  onRemoveGroup,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pendingDelete, setPendingDelete] = useState<{ groupId: string; targetId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setPendingDelete(null);
      setEditingId(null);
      setNewLabel("");
    }
  }, [open]);

  if (!open) return null;

  const sessionCount = (groupId: string) =>
    sessions.filter((s) => (s.group ?? "focus") === groupId).length;

  const handleTrash = (groupId: string) => {
    const count = sessionCount(groupId);
    if (count === 0) {
      onRemoveGroup(groupId, "");
      return;
    }
    const others = groups.filter((g) => g.id !== groupId);
    const defaultTarget = others[0]?.id ?? "";
    setPendingDelete({ groupId, targetId: defaultTarget });
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    onRemoveGroup(pendingDelete.groupId, pendingDelete.targetId);
    setPendingDelete(null);
  };

  const handleStartRename = (g: Group) => {
    setEditingId(g.id);
    setEditLabel(g.label);
  };

  const handleFinishRename = (id: string) => {
    const trimmed = editLabel.trim();
    if (trimmed) onRenameGroup(id, trimmed);
    setEditingId(null);
  };

  const handleAddGroup = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onAddGroup(trimmed);
    setNewLabel("");
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text)",
    fontSize: 12,
    padding: "3px 6px",
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: 11,
    padding: "3px 8px",
    whiteSpace: "nowrap",
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        bottom: 48,
        left: 12,
        width: 300,
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "12px 0",
        zIndex: 100,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          padding: "0 16px 8px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        Settings
      </div>

      <div style={sectionHeader}>Sound</div>
      <div style={rowStyle}>
        <button
          onClick={onToggleSound}
          style={{
            ...btnStyle,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: soundEnabled ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{soundEnabled ? "On" : "Off"}</span>
        </button>
      </div>

      <div style={{ margin: "8px 16px", height: 1, backgroundColor: "var(--border)" }} />

      <div style={sectionHeader}>Groups</div>

      {groups.map((g) => {
        const count = sessionCount(g.id);
        const isPending = pendingDelete?.groupId === g.id;
        const others = groups.filter((og) => og.id !== g.id);

        if (isPending) {
          return (
            <div key={g.id} style={{ padding: "6px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Move {count} session{count !== 1 ? "s" : ""} to:
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select
                  value={pendingDelete.targetId}
                  onChange={(e) => setPendingDelete({ ...pendingDelete, targetId: e.target.value })}
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--text)",
                    fontSize: 12,
                    padding: "3px 6px",
                  }}
                >
                  {others.map((og) => (
                    <option key={og.id} value={og.id}>{og.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleConfirmDelete}
                  style={{ ...btnStyle, color: "#e74c3c", borderColor: "#e74c3c" }}
                >
                  Confirm
                </button>
                <button onClick={() => setPendingDelete(null)} style={btnStyle}>
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={g.id} style={{ ...rowStyle }}>
            {editingId === g.id ? (
              <input
                autoFocus
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={() => handleFinishRename(g.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishRename(g.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                style={{ ...inputStyle }}
              />
            ) : (
              <span
                onDoubleClick={() => handleStartRename(g)}
                style={{ flex: 1, fontSize: 12, color: "var(--text)", cursor: "text" }}
              >
                {g.label}
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 16, textAlign: "right" }}>
              {count}
            </span>
            <button
              onClick={() => handleTrash(g.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 2,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e74c3c")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      <div style={{ ...rowStyle, paddingTop: 8 }}>
        <input
          placeholder="New group name"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddGroup(); }}
          style={{ ...inputStyle }}
        />
        <button
          onClick={handleAddGroup}
          style={{ ...btnStyle, color: "var(--accent)", borderColor: "var(--accent)" }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
