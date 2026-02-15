import { contextBridge, ipcRenderer } from "electron";
import type { PtyCreateOptions, PersistedTab } from "../shared/types";

const api = {
  pty: {
    create: (opts: PtyCreateOptions) => ipcRenderer.send("pty:create", opts),
    write: (sessionId: string, data: string) =>
      ipcRenderer.send("pty:write", sessionId, data),
    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.send("pty:resize", sessionId, cols, rows),
    destroy: (sessionId: string) => ipcRenderer.send("pty:destroy", sessionId),
    onData: (callback: (sessionId: string, data: string) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        sessionId: string,
        data: string
      ) => callback(sessionId, data);
      ipcRenderer.on("pty:data", handler);
      return () => ipcRenderer.removeListener("pty:data", handler);
    },
    onExit: (callback: (sessionId: string, exitCode: number) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        sessionId: string,
        exitCode: number
      ) => callback(sessionId, exitCode);
      ipcRenderer.on("pty:exit", handler);
      return () => ipcRenderer.removeListener("pty:exit", handler);
    },
  },
  store: {
    saveTabs: (tabs: PersistedTab[]) =>
      ipcRenderer.send("store:saveTabs", tabs),
    loadTabs: (): Promise<PersistedTab[]> =>
      ipcRenderer.invoke("store:loadTabs"),
  },
  dialog: {
    openFolder: (): Promise<string | null> =>
      ipcRenderer.invoke("dialog:openFolder"),
  },
};

export type ColmenaApi = typeof api;

contextBridge.exposeInMainWorld("colmena", api);
