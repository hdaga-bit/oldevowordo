// components/Keyboard.jsx
import React, { useMemo, useState, memo, useRef } from "react";
import { cn } from "../lib/utils";
import {
  FALLBACK_KEY,
  KEY_CSS,
  TILE_STATES,
  swatchFromVars,
} from "../config/tile-palette.js";
import { playTypingSound } from "../utils/sounds";

function Keyboard({
  onKeyPress,
  letterStates = {}, // { A: 'correct' | 'present' | 'absent' }
  sticky = false,
  disabled = false,
  className,
  /** Ref to a themed ancestor (e.g. GameLayout footer scope) for --key-* / --tile-* vars */
  varsRootRef = null,
}) {
  const localVarsRef = useRef(null);
  const varsRoot = varsRootRef || localVarsRef;
  const rows = useMemo(
    () => [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
    ],
    []
  );

  const press = (k) => {
    if (disabled || !onKeyPress) return;
    if (k !== "ENTER" && k !== "BACKSPACE") {
      playTypingSound();
    }
    onKeyPress(k);
  };

  const Key = ({ label }) => {
    const state = letterStates[label] || "idle";
    const isAction = label === "ENTER" || label === "BACKSPACE";
    const aria =
      label === "BACKSPACE"
        ? "Backspace"
        : label === "ENTER"
        ? "Enter"
        : `Letter ${label}`;

    const [active, setActive] = useState(false);
    const [pressed, setPressed] = useState(false);

    const idle = swatchFromVars(varsRoot, KEY_CSS.idle, FALLBACK_KEY.idle);

    const swatch =
      state === TILE_STATES.CORRECT
        ? swatchFromVars(varsRoot, KEY_CSS[TILE_STATES.CORRECT], FALLBACK_KEY.correct)
        : state === TILE_STATES.PRESENT
        ? swatchFromVars(varsRoot, KEY_CSS[TILE_STATES.PRESENT], FALLBACK_KEY.present)
        : isAction && label === "ENTER"
        ? swatchFromVars(varsRoot, KEY_CSS[TILE_STATES.CORRECT], FALLBACK_KEY.correct)
        : state === TILE_STATES.ABSENT
        ? swatchFromVars(varsRoot, KEY_CSS[TILE_STATES.ABSENT], FALLBACK_KEY.absent)
        : idle;

    const handlePress = () => {
      if (disabled) return;
      setPressed(true);
      press(label);
      if (navigator.vibrate) navigator.vibrate(40);
      setTimeout(() => setPressed(false), 120);
    };

    return (
      <button
        type="button"
        aria-label={aria}
        aria-pressed={active ? "true" : "false"}
        aria-disabled={disabled ? "true" : "false"}
        disabled={disabled}
        data-state={state}
        onPointerDown={() => {
          if (disabled) return;
          setActive(true);
          handlePress();
        }}
        onPointerUp={() => setActive(false)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" && label === "ENTER") handlePress();
          if (e.key === "Backspace" && label === "BACKSPACE") handlePress();
        }}
        className={cn(
          "select-none rounded-md px-1.5 py-2 font-medium md:px-1.5 md:py-1.5",
          "leading-none uppercase tracking-wide",
          "transition-colors duration-150 ease-out",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500/60",
          isAction
            ? "basis-[16%] text-[10px] md:basis-[9%] md:text-[11px]"
            : "basis-[8%] text-xs md:basis-[6.5%] md:text-sm",
          "min-h-[42px] touch-manipulation md:min-h-[34px]",
          disabled && "opacity-35 cursor-not-allowed grayscale"
        )}
        style={{
          background: swatch.bg,
          color: swatch.fg,
          border: `1px solid ${swatch.border}`,
          transform: pressed ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.1s ease, background-color 0.15s ease",
          boxShadow:
            state === TILE_STATES.CORRECT
              ? "0 1px 4px rgba(90, 158, 86, 0.28)"
              : state === TILE_STATES.PRESENT
              ? "0 1px 4px rgba(184, 160, 74, 0.22)"
              : "none",
        }}
      >
        {label === "BACKSPACE" ? "DEL" : label}
      </button>
    );
  };

  return (
    <div
      ref={varsRootRef ? undefined : localVarsRef}
      className={cn(
        sticky ? "fixed md:static bottom-0 left-0 right-0 z-30 md:z-auto" : "",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-7xl",
          sticky
            ? "md:bg-transparent border-t md:border-0 border-neutral-200/80 dark:border-neutral-800/30"
            : ""
        )}
      >
        <div className="px-1 pt-0.5 pb-1.5 md:px-1 md:pb-1" role="group" aria-label="Game keyboard">
          <div className="flex flex-col gap-1 md:gap-0.5 items-center justify-center opacity-95">
            {rows.map((row, idx) => (
              <div
                key={idx}
                role="group"
                aria-label={`Keyboard row ${idx + 1}`}
                className={cn(
                  "w-full flex items-center justify-center gap-1 md:gap-0.5",
                  idx === 1 && "px-1.5 md:px-2",
                  idx === 2 && "px-0"
                )}
              >
                {row.map((k) => (
                  <Key key={k} label={k} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Keyboard, (prevProps, nextProps) => {
  return (
    prevProps.onKeyPress === nextProps.onKeyPress &&
    prevProps.letterStates === nextProps.letterStates &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.sticky === nextProps.sticky &&
    prevProps.className === nextProps.className &&
    prevProps.varsRootRef === nextProps.varsRootRef
  );
});
