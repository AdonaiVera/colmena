import { app, BrowserWindow } from "electron";
import { join } from "path";

import { registerIpcHandlers } from "./ipc";
import { destroyAllSessions } from "./pty-manager";
import { cleanupOrphanedWorktrees } from "./git-manager";
import { loadTabs } from "./store";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    show: false,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  registerIpcHandlers(mainWindow);

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const tabs = loadTabs();
  await cleanupOrphanedWorktrees(tabs).catch(() => {});
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  destroyAllSessions();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
