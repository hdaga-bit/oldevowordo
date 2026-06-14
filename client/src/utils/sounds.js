const cache = new Map();

/** Sound files under /public/sounds (must match files on disk). */
export const SOUND_FILES = {
  correct: "mp3",
  typing: "mp3",
  error: "wav",
  wrong: "wav",
  fourthGuess: "wav",
};

/** Filenames that differ from the sound key (spaces, etc.). */
const SOUND_BASENAME = {
  fourthGuess: "4th guess",
};

export function getSoundUrl(name) {
  const ext = SOUND_FILES[name];
  if (!ext) return null;
  const base = SOUND_BASENAME[name] ?? name;
  return `/sounds/${encodeURI(`${base}.${ext}`)}`;
}

function getEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("wordleplus_audio_enabled") !== "false";
}

function getVolume() {
  if (typeof window === "undefined") return 0.7;
  const v = parseFloat(localStorage.getItem("wordleplus_audio_volume"));
  return Number.isFinite(v) ? v : 0.7;
}

function play(name, vol) {
  if (!SOUND_FILES[name]) return;
  if (!getEnabled()) return;
  try {
    let src = cache.get(name);
    if (!src) {
      const url = getSoundUrl(name);
      if (!url) return;
      src = new Audio(url);
      src.preload = "auto";
      cache.set(name, src);
    }
    const clone = src.cloneNode();
    clone.volume = Math.min(vol ?? getVolume(), 1);
    clone.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function playErrorSound() {
  play("error", 0.6);
}

export function playSubmitSound() {
  play("correct", 0.5);
}

export function playTypingSound() {
  play("typing", 0.25);
}

export function playDefeatSound() {
  play("wrong", 0.65);
}

export function playWrongSound() {
  play("wrong", 0.65);
}
