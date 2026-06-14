import React from "react";
import { cn } from "../../lib/utils";

/**
 * Viewport-locked game canvas: header + flex middle + docked footer.
 * Parent must provide h-full / flex-1 min-h-0.
 */
export default function GameShell({
  header,
  children,
  footer,
  className,
  footerClassName,
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden",
        className,
      )}
    >
      {header ? (
        <header className="w-full shrink-0">{header}</header>
      ) : null}

      <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>

      {footer ? (
        <footer
          className={cn(
            "w-full shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]",
            footerClassName,
          )}
        >
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
