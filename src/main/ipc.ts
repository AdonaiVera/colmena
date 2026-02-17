import { ipcMain, dialog, type BrowserWindow } from "electron";

import { createSession, writeToSession, resizeSession, destroySession } from "./pty-manager";
import { saveTabs, loadTabs, getSoundEnabled, setSoundEnabled } from "./store";
import { setupWorktree, cleanupWorktree, getCurrentBranch, getGitInfo } from "./git-manager";
import { getDiffFiles, revertFile, revertHunk, writeFileContent } from "./git-diff";
import type { PtyCreateOptions, PersistedTab } from "../shared/types";

export function registerIpcHandlers(window: BrowserWindow): void {
  ipcMain.on("pty:create", (_event, opts: PtyCreateOptions) => {
    createSession(window, opts);
  });

  ipcMain.on("pty:write", (_event, sessionId: string, data: string) => {
    writeToSession(sessionId, data);
  });

  ipcMain.on("pty:resize", (_event, sessionId: string, cols: number, rows: number) => {
    resizeSession(sessionId, cols, rows);
  });

  ipcMain.on("pty:destroy", (_event, sessionId: string) => {
    destroySession(sessionId);
  });

  ipcMain.on("store:saveTabs", (_event, tabs: PersistedTab[]) => {
    saveTabs(tabs);
  });

  ipcMain.handle("store:loadTabs", () => {
    return loadTabs();
  });

  ipcMain.handle("settings:getSoundEnabled", () => {
    return getSoundEnabled();
  });

  ipcMain.on("settings:setSoundEnabled", (_event, enabled: boolean) => {
    setSoundEnabled(enabled);
  });

  ipcMain.handle("dialog:openFolder", async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
      title: "Select Working Directory",
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("git:setup", async (_event, sessionId: string, workingDir: string) => {
    return setupWorktree(sessionId, workingDir);
  });

  ipcMain.handle(
    "git:cleanup",
    async (
      _event,
      _sessionId: string,
      repoRoot: string,
      worktreePath: string,
      branchName: string,
    ) => {
      await cleanupWorktree(repoRoot, worktreePath, branchName);
    },
  );

  ipcMain.handle("git:getInfo", async (_event, workingDir: string) => {
    return getGitInfo(workingDir);
  });

  ipcMain.handle("git:getBranch", async (_event, workingDir: string) => {
    return getCurrentBranch(workingDir);
  });

  ipcMain.handle("git:getDiff", async (_event, worktreePath: string, baseBranch: string) => {
    return getDiffFiles(worktreePath, baseBranch);
  });

  ipcMain.handle(
    "git:revertFile",
    async (_event, worktreePath: string, filePath: string, baseBranch: string) => {
      return revertFile(worktreePath, filePath, baseBranch);
    },
  );

  ipcMain.handle(
    "git:revertHunk",
    async (
      _event,
      worktreePath: string,
      filePath: string,
      hunkIndex: number,
      baseBranch: string,
    ) => {
      return revertHunk(worktreePath, filePath, hunkIndex, baseBranch);
    },
  );

  ipcMain.handle(
    "git:writeFile",
    async (_event, worktreePath: string, filePath: string, content: string) => {
      return writeFileContent(worktreePath, filePath, content);
    },
  );
}
