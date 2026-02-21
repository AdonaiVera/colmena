import { ArrowLeft, Volume2, VolumeX } from "lucide-react";

import type { Session } from "../../shared/types";
import { ColmenaLogo } from "./ColmenaLogo";
import { SessionItem } from "./SessionItem";
import { CheatSheet } from "./CheatSheet";
import { MOD_KEY } from "../lib/shortcuts";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onCloseSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  showCheatSheet: boolean;
  onToggleCheatSheet: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBack?: () => void;
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
  showCheatSheet,
  onToggleCheatSheet,
  soundEnabled,
  onToggleSound,
  onBack,
}: SidebarProps) {
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
        {sessions.map((session, index) => (
          <SessionItem
            key={session.id}
            session={session}
            index={index}
            isActive={session.id === activeSessionId}
            onSelect={() => onSelectSession(session.id)}
            onClose={() => onCloseSession(session.id)}
            onRename={(name) => onRenameSession(session.id, name)}
          />
        ))}

        {sessions.length === 0 && (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            No tabs yet.
            <br />
            Click + New to start.
          </div>
        )}
      </div>

      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          className="titlebar-no-drag"
          onClick={onToggleSound}
          style={{ ...footerBtn, color: soundEnabled ? "var(--accent)" : "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>Sound</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              opacity: 0.6,
            }}
          >
            {soundEnabled ? "On" : "Off"}
          </span>
        </button>
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
      </div>

      {onBack && (
        <div style={{ padding: "0 12px 8px", borderTop: "1px solid var(--border)" }}>
          <button
            className="titlebar-no-drag"
            onClick={onBack}
            style={footerBtn}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft size={14} />
            <span>Back to Landing</span>
          </button>
        </div>
      )}
      <CheatSheet open={showCheatSheet} onClose={onToggleCheatSheet} />
    </div>
  );
}
