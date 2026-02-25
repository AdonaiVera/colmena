import { useState } from "react";

import { ColmenaLogo } from "./ColmenaLogo";

interface LandingScreenProps {
  onSelectTerminal: () => void;
}

const cardBase: React.CSSProperties = {
  width: 260,
  padding: "40px 24px",
  borderRadius: 16,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  cursor: "pointer",
  transition: "border-color 150ms ease, background-color 150ms ease",
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text)",
};

const descStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  textAlign: "center",
  lineHeight: 1.5,
};

function ModeCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardBase,
        borderColor: hovered ? "var(--accent)" : "var(--border)",
        backgroundColor: hovered ? "var(--surface-hover)" : "var(--surface)",
      }}
    >
      {icon}
      <span style={titleStyle}>{title}</span>
      <span style={descStyle}>{description}</span>
    </div>
  );
}

export function LandingScreen({ onSelectTerminal }: LandingScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--bg)",
        gap: 12,
      }}
    >
      <ColmenaLogo size={48} />
      <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
        Colmena
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
        Multi-agent Claude Code terminal
      </div>
      <ModeCard
        icon={<ColmenaLogo size={48} />}
        title="Multi-Session Terminal"
        description="Run multiple Claude Code sessions in parallel with git worktrees"
        onClick={onSelectTerminal}
      />
    </div>
  );
}
