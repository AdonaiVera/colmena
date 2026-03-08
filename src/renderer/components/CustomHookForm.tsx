import { useState } from "react";

import type { HookEvent } from "../../shared/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { triggerStyle, dropdownStyle, itemStyle } from "./dialog-styles";

interface CustomHookFormProps {
  onAdd: (event: string, matcher: string, command: string) => void;
  onCancel: () => void;
}

const EVENTS: HookEvent[] = [
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "UserPromptSubmit",
  "Notification",
  "PermissionRequest",
  "SubagentStop",
  "SubagentToolUse",
];

const fieldStyle: React.CSSProperties = {
  flex: 1,
  height: 34,
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  backgroundColor: "var(--bg)",
  color: "var(--text)",
  padding: "0 10px",
  outline: "none",
  fontFamily: "inherit",
};

const btnBase: React.CSSProperties = {
  height: 32,
  padding: "0 14px",
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 8,
  border: "1px solid var(--border)",
  cursor: "pointer",
  transition: "var(--transition)",
};

const selectTrigger: React.CSSProperties = {
  ...triggerStyle,
  height: 34,
  fontSize: 12,
  flex: 1,
};

export function CustomHookForm({ onAdd, onCancel }: CustomHookFormProps) {
  const [event, setEvent] = useState<string>(EVENTS[0]);
  const [matcher, setMatcher] = useState("");
  const [command, setCommand] = useState("");

  const handleAdd = () => {
    if (!command.trim()) return;
    onAdd(event, matcher.trim(), command.trim());
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        border: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger style={selectTrigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={dropdownStyle}>
            {EVENTS.map((e) => (
              <SelectItem key={e} value={e} style={itemStyle}>
                <span style={{ color: "var(--text)", fontSize: 12 }}>{e}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          value={matcher}
          onChange={(e) => setMatcher(e.target.value)}
          placeholder="Matcher (e.g. Bash)"
          style={fieldStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>
      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Command to run"
        style={{ ...fieldStyle, flex: "unset", fontFamily: "var(--font-mono)" }}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{ ...btnBase, backgroundColor: "transparent", color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!command.trim()}
          style={{
            ...btnBase,
            backgroundColor: "var(--accent)",
            borderColor: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            opacity: command.trim() ? 1 : 0.4,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
