/** Client sound pack tokens — must stay in sync with server. */

export const SOUND_IDS = ["standard", "chiptune", "asmr_clack", "orchestral"];

export const COSMETIC_SOUNDS = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Default keyboard and tile sounds.",
    icon: "🔊",
    volumeMultiplier: 1.0,
    pitchShift: 0,
  },
  chiptune: {
    id: "chiptune",
    name: "Chiptune",
    description: "Bright, slightly pitched arcade blips.",
    icon: "🎮",
    volumeMultiplier: 0.9,
    pitchShift: 0.25,
  },
  asmr_clack: {
    id: "asmr_clack",
    name: "ASMR Clack",
    description: "Mellow keyboard clacks at a lower volume.",
    icon: "🎧",
    volumeMultiplier: 0.55,
    pitchShift: -0.1,
  },
  orchestral: {
    id: "orchestral",
    name: "Orchestral",
    description: "Lower, fuller body for big wins.",
    icon: "🎻",
    volumeMultiplier: 1.0,
    pitchShift: -0.2,
  },
};

export const DEFAULT_SOUND_ID = "standard";

export function getSoundPackById(id) {
  return COSMETIC_SOUNDS[id] || COSMETIC_SOUNDS[DEFAULT_SOUND_ID];
}

export function getSoundListForPicker(unlockedIds = []) {
  const set = new Set(unlockedIds);
  return Object.values(COSMETIC_SOUNDS).map((s) => ({
    ...s,
    unlocked:
      s.id === DEFAULT_SOUND_ID ||
      set.has(`sound:${s.id}`) ||
      set.has(s.id),
  }));
}
