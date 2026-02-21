import { useState } from "react";

import { ColmenaLogo } from "./ColmenaLogo";

interface LandingScreenProps {
  onSelectTerminal: () => void;
  onSelectEvals: () => void;
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

function PollenIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="6" fill="var(--accent)" opacity="0.9" />
      <ellipse cx="32" cy="18" rx="5" ry="8" fill="var(--accent)" opacity="0.5" />
      <ellipse cx="32" cy="46" rx="5" ry="8" fill="var(--accent)" opacity="0.5" />
      <ellipse cx="18" cy="25" rx="5" ry="8" fill="var(--accent)" opacity="0.4" transform="rotate(60 18 25)" />
      <ellipse cx="46" cy="39" rx="5" ry="8" fill="var(--accent)" opacity="0.4" transform="rotate(60 46 39)" />
      <ellipse cx="18" cy="39" rx="5" ry="8" fill="var(--accent)" opacity="0.35" transform="rotate(-60 18 39)" />
      <ellipse cx="46" cy="25" rx="5" ry="8" fill="var(--accent)" opacity="0.35" transform="rotate(-60 46 25)" />
    </svg>
  );
}

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

export function LandingScreen({ onSelectTerminal, onSelectEvals }: LandingScreenProps) {
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
        Choose your workspace
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <ModeCard
          icon={<ColmenaLogo size={48} />}
          title="Multi-Session Terminal"
          description="Run multiple Claude Code sessions in parallel with git worktrees"
          onClick={onSelectTerminal}
        />
        <ModeCard
          icon={<PollenIcon />}
          title="Pollen Test"
          description="Evaluate how tools, MCP servers, and hooks improve Claude Code"
          onClick={onSelectEvals}
        />
      </div>
    </div>
  );
}
