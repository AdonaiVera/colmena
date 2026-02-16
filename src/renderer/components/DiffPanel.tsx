import { useCallback, useEffect, useRef, useState } from "react";

import { DiffFileList } from "./DiffFileList";
import { DiffViewer } from "./DiffViewer";
import type { GitDiffFile } from "../../shared/types";

interface DiffPanelProps {
  open: boolean;
  onClose: () => void;
  worktreePath: string;
  baseBranch: string;
  sessionName: string;
}

export function DiffPanel({
  open,
  onClose,
  worktreePath,
  baseBranch,
  sessionName,
}: DiffPanelProps) {
  const [files, setFiles] = useState<GitDiffFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedRef = useRef(selectedFile);
  selectedRef.current = selectedFile;

  const fetchDiff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.colmena.git.getDiff(worktreePath, baseBranch);
      setFiles(result);
      if (result.length > 0 && !selectedRef.current) {
        setSelectedFile(result[0].filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load diff");
    } finally {
      setLoading(false);
    }
  }, [worktreePath, baseBranch]);

  useEffect(() => {
    if (open) fetchDiff();
  }, [open, fetchDiff]);

  const filesRef = useRef(files);
  filesRef.current = files;

  const handleRevertFile = useCallback(
    async (filePath: string) => {
      const ok = await window.colmena.git.revertFile(worktreePath, filePath, baseBranch);
      if (ok) {
        setFiles((prev) => prev.filter((f) => f.filePath !== filePath));
        if (selectedRef.current === filePath) {
          setSelectedFile(filesRef.current.find((f) => f.filePath !== filePath)?.filePath || null);
        }
      }
    },
    [worktreePath, baseBranch]
  );

  const handleRevertHunk = useCallback(
    async (filePath: string, hunkIndex: number) => {
      const ok = await window.colmena.git.revertHunk(
        worktreePath,
        filePath,
        hunkIndex,
        baseBranch
      );
      if (ok) fetchDiff();
    },
    [worktreePath, baseBranch, fetchDiff]
  );

  if (!open) return null;

  const activeFile = files.find((f) => f.filePath === selectedFile) || null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            Changes
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {sessionName} vs {baseBranch}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={fetchDiff}
            disabled={loading}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "3px 10px",
              fontSize: 11,
              transition: "var(--transition)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "3px 10px",
              fontSize: 11,
              transition: "var(--transition)",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", color: "var(--error)", fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <DiffFileList
          files={files}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          onRevertFile={handleRevertFile}
        />
        <DiffViewer
          file={activeFile}
          worktreePath={worktreePath}
          onRevertHunk={handleRevertHunk}
          onFileSaved={fetchDiff}
        />
      </div>
    </div>
  );
}
