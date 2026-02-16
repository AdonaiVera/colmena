import { useRef, useCallback, useState, useEffect } from "react";
import { DiffEditor, type Monaco } from "@monaco-editor/react";

import { inferLanguage, setupMonaco } from "../lib/monaco-config";
import type { GitDiffFile } from "../../shared/types";

interface DiffViewerProps {
  file: GitDiffFile | null;
  worktreePath: string;
  onRevertHunk: (filePath: string, hunkIndex: number) => void;
  onFileSaved: () => void;
}

type DiffEditorInstance = Parameters<
  NonNullable<React.ComponentProps<typeof DiffEditor>["onMount"]>
>[0];

const barStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "6px 12px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)",
};

const btnStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  padding: "3px 10px",
  fontSize: 11,
  transition: "var(--transition)",
  background: "var(--bg)",
  color: "var(--text-muted)",
};

const editorOptions = {
  renderSideBySide: false,
  readOnly: false,
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  lineNumbers: "on" as const,
  folding: true,
  glyphMargin: true,
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
};

export function DiffViewer({
  file,
  worktreePath,
  onRevertHunk,
  onFileSaved,
}: DiffViewerProps) {
  const editorRef = useRef<DiffEditorInstance | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const prevFileRef = useRef<string | null>(null);

  useEffect(() => {
    if (file?.filePath !== prevFileRef.current) {
      setDirty(false);
      prevFileRef.current = file?.filePath ?? null;
    }
  }, [file?.filePath]);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    setupMonaco(monaco);
    monacoRef.current = monaco;
  }, []);

  const handleMount = useCallback(
    (editor: DiffEditorInstance, monaco: Monaco) => {
      editorRef.current = editor;
      const modEditor = editor.getModifiedEditor();
      modEditor.updateOptions({ readOnly: false, glyphMargin: true });
      modEditor.onDidChangeModelContent(() => setDirty(true));

      modEditor.onMouseDown((e) => {
        if (
          e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
          e.target.position &&
          file
        ) {
          const line = e.target.position.lineNumber;
          const origLines = file.originalContent.split("\n");
          const model = modEditor.getModel();
          if (!model || line > origLines.length) return;
          model.applyEdits([
            {
              range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
              text: origLines[line - 1],
            },
          ]);
        }
      });

      setTimeout(() => {
        const changes = editor.getLineChanges();
        if (!changes) return;
        const decorations = changes.flatMap((c) => {
          const start = c.modifiedStartLineNumber;
          const end = c.modifiedEndLineNumber || start;
          const result = [];
          for (let ln = start; ln <= end; ln++) {
            result.push({
              range: new monaco.Range(ln, 1, ln, 1),
              options: {
                glyphMarginClassName: "colmena-revert-glyph",
                glyphMarginHoverMessage: { value: "Click to revert this line" },
              },
            });
          }
          return result;
        });
        modEditor.createDecorationsCollection(decorations);
      }, 300);
    },
    [file]
  );

  const handleSave = useCallback(async () => {
    if (!file || !editorRef.current) return;
    const content = editorRef.current.getModifiedEditor().getValue();
    setSaving(true);
    const ok = await window.colmena.git.writeFile(worktreePath, file.filePath, content);
    setSaving(false);
    if (ok) {
      setDirty(false);
      onFileSaved();
    }
  }, [file, worktreePath, onFileSaved]);

  const handleDiscard = useCallback(() => {
    if (!file || !editorRef.current) return;
    editorRef.current.getModifiedEditor().setValue(file.modifiedContent);
    setDirty(false);
  }, [file]);

  if (!file) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
        Select a file to view changes
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={barStyle}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>
          {file.filePath}
        </span>
        {file.hunks.map((_, i) => (
          <button
            key={i}
            onClick={() => onRevertHunk(file.filePath, i)}
            style={btnStyle}
            title={`Revert hunk ${i + 1}`}
          >
            Revert #{i + 1}
          </button>
        ))}
        {dirty && (
          <>
            <button onClick={handleDiscard} style={btnStyle}>
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...btnStyle,
                background: "var(--accent)",
                color: "var(--bg)",
                borderColor: "var(--accent)",
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <DiffEditor
          original={file.originalContent}
          modified={file.modifiedContent}
          language={inferLanguage(file.filePath)}
          theme="colmena-dark"
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={editorOptions}
        />
      </div>
    </div>
  );
}
