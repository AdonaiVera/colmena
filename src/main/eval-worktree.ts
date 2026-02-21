import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT = 30_000;
const WORKTREE_DIR = ".colmena-worktrees";

interface EvalWorktreeResult {
  success: boolean;
  worktreePath: string;
  repoRoot: string;
  branchName: string;
  error?: string;
}

async function git(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, { timeout: GIT_TIMEOUT, cwd, maxBuffer: 10 * 1024 * 1024 });
}

async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await git(["rev-parse", "--is-inside-work-tree"], dir);
    return true;
  } catch {
    return false;
  }
}

async function getRepoRoot(dir: string): Promise<string> {
  const { stdout } = await git(["rev-parse", "--show-toplevel"], dir);
  return stdout.trim();
}

async function getCurrentBranch(dir: string): Promise<string> {
  const { stdout } = await git(["rev-parse", "--abbrev-ref", "HEAD"], dir);
  return stdout.trim() || "main";
}

export async function setupEvalWorktree(workingDir: string, experimentId: string): Promise<EvalWorktreeResult> {
  const empty: EvalWorktreeResult = { success: false, worktreePath: "", repoRoot: "", branchName: "" };

  try {
    if (!(await isGitRepo(workingDir))) return { ...empty, error: "Not a git repo" };

    const repoRoot = await getRepoRoot(workingDir);
    const baseBranch = await getCurrentBranch(repoRoot);
    const branchName = `colmena/eval-${experimentId.slice(0, 8)}`;
    const safeName = branchName.replace(/\//g, "-");
    const worktreePath = path.join(repoRoot, WORKTREE_DIR, safeName);

    try {
      await fs.access(worktreePath);
      return { success: true, worktreePath, repoRoot, branchName };
    } catch {}

    await fs.mkdir(path.join(repoRoot, WORKTREE_DIR), { recursive: true });
    await git(["worktree", "add", "-b", branchName, worktreePath, baseBranch], repoRoot);

    return { success: true, worktreePath, repoRoot, branchName };
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function cleanupEvalWorktree(workingDir: string, experimentId: string): Promise<void> {
  try {
    if (!(await isGitRepo(workingDir))) return;
    const repoRoot = await getRepoRoot(workingDir);
    const branchName = `colmena/eval-${experimentId.slice(0, 8)}`;
    const safeName = branchName.replace(/\//g, "-");
    const worktreePath = path.join(repoRoot, WORKTREE_DIR, safeName);

    try {
      await git(["worktree", "remove", worktreePath, "--force"], repoRoot);
    } catch {
      await fs.rm(worktreePath, { recursive: true, force: true }).catch(() => {});
      await git(["worktree", "prune"], repoRoot).catch(() => {});
    }

    try {
      await git(["branch", "-D", branchName], repoRoot);
    } catch {}
  } catch {}
}
