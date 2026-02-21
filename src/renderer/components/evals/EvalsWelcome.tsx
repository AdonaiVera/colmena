import { FlaskConical } from "lucide-react";

interface EvalsWelcomeProps {
  onNewExperiment: () => void;
}

export function EvalsWelcome({ onNewExperiment }: EvalsWelcomeProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 16,
        color: "var(--text-muted)",
      }}
    >
      <FlaskConical size={48} strokeWidth={1.5} />
      <div style={{ fontSize: 16, fontWeight: 500 }}>Welcome to Pollen Test</div>
      <div style={{ fontSize: 13, maxWidth: 340, textAlign: "center", lineHeight: 1.6 }}>
        Evaluate how tools, MCP servers, hooks, and commands improve Claude Code performance
      </div>
      <button
        onClick={onNewExperiment}
        style={{
          marginTop: 8,
          padding: "8px 20px",
          backgroundColor: "var(--accent)",
          color: "var(--bg)",
          border: "none",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          transition: "var(--transition)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
      >
        + New Experiment
      </button>
    </div>
  );
}
