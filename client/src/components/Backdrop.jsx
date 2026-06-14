import React from "react";

/**
 * Flat app background. Sits behind everything when used.
 */
export default function Backdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10"
      style={{
        backgroundColor: "var(--app-bg)",
        backgroundImage: "var(--app-bg-glow)",
      }}
    />
  );
}
