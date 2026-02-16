import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

import type { GitSetupResult, PersistedTab } from "../shared/types";

const execFileAsync = promisify(execFile);
const GIT_TIMEOUT = 30_000;
const WORKTREE_DIR = ".colmena-worktrees";

async function git(
  args: string[],
  cwd?: string
): Promise<{ stdout: string; stderr: string }> {
  const opts = { timeout: GIT_TIMEOUT, cwd, maxBuffer: 10 * 1024 * 1024 };
  return execFileAsync("git", args, opts);
}

export async function isGitInstalled(): Promise<boolean> {
  try {
    await git(["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await git(["rev-parse", "--is-inside-work-tree"], dir);
    return true;
  } catch {
    return false;
  }
}

export async function initRepo(dir: string): Promise<void> {
  await git(["init"], dir);
  await git(["add", "-A"], dir);
  await git(["commit", "-m", "Initial commit (Colmena auto-init)", "--allow-empty"], dir);
}

export async function getCurrentBranch(dir: string): Promise<string | null> {
  try {
    const { stdout } = await git(["rev-parse", "--abbrev-ref", "HEAD"], dir);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getRepoRoot(dir: string): Promise<string> {
  const { stdout } = await git(["rev-parse", "--show-toplevel"], dir);
  return stdout.trim();
}

function sanitizeBranchName(name: string, sessionId: string): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const shortId = sessionId.slice(0, 6);
  return `colmena/${clean || "session"}-${shortId}`;
}

async function addToGitExclude(repoRoot: string): Promise<void> {
  const excludePath = path.join(repoRoot, ".git", "info", "exclude");
  try {
    const content = await fs.readFile(excludePath, "utf-8");
    if (content.includes(WORKTREE_DIR)) return;
    await fs.appendFile(excludePath, `\n${WORKTREE_DIR}\n`);
  } catch {
    await fs.mkdir(path.join(repoRoot, ".git", "info"), { recursive: true });
    await fs.writeFile(excludePath, `${WORKTREE_DIR}\n`);
  }
}

export async function setupWorktree(
  sessionId: string,
  workingDir: string
): Promise<GitSetupResult> {
  const empty: GitSetupResult = {
    success: false,
    worktreePath: "",
    branchName: "",
    baseBranch: "",
    repoRoot: "",
  };

  try {
    if (!(await isGitInstalled())) {
      return { ...empty, error: "Git is not installed" };
    }

    if (!(await isGitRepo(workingDir))) {
      await initRepo(workingDir);
    }

    const repoRoot = await getRepoRoot(workingDir);
    const baseBranch = (await getCurrentBranch(workingDir)) || "main";
    const folderName = path.basename(workingDir);
    const branchName = sanitizeBranchName(folderName, sessionId);
    const worktreePath = path.join(repoRoot, WORKTREE_DIR, branchName.replace("/", "-"));

    await fs.mkdir(path.join(repoRoot, WORKTREE_DIR), { recursive: true });
    await git(
      ["worktree", "add", "-b", branchName, worktreePath, baseBranch],
      repoRoot
    );
    await addToGitExclude(repoRoot);

    return { success: true, worktreePath, branchName, baseBranch, repoRoot };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...empty, error: message };
  }
}

export async function cleanupWorktree(
  repoRoot: string,
  worktreePath: string,
  branchName: string
): Promise<void> {
  try {
    await git(["worktree", "remove", worktreePath, "--force"], repoRoot);
  } catch {
    try {
      await fs.rm(worktreePath, { recursive: true, force: true });
      await git(["worktree", "prune"], repoRoot);
    } catch {}
  }

  try {
    await git(["branch", "-D", branchName], repoRoot);
  } catch {}

  try {
    const wtDir = path.join(repoRoot, WORKTREE_DIR);
    const entries = await fs.readdir(wtDir);
    if (entries.length === 0) await fs.rmdir(wtDir);
  } catch {}
}

export async function cleanupOrphanedWorktrees(
  tabs: PersistedTab[]
): Promise<void> {
  const activeWorktrees = new Set(
    tabs.filter((t) => t.worktreePath).map((t) => t.worktreePath!)
  );

  const repoRoots = new Set(
    tabs.filter((t) => t.repoRoot).map((t) => t.repoRoot!)
  );

  for (const repoRoot of repoRoots) {
    const wtDir = path.join(repoRoot, WORKTREE_DIR);
    try {
      const entries = await fs.readdir(wtDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const fullPath = path.join(wtDir, entry.name);
        if (!activeWorktrees.has(fullPath)) {
          try {
            await git(["worktree", "remove", fullPath, "--force"], repoRoot);
          } catch {
            await fs.rm(fullPath, { recursive: true, force: true });
          }
        }
      }
      await git(["worktree", "prune"], repoRoot).catch(() => {});
    } catch {}
  }
}
