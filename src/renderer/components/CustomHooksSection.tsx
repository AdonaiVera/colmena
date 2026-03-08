import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";

import type { ClaudeHookRule } from "../../shared/types";
import { CustomHookForm } from "./CustomHookForm";

interface CustomHooksSectionProps {
  customHooks: Record<string, ClaudeHookRule[]>;
  onAdd: (event: string, matcher: string, command: string) => void;
  onRemove: (event: string, index: number) => void;
}

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "2px 7px",
  borderRadius: 6,
  backgroundColor: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--accent)",
  fontFamily: "var(--font-mono)",
  flexShrink: 0,
};

const addBtnStyle: React.CSSProperties = {
  height: 32,
  padding: "0 14px",
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 8,
  border: "1px solid var(--border)",
  cursor: "pointer",
  transition: "var(--transition)",
  backgroundColor: "transparent",
  color: "var(--text-muted)",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

export function CustomHooksSection({ customHooks, onAdd, onRemove }: CustomHooksSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const allEntries: Array<{ event: string; rule: ClaudeHookRule; index: number }> = [];
  for (const [evt, rules] of Object.entries(customHooks)) {
    rules.forEach((rule, i) => allEntries.push({ event: evt, rule, index: i }));
  }

  const handleAdd = (event: string, matcher: string, command: string) => {
    onAdd(event, matcher, command);
    setShowForm(false);
  };

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text)",
          cursor: "pointer",
          padding: 0,
          fontSize: 13,
          fontWeight: 600,
          width: "100%",
        }}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Custom Hooks
        {allEntries.length > 0 && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
            ({allEntries.length})
          </span>
        )}
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>Advanced</span>
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {allEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {allEntries.map((entry) => (
                <div
                  key={`${entry.event}-${entry.index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 8,
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={badgeStyle}>{entry.event}</span>
                  {entry.rule.matcher && (
                    <span style={{ color: "var(--text-secondary)", fontSize: 11, flexShrink: 0 }}>
                      {entry.rule.matcher}
                    </span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.rule.hooks[0]?.command || ""}
                  </span>
                  <button
                    onClick={() => onRemove(entry.event, entry.index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 2,
                      flexShrink: 0,
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <CustomHookForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              style={addBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              + Add Hook
            </button>
          )}
        </div>
      )}
    </div>
  );
}
