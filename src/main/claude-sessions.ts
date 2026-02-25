import { existsSync, readFileSync, writeFileSync, watch, readdirSync } from "fs";
import { join } from "path";
import os from "os";
import type { BrowserWindow } from "electron";

function getProjectHash(workingDir: string): string {
  return workingDir.replace(/[/.]/g, "-");
}

function getProjectDir(workingDir: string): string {
  return join(os.homedir(), ".claude", "projects", getProjectHash(workingDir));
}

function getJSONLPath(workingDir: string, claudeSessionId: string): string {
  return join(getProjectDir(workingDir), `${claudeSessionId}.jsonl`);
}

function isSessionJSONL(filename: string): boolean {
  return filename.endsWith(".jsonl") && !filename.startsWith("agent-");
}

export function readCustomTitle(workingDir: string, claudeSessionId: string): string | null {
  const jsonlPath = getJSONLPath(workingDir, claudeSessionId);
  if (!existsSync(jsonlPath)) return null;
  try {
    const content = readFileSync(jsonlPath, "utf-8");
    const lines = content.split("\n").filter(Boolean).reverse();
    for (const line of lines) {
      const obj = JSON.parse(line);
      if (obj.type === "custom-title" && obj.customTitle) return obj.customTitle;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCustomTitle(
  workingDir: string,
  claudeSessionId: string,
  title: string,
): void {
  const jsonlPath = getJSONLPath(workingDir, claudeSessionId);
  if (!existsSync(jsonlPath)) return;
  try {
    const entry = JSON.stringify({
      type: "custom-title",
      customTitle: title,
      sessionId: claudeSessionId,
    });
    writeFileSync(jsonlPath, readFileSync(jsonlPath, "utf-8") + entry + "\n", "utf-8");
  } catch {}
}

const watchers = new Map<string, () => void>();

export function linkClaudeSession(
  window: BrowserWindow,
  colmenaId: string,
  workingDir: string,
): void {
  const projectDir = getProjectDir(workingDir);
  if (!existsSync(projectDir)) return;

  const seen = new Map<string, string>();

  const check = (filename?: string | null) => {
    let files: string[];
    if (filename) {
      if (!isSessionJSONL(filename)) return;
      files = [filename];
    } else {
      try {
        files = readdirSync(projectDir).filter(isSessionJSONL);
      } catch {
        return;
      }
    }
    for (const file of files) {
      const claudeSessionId = file.slice(0, -".jsonl".length);
      const title = readCustomTitle(workingDir, claudeSessionId);
      if (title && title !== seen.get(claudeSessionId)) {
        seen.set(claudeSessionId, title);
        if (!window.isDestroyed()) {
          window.webContents.send("session:syncName", colmenaId, claudeSessionId, title);
        }
      }
    }
  };

  check(null);

  const watcher = watch(projectDir, (_event, filename) => check(filename));
  watcher.on("error", () => {});
  watchers.set(colmenaId, () => watcher.close());
}

export function unlinkClaudeSession(colmenaId: string): void {
  const stop = watchers.get(colmenaId);
  if (stop) {
    stop();
    watchers.delete(colmenaId);
  }
}
