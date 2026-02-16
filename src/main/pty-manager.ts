import * as pty from "node-pty";
import { BrowserWindow } from "electron";
import os from "os";
import { execFileSync } from "child_process";

import type { PtyCreateOptions } from "../shared/types";

interface PtySession {
  process: pty.IPty;
  sessionId: string;
}

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

export function createSession(window: BrowserWindow, opts: PtyCreateOptions): void {
  if (sessions.has(opts.sessionId)) return;

  const shell = getDefaultShell();
  const cwd = opts.workingDir || os.homedir();

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

  ptyProcess.onData((data) => {
    if (!window.isDestroyed()) {
      window.webContents.send("pty:data", opts.sessionId, data);
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (!window.isDestroyed()) {
      window.webContents.send("pty:exit", opts.sessionId, exitCode);
    }
    sessions.delete(opts.sessionId);
  });

  sessions.set(opts.sessionId, {
    process: ptyProcess,
    sessionId: opts.sessionId,
  });
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
    session.process.kill();
    sessions.delete(sessionId);
  }
}

export function destroyAllSessions(): void {
  for (const [id, session] of sessions) {
    session.process.kill();
    sessions.delete(id);
  }
}
