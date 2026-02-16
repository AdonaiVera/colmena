import { ColmenaLogo } from "./ColmenaLogo";

interface WelcomeScreenProps {
  onNewTab: () => void;
}

export function WelcomeScreen({ onNewTab }: WelcomeScreenProps) {
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
      <ColmenaLogo size={56} />
      <div style={{ fontSize: 16, fontWeight: 500 }}>Welcome to Colmena</div>
      <div style={{ fontSize: 13 }}>Create a new tab to get started</div>
      <button
        onClick={onNewTab}
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
        + New Tab
      </button>
      <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7 }}>or press Cmd+T</div>
    </div>
  );
}
