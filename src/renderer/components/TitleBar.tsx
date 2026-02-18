import type { Session } from "../../shared/types";
import { getBaseName } from "../lib/utils";

interface TitleBarProps {
  active: Session | undefined;
  splitOpen: boolean;
  diffPanelOpen: boolean;
  evaluatorPanelOpen: boolean;
  showDiffButton: boolean;
  onToggleSplit: () => void;
  onToggleDiff: () => void;
  onToggleEvaluator: () => void;
}

const btnStyle = (on: boolean): React.CSSProperties => ({
  background: on ? "var(--surface-hover)" : "none",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: on ? "var(--accent)" : "var(--text-muted)",
  cursor: "pointer",
  padding: "4px 10px",
  fontSize: 11,
  transition: "var(--transition)",
});

export function TitleBar({
  active,
  splitOpen,
  diffPanelOpen,
  evaluatorPanelOpen,
  showDiffButton,
  onToggleSplit,
  onToggleDiff,
  onToggleEvaluator,
}: TitleBarProps) {
  return (
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
      {active?.gitBranch && (
        <span style={{ color: "var(--accent)", fontSize: 11 }}>{active.gitBranch}</span>
      )}
      <div style={{ flex: 1 }} />
      {active && (
        <button className="titlebar-no-drag" onClick={onToggleSplit} style={btnStyle(splitOpen)}>
          Terminal
        </button>
      )}
      {showDiffButton && (
        <button className="titlebar-no-drag" onClick={onToggleDiff} style={btnStyle(diffPanelOpen)}>
          Diff
        </button>
      )}
      {active && (
        <button
          className="titlebar-no-drag"
          onClick={onToggleEvaluator}
          style={btnStyle(evaluatorPanelOpen)}
        >
          Evaluate
        </button>
      )}
    </div>
  );
}
