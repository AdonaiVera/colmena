import type { GitDiffFile } from "../../shared/types";

interface DiffFileListProps {
  files: GitDiffFile[];
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  onRevertFile: (filePath: string) => void;
}

const STATUS_LABELS: Record<GitDiffFile["status"], { letter: string; color: string }> = {
  modified: { letter: "M", color: "var(--accent)" },
  added: { letter: "A", color: "var(--success)" },
  deleted: { letter: "D", color: "var(--error)" },
  renamed: { letter: "R", color: "var(--info)" },
};

function getFileName(filePath: string): string {
  return filePath.split("/").pop() || filePath;
}

export function DiffFileList({
  files,
  selectedFile,
  onSelectFile,
  onRevertFile,
}: DiffFileListProps) {
  return (
    <div
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          fontSize: 11,
          color: "var(--text-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Changed Files ({files.length})
      </div>
      {files.map((file) => {
        const status = STATUS_LABELS[file.status];
        const isSelected = file.filePath === selectedFile;

        return (
          <div
            key={file.filePath}
            className="diff-file-row"
            onClick={() => onSelectFile(file.filePath)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              cursor: "pointer",
              backgroundColor: isSelected ? "var(--surface-hover)" : "transparent",
              transition: "var(--transition)",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: status.color,
                fontFamily: "var(--font-mono)",
                width: 14,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {status.letter}
            </span>
            <span
              style={{
                fontSize: 12,
                color: isSelected ? "var(--text)" : "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
              title={file.filePath}
            >
              {getFileName(file.filePath)}
            </span>
            <button
              className="diff-revert-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRevertFile(file.filePath);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 11,
                padding: "0 2px",
              }}
              title={`Revert ${getFileName(file.filePath)}`}
            >
              revert
            </button>
          </div>
        );
      })}
      {files.length === 0 && (
        <div
          style={{
            padding: "24px 12px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          No changes detected
        </div>
      )}
    </div>
  );
}
