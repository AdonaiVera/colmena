import { spawn } from "child_process";
import os from "os";

import { getLoginShellPath } from "./pty-manager";

function spawnClaude(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const env = { ...process.env, PATH: getLoginShellPath() };
    delete env.CLAUDECODE;
    const child = spawn("claude", ["-p", "--output-format", "text"], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: os.homedir(),
    });
    let out = "";
    child.stdout?.on("data", (c: Buffer) => { out += c.toString(); });
    child.stderr?.on("data", () => {});
    child.on("close", () => resolve(out.trim()));
    child.on("error", () => resolve("[DONE]"));
    const timeout = setTimeout(() => { child.kill(); resolve("[DONE]"); }, 60000);
    child.on("exit", () => clearTimeout(timeout));
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

export async function askPersona(
  task: string,
  expected: string,
  claudeOutput: string,
): Promise<string> {
  const prompt =
    `You simulate a user in an automated eval. ` +
    `The user's original task: ${task}\n` +
    `Expected behavior: ${expected}\n\n` +
    `The AI assistant just said:\n---\n${claudeOutput.slice(-2000)}\n---\n\n` +
    `Reply as the user would — be concise, answer questions, provide requested info.\n` +
    `If the task is fully complete and no further interaction is needed, reply exactly: [DONE]\n` +
    `Return ONLY the user's reply text, nothing else.`;
  return spawnClaude(prompt);
}
