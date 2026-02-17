# Contributing to Colmena

Thanks for your interest in contributing. This guide covers everything you need to get started.

All contributions (code, bugs, docs, ideas) are welcome. By contributing, you agree that your work falls under the [Apache 2.0 License](LICENSE).

## Before You Start

- **Search first.** Check existing issues and PRs to avoid duplicates.
- **Open an issue before large changes.** Discuss your approach before writing significant code. Small fixes and typos can go straight to a PR.

## Reporting Bugs

Open an issue with:

- Colmena version and OS (macOS, Windows, Linux)
- Steps to reproduce
- Expected vs actual behavior
- Terminal output or screenshots if relevant

## Setup

### Prerequisites

- Node.js 20+
- npm
- Python 3 (required by node-pty native build)
- Git

### Getting Started

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/AdonaiVera/colmena.git
cd colmena
npm install
npm run dev
```

The `postinstall` script rebuilds `node-pty` for Electron automatically. If you see native module errors, run:

```bash
npx electron-builder install-app-deps
```

## Project Structure

```
src/
  main/           # Electron main process
    index.ts      # Window creation, app lifecycle
    ipc.ts        # IPC handler registration
    pty-manager.ts# node-pty session management
    store.ts      # electron-store persistence
    hooks-config.ts # Claude Code hooks injection
  preload/        # Context bridge (main <-> renderer)
    index.ts      # Exposes safe IPC API to renderer
  renderer/       # React UI
    components/   # React components
    components/ui/# shadcn/ui primitives
    hooks/        # Custom React hooks
    lib/          # Utilities and config
    styles/       # CSS (Tailwind + globals)
  shared/         # Types used by both main and renderer
    types.ts
```

## Code Style

### Formatting

Code is formatted with [Prettier](https://prettier.io/). Run before committing:

```bash
npm run format        # auto-fix
npm run format:check  # CI-friendly check
```

### General

- **TypeScript** everywhere. No `any` unless absolutely necessary.
- **Max 200 lines per file.** Split into smaller modules when a file grows beyond this.
- **No default exports.** Use named exports only.
- **No inline comments.** Code should be self-explanatory. No `//` comments between lines of code.
- **Imports** grouped: external packages first, blank line, then internal modules.

### Styling

- Use **inline styles** for spacing (padding, margin, gap).
- Use **Tailwind classes** for layout and utility styles.
- Use **CSS variables** (defined in `globals.css`) for colors: `var(--bg)`, `var(--accent)`, `var(--text-muted)`, etc.
- Do not hardcode colors outside of `globals.css` and `config.ts`. Exception: xterm.js theme in `config.ts` and SVG logo in `ColmenaLogo.tsx`.
- **Dark theme only.** Amber `#f59e0b` accent on near-black `#0a0a0a` background.

### Components

- Prefer **shadcn/ui** components (`src/renderer/components/ui/`) over custom ones.
- Add new shadcn components with `npx shadcn@latest add <component>`.
- Keep component props explicit with TypeScript interfaces.

### React Patterns

- Use `useRef` for values needed inside closures that should not trigger re-renders.
- Use `useCallback` for functions passed as props or in dependency arrays.
- Avoid `useEffect` for derived state. Compute it during render.

### xterm.js Terminals

- **Never use `display: none`** to hide terminals. Use `visibility: hidden` + `position: absolute` + `inset: 0`. xterm needs a full-size container to calculate dimensions correctly.
- Defer `fit()` calls to `requestAnimationFrame` when container layout may not be final.
- Use `FitAddon` for all resize operations. Never set terminal dimensions manually.

### Electron IPC

- All IPC channels are defined in `src/shared/types.ts` (`IpcChannels`).
- Renderer talks to main **only** through the `window.colmena` API (preload script).
- Never use `ipcRenderer` directly in renderer code.

## Making Changes

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make your changes.** Follow the code style above.

3. **Test manually** with `npm run dev`:
   - Open/close tabs
   - Try all modes (new, continue, resume)
   - Resize the window
   - Switch between tabs

4. **Format** and **build**:

   ```bash
   npm run format
   npm run build
   ```

5. **Commit** with a clear message (see format below).

6. **Push and open a PR** against `main`. Link the related issue if there is one.

## Commit Messages

Format: `<type>: <description>`

| Type       | Use for                                |
| ---------- | -------------------------------------- |
| `feat`     | New feature                            |
| `fix`      | Bug fix                                |
| `refactor` | Code change with no new feature or fix |
| `style`    | Formatting, spacing, no logic change   |
| `docs`     | Documentation only                     |
| `chore`    | Build, config, dependencies            |

Examples:

```
feat: add session restart on process exit
fix: prevent restart loop on rapid exit
refactor: extract terminal theme to config
```

## Pull Requests

- Keep PRs focused. One feature or fix per PR.
- Fill in a short description of what changed and why.
- Reference the issue number (e.g. `Fixes #12`) if applicable.
- Make sure `npm run build` passes before submitting.
- A maintainer will review and may request changes. Respond in the same PR.

## Key Gotchas

- **electron-store v11 is ESM-only.** Must be bundled (not externalized) in the main process. See `externalizeDeps.exclude` in `electron.vite.config.ts`.
- **node-pty** must be rebuilt for Electron's Node version after every `npm install`. The `postinstall` script handles this.
- **Radix Select descriptions:** Put text outside `SelectPrimitive.ItemText`. Content inside leaks into the trigger button.
- **Window flash prevention:** BrowserWindow uses `show: false` + `ready-to-show`. `index.html` has inline dark backgrounds. App never returns `null`.

## Questions?

Open an issue. Keep it short and include steps to reproduce if reporting a bug.
