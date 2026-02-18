import { spawn, execFile, type ChildProcess } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import os from "os";
import type { BrowserWindow } from "electron";

import { getLoginShellPath } from "./pty-manager";

const MAX_CONVERSATION_CHARS = 80_000;
const MAX_DIFF_CHARS = 20_000;

let activeProcess: ChildProcess | null = null;

function encodeCwd(cwd: string): string {
  return cwd.replaceAll("/", "-").replaceAll(".", "-");
}

function findLatestJsonl(cwd: string): string | null {
  const encoded = encodeCwd(cwd);
  const projectDir = join(os.homedir(), ".claude", "projects", encoded);
  try {
    const entries = readdirSync(projectDir).filter((f) => f.endsWith(".jsonl"));
    if (entries.length === 0) return null;

    let latest = "";
    let latestMtime = 0;
    for (const entry of entries) {
      const fullPath = join(projectDir, entry);
      const mtime = statSync(fullPath).mtimeMs;
      if (mtime > latestMtime) {
        latestMtime = mtime;
        latest = fullPath;
      }
    }
    return latest;
  } catch {
    return null;
  }
}

function parseConversation(jsonlPath: string): string {
  const content = readFileSync(jsonlPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const parts: string[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === "user" || obj.type === "human") {
        const text = extractText(obj.message);
        if (text) parts.push(`Human: ${text}`);
      } else if (obj.type === "assistant") {
        const text = extractText(obj.message);
        if (text) parts.push(`Assistant: ${text}`);
      }
    } catch {
      continue;
    }
  }

  const result = parts.join("\n\n");
  if (result.length > MAX_CONVERSATION_CHARS) {
    return result.slice(0, MAX_CONVERSATION_CHARS) + "\n\n[...truncated]";
  }
  return result;
}

function extractText(message: unknown): string {
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message
      .filter((block: Record<string, unknown>) => block.type === "text")
      .map((block: Record<string, unknown>) => block.text as string)
      .join("\n");
  }
  if (message && typeof message === "object" && "content" in message) {
    return extractText((message as Record<string, unknown>).content);
  }
  return "";
}

function getGitDiffText(cwd: string, baseBranch?: string): Promise<string> {
  if (!baseBranch) return Promise.resolve("");
  return new Promise((resolve) => {
    execFile(
      "git",
      ["diff", baseBranch, "--stat", "--patch"],
      { cwd, maxBuffer: 1024 * 1024, timeout: 10000 },
      (err, stdout) => {
        if (err) {
          resolve("");
          return;
        }
        const text = stdout.trim();
        if (text.length > MAX_DIFF_CHARS) {
          resolve(text.slice(0, MAX_DIFF_CHARS) + "\n\n[...truncated]");
          return;
        }
        resolve(text);
      },
    );
  });
}

function buildEvaluationPrompt(conversation: string, diff: string, cwd: string): string {
  const sections = [
    `You are an expert code reviewer evaluating a Claude Code session.`,
    `Working directory: ${cwd}`,
    `\n## Conversation Transcript\n\n${conversation}`,
  ];

  if (diff) {
    sections.push(`\n## Git Diff\n\n\`\`\`diff\n${diff}\n\`\`\``);
  }

  sections.push(
    `\n## Evaluation Criteria\n\nPlease evaluate this session on:\n` +
      `1. **Task Completion** - Did the agent accomplish what was asked?\n` +
      `2. **Code Quality** - Is the code clean, correct, and well-structured?\n` +
      `3. **Conversation Efficiency** - Was the approach direct and focused?\n` +
      `4. **Decision Making** - Were the right tools, patterns, and approaches used?\n` +
      `5. **Overall Score** (1-10) - With brief justification.\n\n` +
      `Be concise but thorough. Use markdown formatting.`,
  );

  return sections.join("\n");
}

export async function startEvaluation(
  window: BrowserWindow,
  sessionCwd: string,
  baseBranch?: string,
): Promise<{ error?: string }> {
  abortEvaluation();

  const jsonlPath = findLatestJsonl(sessionCwd);
  if (!jsonlPath) {
    return { error: "No conversation found. Start a Claude session first." };
  }

  const conversation = parseConversation(jsonlPath);
  if (!conversation) {
    return { error: "Conversation is empty." };
  }

  const diff = await getGitDiffText(sessionCwd, baseBranch);
  const prompt = buildEvaluationPrompt(conversation, diff, sessionCwd);

  const shellPath = getLoginShellPath();
  const env = { ...process.env, PATH: shellPath };

  const child = spawn("claude", ["-p", "--output-format", "text"], {
    env,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  activeProcess = child;

  child.stdin?.write(prompt);
  child.stdin?.end();

  child.stdout?.on("data", (chunk: Buffer) => {
    if (!window.isDestroyed()) {
      window.webContents.send("evaluator:data", chunk.toString());
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    if (!window.isDestroyed()) {
      window.webContents.send("evaluator:data", chunk.toString());
    }
  });

  child.on("close", (code) => {
    activeProcess = null;
    if (!window.isDestroyed()) {
      window.webContents.send(
        "evaluator:done",
        code === 0 ? null : `Process exited with code ${code}`,
      );
    }
  });

  child.on("error", (err) => {
    activeProcess = null;
    if (!window.isDestroyed()) {
      window.webContents.send("evaluator:done", err.message);
    }
  });

  return {};
}

export function abortEvaluation(): void {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
  }
}
