import * as pty from "node-pty";
import { BrowserWindow } from "electron";
import os from "os";

import type { PtyCreateOptions } from "../shared/types";

interface PtySession {
  process: pty.IPty;
  sessionId: string;
}

const sessions = new Map<string, PtySession>();

function getDefaultShell(): string {
  if (process.platform === "win32") {
    return process.env.COMSPEC || "powershell.exe";
  }
  return process.env.SHELL || "/bin/zsh";
}

export function createSession(
  window: BrowserWindow,
  opts: PtyCreateOptions
): void {
  if (sessions.has(opts.sessionId)) return;

  const shell = getDefaultShell();
  const cwd = opts.workingDir || os.homedir();

  const env = {
    ...process.env,
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

export function resizeSession(
  sessionId: string,
  cols: number,
  rows: number
): void {
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
