import * as pty from "node-pty";
import { BrowserWindow } from "electron";
import os from "os";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

import type { PtyCreateOptions, ActivityState } from "../shared/types";

interface PtySession {
  process: pty.IPty;
  sessionId: string;
  pollInterval: ReturnType<typeof setInterval> | undefined;
  lastStatus: string;
}

const POLL_INTERVAL_MS = 250;
const SESSIONS_DIR = join(os.homedir(), ".colmena", "sessions");
const sessions = new Map<string, PtySession>();

let cachedShellPath: string | null = null;

function getLoginShellPath(): string {
  if (cachedShellPath) return cachedShellPath;
  if (process.platform === "win32") return process.env.PATH || "";

  const shell = process.env.SHELL || "/bin/zsh";
  try {
    const result = execFileSync(shell, ["-ilc", "echo __PATH__=$PATH"], {
      encoding: "utf-8",
      timeout: 5000,
      env: { ...process.env },
    });
    const match = result.match(/__PATH__=(.+)/);
    if (match) {
      cachedShellPath = match[1].trim();
      return cachedShellPath;
    }
  } catch {}
  return process.env.PATH || "";
}

function getDefaultShell(): string {
  if (process.platform === "win32") {
    return process.env.COMSPEC || "powershell.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}

function createSessionDir(sessionId: string): void {
  const dir = join(SESSIONS_DIR, sessionId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "status"), "", "utf-8");
}

function cleanupSessionDir(sessionId: string): void {
  const dir = join(SESSIONS_DIR, sessionId);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readSessionStatus(sessionId: string): string {
  try {
    const content = readFileSync(join(SESSIONS_DIR, sessionId, "status"), "utf-8");
    return content.split("\n")[0]?.trim() || "";
  } catch {
    return "";
  }
}

function mapStatusToActivity(status: string): ActivityState | null {
  switch (status) {
    case "UserPromptSubmit":
    case "PreToolUse":
      return "running";
    case "Stop":
      return "idling";
    case "PermissionRequest":
    case "AskUserQuestion":
    case "NeedsInput":
      return "needs_input";
    default:
      return null;
  }
}

export function createSession(window: BrowserWindow, opts: PtyCreateOptions): void {
  if (sessions.has(opts.sessionId)) return;

  const shell = getDefaultShell();
  const cwd = opts.workingDir || os.homedir();

  createSessionDir(opts.sessionId);

  const env = {
    ...process.env,
    PATH: getLoginShellPath(),
    COLMENA_SESSION_ID: opts.sessionId,
  };

  let shellArgs: string[];
  if (opts.command) {
    if (process.platform === "win32") {
      shellArgs = ["/c", opts.command];
    } else {
      shellArgs = ["-c", opts.command];
    }
  } else {
    shellArgs = [];
  }

  const ptyProcess = pty.spawn(shell, shellArgs, {
    name: "xterm-256color",
    cols: opts.cols,
    rows: opts.rows,
    cwd,
    env,
  });

  const session: PtySession = {
    process: ptyProcess,
    sessionId: opts.sessionId,
    pollInterval: undefined,
    lastStatus: "",
  };

  ptyProcess.onData((data) => {
    if (!window.isDestroyed()) {
      window.webContents.send("pty:data", opts.sessionId, data);
    }
  });

  session.pollInterval = setInterval(() => {
    const status = readSessionStatus(opts.sessionId);
    if (status === session.lastStatus || !status) return;
    session.lastStatus = status;
    const activity = mapStatusToActivity(status);
    if (activity && !window.isDestroyed()) {
      window.webContents.send("pty:activity", opts.sessionId, activity);
    }
  }, POLL_INTERVAL_MS);

  ptyProcess.onExit(({ exitCode }) => {
    clearInterval(session.pollInterval);
    cleanupSessionDir(opts.sessionId);
    if (!window.isDestroyed()) {
      window.webContents.send("pty:exit", opts.sessionId, exitCode);
    }
    sessions.delete(opts.sessionId);
  });

  sessions.set(opts.sessionId, session);
}

export function writeToSession(sessionId: string, data: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.process.write(data);
  }
}

export function resizeSession(sessionId: string, cols: number, rows: number): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.process.resize(cols, rows);
  }
}

export function destroySession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    clearInterval(session.pollInterval);
    cleanupSessionDir(sessionId);
    session.process.kill();
    sessions.delete(sessionId);
  }
}

export function destroyAllSessions(): void {
  for (const [id, session] of sessions) {
    clearInterval(session.pollInterval);
    cleanupSessionDir(id);
    session.process.kill();
    sessions.delete(id);
  }
}
