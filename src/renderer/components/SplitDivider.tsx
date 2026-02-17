import { useCallback, useRef, useState } from "react";

interface SplitDividerProps {
  onDrag: (deltaY: number) => void;
}

export function SplitDivider({ onDrag }: SplitDividerProps) {
  const [dragging, setDragging] = useState(false);
  const lastY = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      lastY.current = e.clientY;
      setDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - lastY.current;
        lastY.current = moveEvent.clientY;
        onDrag(delta);
      };

      const handleMouseUp = () => {
        setDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [onDrag],
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        height: 4,
        cursor: "row-resize",
        backgroundColor: dragging ? "var(--accent)" : "var(--border)",
        transition: dragging ? "none" : "var(--transition)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!dragging) e.currentTarget.style.backgroundColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        if (!dragging) e.currentTarget.style.backgroundColor = "var(--border)";
      }}
    />
  );
}
