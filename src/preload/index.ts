import { contextBridge, ipcRenderer } from "electron";

import type {
  PtyCreateOptions,
  PersistedTab,
  GitSetupResult,
  GitInfoResult,
  GitDiffFile,
} from "../shared/types";

const api = {
  pty: {
    create: (opts: PtyCreateOptions) => ipcRenderer.send("pty:create", opts),
    write: (sessionId: string, data: string) => ipcRenderer.send("pty:write", sessionId, data),
    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.send("pty:resize", sessionId, cols, rows),
    destroy: (sessionId: string) => ipcRenderer.send("pty:destroy", sessionId),
    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, sessionId: string, data: string) =>
        callback(sessionId, data);
      ipcRenderer.on("pty:data", handler);
      return () => ipcRenderer.removeListener("pty:data", handler);
    },
    onExit: (callback: (sessionId: string, exitCode: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, sessionId: string, exitCode: number) =>
        callback(sessionId, exitCode);
      ipcRenderer.on("pty:exit", handler);
      return () => ipcRenderer.removeListener("pty:exit", handler);
    },
  },
  store: {
    saveTabs: (tabs: PersistedTab[]) => ipcRenderer.send("store:saveTabs", tabs),
    loadTabs: (): Promise<PersistedTab[]> => ipcRenderer.invoke("store:loadTabs"),
  },
  dialog: {
    openFolder: (): Promise<string | null> => ipcRenderer.invoke("dialog:openFolder"),
  },
  git: {
    setup: (sessionId: string, workingDir: string): Promise<GitSetupResult> =>
      ipcRenderer.invoke("git:setup", sessionId, workingDir),
    cleanup: (
      sessionId: string,
      repoRoot: string,
      worktreePath: string,
      branchName: string,
    ): Promise<void> =>
      ipcRenderer.invoke("git:cleanup", sessionId, repoRoot, worktreePath, branchName),
    getInfo: (workingDir: string): Promise<GitInfoResult> =>
      ipcRenderer.invoke("git:getInfo", workingDir),
    getBranch: (workingDir: string): Promise<string | null> =>
      ipcRenderer.invoke("git:getBranch", workingDir),
    getDiff: (worktreePath: string, baseBranch: string): Promise<GitDiffFile[]> =>
      ipcRenderer.invoke("git:getDiff", worktreePath, baseBranch),
    revertFile: (worktreePath: string, filePath: string, baseBranch: string): Promise<boolean> =>
      ipcRenderer.invoke("git:revertFile", worktreePath, filePath, baseBranch),
    revertHunk: (
      worktreePath: string,
      filePath: string,
      hunkIndex: number,
      baseBranch: string,
    ): Promise<boolean> =>
      ipcRenderer.invoke("git:revertHunk", worktreePath, filePath, hunkIndex, baseBranch),
    writeFile: (worktreePath: string, filePath: string, content: string): Promise<boolean> =>
      ipcRenderer.invoke("git:writeFile", worktreePath, filePath, content),
  },
};

export type ColmenaApi = typeof api;

contextBridge.exposeInMainWorld("colmena", api);
