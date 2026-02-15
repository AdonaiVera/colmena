interface FolderPickerProps {
  workingDir: string;
  folderName: string | null;
  onBrowse: () => void;
}

export function FolderPicker({
  workingDir,
  folderName,
  onBrowse,
}: FolderPickerProps) {
  return (
    <div style={{ padding: "20px 28px" }}>
      <div
        onClick={onBrowse}
        style={{
          backgroundColor: "var(--bg)",
          border: workingDir
            ? "1px solid var(--accent)"
            : "1px dashed #3f3f46",
          borderRadius: 10,
          padding: "16px 18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 14,
          transition: "border-color 150ms ease",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: workingDir
              ? "rgba(245, 158, 11, 0.1)"
              : "var(--surface-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {workingDir ? "\u{1F4C2}" : "\u{1F4C1}"}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: workingDir ? "var(--text)" : "var(--text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {folderName || "Select a folder"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 4,
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {workingDir || "Uses home directory if empty"}
          </div>
        </div>
      </div>
    </div>
  );
}
