/**
 * Mode Theme Configuration
 * Defines visual styling and feature flags for each game mode
 */

const NEUTRAL_BADGE = "bg-zinc-800 text-zinc-300";
const NEUTRAL_BORDER = "border-zinc-700";

export const MODE_THEMES = {
  duel: {
    name: "Duel",
    colors: {
      primary: "#a1a1aa",
      secondary: "#71717a",
      accent: "#d4d4d8",
      surface: "bg-zinc-900",
      badge: NEUTRAL_BADGE,
      border: NEUTRAL_BORDER,
    },
    icon: "⚔️",
    features: {
      secretWord: true,
      rematch: true,
      particles: true,
      confetti: true,
      timer: true,
    },
    layout: {
      playerCards: "grid-cols-2",
      showProgress: false,
      showSpectate: false,
    },
  },
  shared: {
    name: "Shared Duel",
    colors: {
      primary: "#a1a1aa",
      secondary: "#71717a",
      accent: "#d4d4d8",
      surface: "bg-zinc-900",
      badge: NEUTRAL_BADGE,
      border: NEUTRAL_BORDER,
    },
    icon: "🛡️",
    features: {
      secretWord: false,
      rematch: true,
      particles: true,
      confetti: true,
      timer: false,
      turnBased: true,
    },
    layout: {
      playerCards: "grid-cols-2",
      showProgress: false,
      showSpectate: false,
    },
  },
  battle: {
    name: "Battle Royale",
    colors: {
      primary: "#a1a1aa",
      secondary: "#71717a",
      accent: "#d4d4d8",
      surface: "bg-zinc-900",
      badge: NEUTRAL_BADGE,
      border: NEUTRAL_BORDER,
    },
    icon: "👥",
    features: {
      secretWord: false,
      rematch: false,
      particles: true,
      confetti: true,
      timer: false,
      hostControls: true,
      spectate: true,
    },
    layout: {
      playerCards: "flex-col",
      showProgress: true,
      showSpectate: true,
    },
  },
  battle_ai: {
    name: "AI Battle",
    colors: {
      primary: "#a1a1aa",
      secondary: "#71717a",
      accent: "#d4d4d8",
      surface: "bg-zinc-900",
      badge: NEUTRAL_BADGE,
      border: NEUTRAL_BORDER,
    },
    icon: "⚡",
    features: {
      secretWord: false,
      rematch: false,
      particles: true,
      confetti: true,
      timer: true,
      hostControls: true,
      spectate: true,
      aiHost: true,
    },
    layout: {
      playerCards: "flex-col",
      showProgress: true,
      showSpectate: true,
    },
  },
  daily: {
    name: "Daily",
    colors: {
      primary: "#a1a1aa",
      secondary: "#71717a",
      accent: "#d4d4d8",
      surface: "bg-zinc-900",
      badge: NEUTRAL_BADGE,
      border: NEUTRAL_BORDER,
    },
    icon: "📅",
    features: {
      secretWord: false,
      rematch: false,
      particles: true,
      confetti: true,
      timer: false,
      solo: true,
    },
    layout: {
      playerCards: "hidden",
      showProgress: false,
      showSpectate: false,
    },
  },
};

export function getModeTheme(mode) {
  return MODE_THEMES[mode] || MODE_THEMES.duel;
}

export function hasFeature(mode, feature) {
  const theme = getModeTheme(mode);
  return theme.features[feature] === true;
}
