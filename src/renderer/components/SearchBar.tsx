import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchAddon } from "@xterm/addon-search";

interface SearchBarProps {
  searchAddon: SearchAddon | null;
  onClose: () => void;
}

export function SearchBar({ searchAddon, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!searchAddon || !query) {
      searchAddon?.clearDecorations();
      return;
    }
    searchAddon.findNext(query, { regex: false, caseSensitive: false });
  }, [query, searchAddon]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        searchAddon?.clearDecorations();
        onClose();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          searchAddon?.findPrevious(query);
        } else {
          searchAddon?.findNext(query);
        }
      }
    },
    [query, searchAddon, onClose],
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 16,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "4px 8px",
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          width: 180,
        }}
      />
      <button
        onClick={() => searchAddon?.findPrevious(query)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: 12,
          padding: "2px 4px",
        }}
        title="Previous (Shift+Enter)"
      >
        &uarr;
      </button>
      <button
        onClick={() => searchAddon?.findNext(query)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: 12,
          padding: "2px 4px",
        }}
        title="Next (Enter)"
      >
        &darr;
      </button>
      <button
        onClick={() => {
          searchAddon?.clearDecorations();
          onClose();
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 12,
          padding: "2px 4px",
        }}
        title="Close (Esc)"
      >
        &times;
      </button>
    </div>
  );
}
