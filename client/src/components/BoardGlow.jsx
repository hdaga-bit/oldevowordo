import React, { useEffect, useState, memo } from "react";
import { normalizeTileState, TILE_STATES } from "../config/tile-palette.js";

const TINTS = {
  neutral: "rgba(82, 82, 91, 0.12)",
  yellow: "rgba(201, 180, 88, 0.15)",
  green: "rgba(106, 170, 100, 0.18)",
  win: "rgba(106, 170, 100, 0.22)",
};

function patternTint(pattern) {
  if (!pattern || pattern.length === 0) return TINTS.neutral;
  const normalized = pattern.map(normalizeTileState);
  if (normalized.every((s) => s === TILE_STATES.CORRECT)) return TINTS.win;
  if (normalized.some((s) => s === TILE_STATES.CORRECT)) return TINTS.green;
  if (normalized.some((s) => s === TILE_STATES.PRESENT)) return TINTS.yellow;
  return TINTS.neutral;
}

function hexToRgba(hex, alpha = 0.08) {
  if (!hex || typeof hex !== "string") return `rgba(82, 82, 91, ${alpha})`;
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(82, 82, 91, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function BoardGlow({
  guessFlipKey = 0,
  lastPattern = null,
  glowColor: themeGlow = "#52525b",
  pulseEnabled = false,
  intensity = 0.06,
}) {
  const [pulse, setPulse] = useState(false);
  const patternColor = patternTint(lastPattern);
  const baseTint = hexToRgba(themeGlow, intensity);
  const tint =
    lastPattern &&
      lastPattern.some((s) => normalizeTileState(s) === TILE_STATES.CORRECT)
      ? patternColor
      : baseTint;

  useEffect(() => {
    if (guessFlipKey <= 0 || !pulseEnabled) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(id);
  }, [guessFlipKey, pulseEnabled]);

  if (!pulseEnabled && intensity <= 0) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: "-20%",
        zIndex: -1,
        pointerEvents: "none",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${tint} 0%, transparent 70%)`,
        opacity: pulse && pulseEnabled ? 0.22 : 0.12,
        transform: pulse && pulseEnabled ? "scale(1.05)" : "scale(1)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        willChange: "transform, opacity",
      }}
    />
  );
}

export default memo(BoardGlow);
