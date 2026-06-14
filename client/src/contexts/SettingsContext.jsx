import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const SettingsContext = createContext(null);

function readBool(key, fallback = false) {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "true";
}

export function SettingsProvider({ children }) {
  const [reducedMotion, setReducedMotion] = useState(() =>
    readBool("wp.reducedMotion", false),
  );
  const [colorblindTiles, setColorblindTiles] = useState(() =>
    readBool("wp.colorblindTiles", false),
  );

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.dataset.reducedMotion = "true";
    } else {
      delete root.dataset.reducedMotion;
    }
    localStorage.setItem("wp.reducedMotion", String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorblindTiles) {
      root.dataset.tileTheme = "colorblind";
    } else {
      delete root.dataset.tileTheme;
    }
    localStorage.setItem("wp.colorblindTiles", String(colorblindTiles));
  }, [colorblindTiles]);

  const value = useMemo(
    () => ({
      reducedMotion,
      setReducedMotion,
      colorblindTiles,
      setColorblindTiles,
    }),
    [reducedMotion, colorblindTiles],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
