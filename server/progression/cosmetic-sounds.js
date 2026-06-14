/**
 * Sound pack catalog — drives keyboard/tile/event audio variants on the client.
 *
 * `variant` controls volume and an optional pitch shift on the AudioContext.
 * Tier 1 reuses the existing sound asset set; richer packs can be added later.
 */

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

export function getSoundById(id) {
  return COSMETIC_SOUNDS[id] || COSMETIC_SOUNDS[DEFAULT_SOUND_ID];
}

export function getPublicSoundsList() {
  return SOUND_IDS.map((id) => {
    const s = COSMETIC_SOUNDS[id];
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
    };
  });
}
