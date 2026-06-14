import React from "react";
import { cn } from "../../lib/utils";

/**
 * Flexible middle gameplay zone between header and keyboard.
 * fillMode="fit" — fills viewport, centers board content, passes height to Board autoFit.
 * fillMode="scroll" — scrollable zone; content aligns to top (lobbies, results).
 */
export default function GameBoardZone({
  children,
  className,
  fillMode = "fit",
  maxWidth,
}) {
  const maxWidthStyle =
    typeof maxWidth === "number"
      ? { maxWidth: `${maxWidth}px` }
      : maxWidth
      ? { maxWidth }
      : undefined;

  const isScroll = fillMode === "scroll";

  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col",
        isScroll ? "overflow-y-auto" : "overflow-hidden",
        isScroll ? "justify-start" : "justify-center",
        "mx-auto",
        className,
      )}
      style={maxWidthStyle}
      aria-label="Game board"
    >
      <div
        className={cn(
          "flex w-full max-w-full flex-col",
          isScroll
            ? "min-h-0 flex-1 justify-start"
            : "h-full min-h-0 items-center justify-center",
        )}
      >
        {children}
      </div>
    </section>
  );
}
