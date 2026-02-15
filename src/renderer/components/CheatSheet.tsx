import { useEffect, useRef } from "react";

import {
  SHORTCUTS,
  CLAUDE_COMMANDS,
  CLAUDE_COMMAND_GROUPS,
  formatShortcut,
  MOD_KEY,
} from "../lib/shortcuts";

interface CheatSheetProps {
  open: boolean;
  onClose: () => void;
}

const shortcutGroups = [
  { key: "tabs" as const, label: "Tabs" },
  { key: "terminal" as const, label: "Terminal" },
  { key: "app" as const, label: "App" },
];

const kbdStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--accent)",
  backgroundColor: "var(--bg)",
  padding: "2px 6px",
  borderRadius: 4,
  border: "1px solid var(--border)",
  fontFamily: "var(--font-mono)",
  whiteSpace: "nowrap",
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: "10px 16px 4px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "5px 16px",
  gap: 12,
};

const descStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
};

export function CheatSheet({ open, onClose }: CheatSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        bottom: 48,
        left: 12,
        width: 320,
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Colmena Shortcuts</span>
        <kbd style={{ ...kbdStyle, fontSize: 10 }}>{MOD_KEY}+?</kbd>
      </div>

      {shortcutGroups.map((group) => {
        const items = SHORTCUTS.filter((s) => s.group === group.key);
        if (items.length === 0) return null;
        return (
          <div key={group.key}>
            <div style={sectionHeaderStyle}>{group.label}</div>
            {items.map((shortcut) => (
              <div key={shortcut.label} style={rowStyle}>
                <span style={descStyle}>{shortcut.label}</span>
                <kbd style={kbdStyle}>{formatShortcut(shortcut)}</kbd>
              </div>
            ))}
          </div>
        );
      })}

      <div
        style={{
          margin: "10px 16px",
          height: 1,
          backgroundColor: "var(--border)",
        }}
      />

      <div
        style={{
          padding: "0 16px 8px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--accent)",
        }}
      >
        Claude Code
      </div>

      {CLAUDE_COMMAND_GROUPS.map((group) => {
        const items = CLAUDE_COMMANDS.filter((c) => c.group === group.key);
        return (
          <div key={group.key}>
            <div style={sectionHeaderStyle}>{group.label}</div>
            {items.map((cmd) => (
              <div key={cmd.command} style={rowStyle}>
                <span style={descStyle}>{cmd.desc}</span>
                <kbd style={kbdStyle}>{cmd.command}</kbd>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
