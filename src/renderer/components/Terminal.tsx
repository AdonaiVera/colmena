import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { Terminal as XTerm } from "@xterm/xterm";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePty } from "../hooks/usePty";
import { SearchBar } from "./SearchBar";
import {
  TERMINAL_FONT_FAMILY,
  TERMINAL_FONT_SIZE,
  TERMINAL_LINE_HEIGHT,
  TERMINAL_THEME,
} from "../lib/config";

function safeFit(addon: FitAddon | null) {
  try { addon?.fit(); } catch {}
}

export interface TerminalProps {
  sessionId: string;
  workingDir: string;
  command?: string;
  isActive: boolean;
  onStatusChange?: (status: "running" | "exited") => void;
}

export function Terminal({
  sessionId,
  workingDir,
  command,
  isActive,
  onStatusChange,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const exitedRef = useRef(false);
  const spawnTimeRef = useRef(0);
  const commandRef = useRef(command);
  const [showSearch, setShowSearch] = useState(false);
  const [ready, setReady] = useState(false);

  const handleData = useCallback((data: string) => {
    terminalRef.current?.write(data);
  }, []);

  const { spawn, write, resize } = usePty({
    sessionId,
    onData: handleData,
    onExit: () => {
      const rapidExit = Date.now() - spawnTimeRef.current < 3000;
      const cmd = commandRef.current || "";
      const hasModeFlag = /--continue|--resume/.test(cmd);

      if (rapidExit && hasModeFlag) {
        const fallback = cmd.replace(/\s*--(continue|resume)/g, "").trim();
        commandRef.current = fallback;
        terminalRef.current?.writeln(
          "\r\n\x1b[90m[No previous session — starting new]\x1b[0m\r\n"
        );
        const term = terminalRef.current;
        if (term && fitAddonRef.current) {
          safeFit(fitAddonRef.current);
          spawnTimeRef.current = Date.now();
          spawn(term.cols, term.rows, workingDir || undefined, fallback || undefined);
          onStatusChange?.("running");
        }
        return;
      }

      exitedRef.current = true;
      terminalRef.current?.writeln(
        rapidExit
          ? "\r\n\x1b[90m[Process failed to start]\x1b[0m"
          : "\r\n\x1b[90m[Process exited — press any key to restart]\x1b[0m"
      );
      onStatusChange?.("exited");
    },
  });

  useEffect(() => {
    if (!isActive) return;
    terminalRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const terminal = new XTerm({
      allowProposedApi: true,
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily: TERMINAL_FONT_FAMILY,
      fontSize: TERMINAL_FONT_SIZE,
      lineHeight: TERMINAL_LINE_HEIGHT,
      theme: TERMINAL_THEME,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const unicode11 = new Unicode11Addon();
    [fitAddon, searchAddon, new WebLinksAddon(), unicode11].forEach((a) =>
      terminal.loadAddon(a)
    );
    terminal.unicode.activeVersion = "11";
    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    requestAnimationFrame(() => {
      safeFit(fitAddon);
      const { cols, rows } = terminal;
      spawnTimeRef.current = Date.now();
      spawn(cols, rows, workingDir || undefined, command || undefined);
      onStatusChange?.("running");
      setReady(true);
    });

    terminal.onData((data) => {
      if (exitedRef.current) {
        exitedRef.current = false;
        terminal.writeln("\r\n\x1b[90m[Restarting session...]\x1b[0m\r\n");
        safeFit(fitAddon);
        const { cols, rows } = terminal;
        spawnTimeRef.current = Date.now();
        spawn(cols, rows, workingDir || undefined, commandRef.current || undefined);
        onStatusChange?.("running");
        return;
      }
      write(data);
    });

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => safeFit(fitAddon), 50);
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    terminal.onResize(({ cols, rows }) => resize(cols, rows));

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = fitAddonRef.current = searchAddonRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: isActive ? 1 : 0,
        visibility: isActive ? "visible" : "hidden",
      }}
    >
      {showSearch && (
        <SearchBar
          searchAddon={searchAddonRef.current}
          onClose={() => {
            setShowSearch(false);
            terminalRef.current?.focus();
          }}
        />
      )}
      <div
        ref={containerRef}
        className="terminal-container"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "var(--bg)",
          opacity: ready ? 1 : 0,
        }}
      />
    </div>
  );
}
