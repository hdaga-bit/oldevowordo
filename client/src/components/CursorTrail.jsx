import { useEffect, useRef, useState } from "react";
import { useSettings } from "../contexts/SettingsContext";

/**
 * Lightweight cursor trail overlay.
 *
 * Renders absolutely-positioned dots that fade out, gated by `prefers-reduced-motion`
 * and the SettingsContext.reducedMotion toggle. Skipped entirely when `cursor.id`
 * is "none" or no palette is provided.
 *
 * Touch devices skip the effect (no real pointer to follow).
 */
export default function CursorTrail({ cursor }) {
  const { reducedMotion } = useSettings();
  const [dots, setDots] = useState([]);
  const idRef = useRef(0);
  const lastTimeRef = useRef(0);

  const active =
    !!cursor &&
    cursor.id !== "none" &&
    Array.isArray(cursor.palette) &&
    cursor.palette.length > 0 &&
    !reducedMotion;

  useEffect(() => {
    if (!active) {
      setDots([]);
      return undefined;
    }
    if (typeof window === "undefined") return undefined;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return undefined;

    // Skip on touch-only devices to avoid orphan ghost dots at (0, 0).
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
      return undefined;
    }

    const handleMove = (event) => {
      const now = performance.now();
      if (now - lastTimeRef.current < 28) return;
      lastTimeRef.current = now;

      const palette = cursor.palette;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const id = ++idRef.current;
      const dot = {
        id,
        x: event.clientX,
        y: event.clientY,
        color,
        size: cursor.style === "pixel" ? 8 : 10,
        shape: cursor.style === "pixel" ? "square" : "round",
        glow: cursor.style === "neon" || cursor.style === "spark",
      };

      setDots((prev) => {
        const next = [...prev, dot];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });

      window.setTimeout(() => {
        setDots((prev) => prev.filter((d) => d.id !== id));
      }, 600);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [active, cursor]);

  if (!active || dots.length === 0) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {dots.map((dot) => (
        <span
          key={dot.id}
          style={{
            position: "absolute",
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            marginLeft: -dot.size / 2,
            marginTop: -dot.size / 2,
            background: dot.color,
            borderRadius: dot.shape === "square" ? 2 : "50%",
            opacity: 0.8,
            transition: "opacity 500ms ease, transform 500ms ease",
            transform: "scale(1)",
            animation: "cursor-trail-fade 600ms ease forwards",
            boxShadow: dot.glow ? `0 0 8px 2px ${dot.color}` : "none",
          }}
        />
      ))}
    </div>
  );
}
