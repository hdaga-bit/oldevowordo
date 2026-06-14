import React from "react";
import { cn } from "../lib/utils";

export default function GamePhaseIndicator({ steps, currentStep, className = "" }) {
  if (!steps?.length) return null;

  return (
    <nav
      aria-label="Game progress"
      className={cn("flex flex-wrap items-center justify-center gap-2 text-xs", className)}
    >
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const active = stepNum === currentStep;
        const done = stepNum < currentStep;
        return (
          <span
            key={label}
            className={cn(
              "rounded-full px-2.5 py-1 border transition-colors",
              active && "border-violet-400 bg-zinc-800 text-white font-medium",
              done && "border-white/20 text-white/50",
              !active && !done && "border-white/10 text-white/40",
            )}
            aria-current={active ? "step" : undefined}
          >
            {stepNum}. {label}
          </span>
        );
      })}
    </nav>
  );
}
