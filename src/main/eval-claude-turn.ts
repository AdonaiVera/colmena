import { spawn, type ChildProcess } from "child_process";
import type { BrowserWindow } from "electron";

import { getLoginShellPath } from "./pty-manager";
import type { ToolInvocation } from "../shared/eval-types";

const TURN_TIMEOUT_MS = 600_000;
const THROTTLE_MS = 1000;
const MAX_TRANSCRIPT_CHARS = 50_000;

export interface TurnResult {
  resultText: string;
  sessionId: string;
  isError: boolean;
  costUsd: number;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;
  toolCalls: ToolInvocation[];
  stderr: string;
}

export interface LiveTranscript {
  lines: string[];
  totalChars: number;
}

export function appendLine(lt: LiveTranscript, line: string): void {
  if (!line.trim()) return;
  const trimmed = line.length > 500 ? line.slice(0, 500) + "..." : line;
  lt.lines.push(trimmed);
  lt.totalChars += trimmed.length;
  while (lt.totalChars > MAX_TRANSCRIPT_CHARS && lt.lines.length > 20) {
    const removed = lt.lines.shift()!;
    lt.totalChars -= removed.length;
  }
}

export function getText(lt: LiveTranscript): string {
  return lt.lines.join("\n");
}

function send(win: BrowserWindow, ch: string, ...args: unknown[]) {
  if (!win.isDestroyed()) win.webContents.send(ch, ...args);
}

function processMessage(msg: Record<string, unknown>, toolCalls: ToolInvocation[], lt: LiveTranscript): void {
  if (msg.type === "result") return;

  if (msg.type === "assistant") {
    const content = (msg.content || (msg.message as Record<string, unknown>)?.content) as unknown[];
    if (Array.isArray(content)) {
      for (const block of content) {
        const b = block as Record<string, unknown>;
        if (b?.type === "text" && typeof b.text === "string" && b.text.trim()) {
          appendLine(lt, b.text.trim());
        }
        if (b?.type === "tool_use" && typeof b.name === "string") {
          const inp = b.input ? JSON.stringify(b.input).slice(0, 200) : "";
          appendLine(lt, `🔧 ${b.name}(${inp})`);
          toolCalls.push({ toolName: b.name, timestamp: Date.now(), input: inp, output: "", success: true });
        }
        if (b?.type === "tool_result") {
          const text = typeof b.content === "string" ? b.content : JSON.stringify(b.content || "");
          appendLine(lt, `📄 ${text.slice(0, 300)}`);
          if (toolCalls.length > 0) toolCalls[toolCalls.length - 1].output = text.slice(0, 500);
        }
      }
    }
  }

  if (msg.type === "user") {
    const content = msg.content as unknown[];
    if (Array.isArray(content)) {
      for (const block of content) {
        const b = block as Record<string, unknown>;
        if (b?.type === "tool_result") {
          const text = typeof b.content === "string" ? b.content : JSON.stringify(b.content || "");
          appendLine(lt, `📄 ${text.slice(0, 300)}`);
          if (toolCalls.length > 0) toolCalls[toolCalls.length - 1].output = text.slice(0, 500);
        }
      }
    }
  }

  if (msg.content_block) {
    const cb = msg.content_block as Record<string, unknown>;
    if (cb.type === "text" && typeof cb.text === "string" && cb.text.trim()) appendLine(lt, cb.text.trim());
    if (cb.type === "tool_use" && typeof cb.name === "string") {
      const inp = cb.input ? JSON.stringify(cb.input).slice(0, 200) : "";
      appendLine(lt, `🔧 ${cb.name}(${inp})`);
      toolCalls.push({ toolName: cb.name, timestamp: Date.now(), input: inp, output: "", success: true });
    }
  }

  if (typeof msg.tool_name === "string") {
    appendLine(lt, `🔧 ${msg.tool_name}`);
    toolCalls.push({ toolName: msg.tool_name, timestamp: Date.now(), input: "", output: "", success: true });
  }
}

export function runClaudeTurn(
  cmd: string, input: string, cwd: string,
  win: BrowserWindow, runId: string, lt: LiveTranscript,
  activeProcesses: ChildProcess[],
): Promise<TurnResult> {
  return new Promise((resolve) => {
    const env = { ...process.env, PATH: getLoginShellPath() };
    delete env.CLAUDECODE;
    const child = spawn(cmd, [], { env, stdio: ["pipe", "pipe", "pipe"], shell: true, cwd });
    activeProcesses.push(child);

    let buffer = "";
    let stderr = "";
    const messages: Record<string, unknown>[] = [];
    const toolCalls: ToolInvocation[] = [];
    let lastSend = 0;

    function throttledSend() {
      const now = Date.now();
      if (now - lastSend > THROTTLE_MS) {
        lastSend = now;
        send(win, "eval:execution:runStatus", runId, "running", getText(lt));
      }
    }

    child.stdout?.on("data", (c: Buffer) => {
      buffer += c.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as Record<string, unknown>;
          messages.push(msg);
          processMessage(msg, toolCalls, lt);
          throttledSend();
        } catch {}
      }
    });
    child.stderr?.on("data", (c: Buffer) => { stderr += c.toString(); });

    function cleanup() { activeProcesses.splice(activeProcesses.indexOf(child), 1); }

    function buildResult(): TurnResult {
      const resultMsg = messages.find((m) => m.type === "result");
      const u = (resultMsg?.usage || {}) as Record<string, number>;
      return {
        resultText: (resultMsg?.result as string) || "",
        sessionId: (resultMsg?.session_id as string) || (messages.find((m) => m.session_id)?.session_id as string) || "",
        isError: (resultMsg?.is_error as boolean) || false,
        costUsd: (resultMsg?.cost_usd as number) || (resultMsg?.total_cost_usd as number) || 0,
        durationMs: (resultMsg?.duration_ms as number) || 0,
        inputTokens: u.input_tokens || 0,
        outputTokens: u.output_tokens || 0,
        cacheRead: u.cache_read_input_tokens || 0,
        cacheWrite: u.cache_creation_input_tokens || 0,
        toolCalls,
        stderr,
      };
    }

    const empty: TurnResult = {
      resultText: "", sessionId: "", isError: true, costUsd: 0, durationMs: 0,
      inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0, toolCalls: [], stderr: "",
    };

    const timeout = setTimeout(() => {
      child.kill(); cleanup();
      resolve({ ...empty, toolCalls, stderr: stderr || "Turn timeout (10 min)" });
    }, TURN_TIMEOUT_MS);

    child.on("close", () => {
      clearTimeout(timeout); cleanup();
      send(win, "eval:execution:runStatus", runId, "running", getText(lt));
      resolve(buildResult());
    });
    child.on("error", (err) => {
      clearTimeout(timeout); cleanup();
      resolve({ ...empty, stderr: err.message });
    });

    child.stdin?.write(input);
    child.stdin?.end();
  });
}
