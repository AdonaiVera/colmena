import { ipcMain, dialog, type BrowserWindow } from "electron";
import {
  createSession,
  writeToSession,
  resizeSession,
  destroySession,
} from "./pty-manager";
import { saveTabs, loadTabs } from "./store";
import type { PtyCreateOptions, PersistedTab } from "../shared/types";

export function registerIpcHandlers(window: BrowserWindow): void {
  ipcMain.on("pty:create", (_event, opts: PtyCreateOptions) => {
    createSession(window, opts);
  });

  ipcMain.on("pty:write", (_event, sessionId: string, data: string) => {
    writeToSession(sessionId, data);
  });

  ipcMain.on(
    "pty:resize",
    (_event, sessionId: string, cols: number, rows: number) => {
      resizeSession(sessionId, cols, rows);
    }
  );

  ipcMain.on("pty:destroy", (_event, sessionId: string) => {
    destroySession(sessionId);
  });

  ipcMain.on("store:saveTabs", (_event, tabs: PersistedTab[]) => {
    saveTabs(tabs);
  });

  ipcMain.handle("store:loadTabs", () => {
    return loadTabs();
  });

  ipcMain.handle("dialog:openFolder", async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
      title: "Select Working Directory",
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
}
