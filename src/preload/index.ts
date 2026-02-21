import { contextBridge, ipcRenderer } from "electron";

import type {
  PtyCreateOptions,
  PersistedTab,
  GitSetupResult,
  GitInfoResult,
  GitDiffFile,
  ActivityState,
} from "../shared/types";
import type {
  Experiment,
  DiscoveredComponent,
  EvalScenario,
  ExecutionRun,
  ExecutionMode,
  EvalReport,
} from "../shared/eval-types";

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
    onActivity: (callback: (sessionId: string, state: ActivityState) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        sessionId: string,
        state: ActivityState,
      ) => callback(sessionId, state);
      ipcRenderer.on("pty:activity", handler);
      return () => ipcRenderer.removeListener("pty:activity", handler);
    },
  },
  store: {
    saveTabs: (tabs: PersistedTab[]) => ipcRenderer.send("store:saveTabs", tabs),
    loadTabs: (): Promise<PersistedTab[]> => ipcRenderer.invoke("store:loadTabs"),
  },
  dialog: {
    openFolder: (): Promise<string | null> => ipcRenderer.invoke("dialog:openFolder"),
  },
  settings: {
    getSoundEnabled: (): Promise<boolean> => ipcRenderer.invoke("settings:getSoundEnabled"),
    setSoundEnabled: (enabled: boolean) => ipcRenderer.send("settings:setSoundEnabled", enabled),
  },
  git: {
    setup: (
      sessionId: string,
      workingDir: string,
      existingBranch?: string,
    ): Promise<GitSetupResult> =>
      ipcRenderer.invoke("git:setup", sessionId, workingDir, existingBranch),
    listBranches: (workingDir: string): Promise<string[]> =>
      ipcRenderer.invoke("git:listBranches", workingDir),
    cleanup: (
      sessionId: string,
      repoRoot: string,
      worktreePath: string,
      branchName: string,
      isExistingBranch?: boolean,
    ): Promise<void> =>
      ipcRenderer.invoke(
        "git:cleanup",
        sessionId,
        repoRoot,
        worktreePath,
        branchName,
        isExistingBranch,
      ),
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
  evaluator: {
    start: (cwd: string, baseBranch?: string): Promise<{ error?: string }> =>
      ipcRenderer.invoke("evaluator:start", cwd, baseBranch),
    abort: () => ipcRenderer.send("evaluator:abort"),
    onData: (callback: (chunk: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
      ipcRenderer.on("evaluator:data", handler);
      return () => ipcRenderer.removeListener("evaluator:data", handler);
    },
    onDone: (callback: (error: string | null) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: string | null) => callback(error);
      ipcRenderer.on("evaluator:done", handler);
      return () => ipcRenderer.removeListener("evaluator:done", handler);
    },
  },
  eval: {
    listExperiments: (): Promise<Experiment[]> =>
      ipcRenderer.invoke("eval:listExperiments"),
    saveExperiment: (experiment: Experiment): Promise<void> =>
      ipcRenderer.invoke("eval:saveExperiment", experiment),
    deleteExperiment: (experimentId: string, workingDir?: string): Promise<void> =>
      ipcRenderer.invoke("eval:deleteExperiment", experimentId, workingDir),
    analysisStart: (workingDir: string): Promise<{ components: DiscoveredComponent[] }> =>
      ipcRenderer.invoke("eval:analysis:start", workingDir),
    generationStart: (
      components: DiscoveredComponent[],
      workingDir: string,
    ): Promise<{ scenarios: EvalScenario[] }> =>
      ipcRenderer.invoke("eval:generation:start", components, workingDir),
    executionStart: (
      scenarios: EvalScenario[],
      workingDir: string,
      experimentId: string,
      mode: ExecutionMode,
    ): Promise<{ runs: ExecutionRun[] }> =>
      ipcRenderer.invoke("eval:execution:start", scenarios, workingDir, experimentId, mode),
    evaluationStart: (
      experimentId: string,
      scenarios: EvalScenario[],
      runs: ExecutionRun[],
      components: DiscoveredComponent[],
    ): Promise<{ report: EvalReport | null }> =>
      ipcRenderer.invoke("eval:evaluation:start", experimentId, scenarios, runs, components),
    abort: () => ipcRenderer.send("eval:abort"),
    openLogsFolder: (experimentId: string): Promise<void> =>
      ipcRenderer.invoke("eval:openLogsFolder", experimentId),
    onGenerationData: (callback: (chunk: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
      ipcRenderer.on("eval:generation:data", handler);
      return () => ipcRenderer.removeListener("eval:generation:data", handler);
    },
    onExecutionRunStarted: (
      callback: (runId: string, scenarioId: string, variant: string) => void,
    ) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        runId: string,
        scenarioId: string,
        variant: string,
      ) => callback(runId, scenarioId, variant);
      ipcRenderer.on("eval:execution:runStarted", handler);
      return () => ipcRenderer.removeListener("eval:execution:runStarted", handler);
    },
    onExecutionRunStatus: (
      callback: (runId: string, status: string, transcript: string) => void,
    ) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        runId: string,
        status: string,
        transcript: string,
      ) => callback(runId, status, transcript);
      ipcRenderer.on("eval:execution:runStatus", handler);
      return () => ipcRenderer.removeListener("eval:execution:runStatus", handler);
    },
    onEvaluationData: (callback: (chunk: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
      ipcRenderer.on("eval:evaluation:data", handler);
      return () => ipcRenderer.removeListener("eval:evaluation:data", handler);
    },
  },
};

export type ColmenaApi = typeof api;

contextBridge.exposeInMainWorld("colmena", api);
