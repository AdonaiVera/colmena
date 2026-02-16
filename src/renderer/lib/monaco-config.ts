import type { Monaco } from "@monaco-editor/react";

const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  rs: "rust",
  go: "go",
  java: "java",
  json: "json",
  md: "markdown",
  css: "css",
  html: "html",
  yml: "yaml",
  yaml: "yaml",
  sh: "shell",
  bash: "shell",
  sql: "sql",
};

export function inferLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "plaintext";
}

export function setupMonaco(monaco: Monaco): void {
  monaco.editor.defineTheme("colmena-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0a0a0a",
      "editor.foreground": "#e4e4e7",
      "diffEditor.insertedTextBackground": "#10b98133",
      "diffEditor.removedTextBackground": "#ef444433",
      "diffEditor.insertedLineBackground": "#10b98118",
      "diffEditor.removedLineBackground": "#ef444418",
      "editorLineNumber.foreground": "#52525b",
      "editorGutter.background": "#0a0a0a",
    },
  });

  if (!document.getElementById("colmena-monaco-styles")) {
    const style = document.createElement("style");
    style.id = "colmena-monaco-styles";
    style.textContent = `
      .colmena-revert-glyph {
        opacity: 0;
        transition: opacity 150ms;
        cursor: pointer !important;
      }
      .colmena-revert-glyph::after {
        content: "↩";
        color: var(--accent);
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
      .margin-view-overlays:hover .colmena-revert-glyph {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }
}
