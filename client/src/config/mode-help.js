export const HOME_HOW_TO_PLAY_KEY = "wp.howToPlay.homeDismissed";

export const MODE_HELP = {
  daily: {
    title: "Daily Challenge",
    subtitle: "One puzzle per day for everyone.",
    steps: [
      "One new puzzle every day — same word for everyone.",
      "You have 6 guesses to find the word.",
      "Your progress and streak are saved automatically.",
    ],
  },
  duel: {
    title: "Duel",
    subtitle: "Race your friend on separate boards.",
    steps: [
      "Create a room and share the code with a friend.",
      "Each player sets a secret 5-letter word for the opponent.",
      "When both secrets are set, race to solve your opponent's word first.",
    ],
  },
  battle: {
    title: "Battle Royale",
    subtitle: "Host sets the word; players race to solve it.",
    steps: [
      "The host sets the word and starts the round.",
      "The host cannot guess — they watch the race.",
      "First player to solve the word wins the round.",
    ],
  },
  battle_ai: {
    title: "AI Battle",
    subtitle: "Timed rounds with a server host.",
    steps: [
      "The server picks the word and runs timed rounds.",
      "Join a room and wait for the countdown to start.",
      "First correct guess wins — new rounds start automatically.",
    ],
  },
  shared: {
    title: "Shared Duel",
    subtitle: "Co-op on one board — take turns.",
    steps: [
      "Two players cooperate on one shared board.",
      "The host starts the round after both join.",
      "Take turns guessing — watch whose turn it is.",
    ],
  },
};

const LS_MODE_PREFIX = "wp.modeHelp.dismissed.";

function scopedHomeKey(userId) {
  return `${HOME_HOW_TO_PLAY_KEY}.${userId}`;
}

function scopedModeKey(mode, userId) {
  return `${LS_MODE_PREFIX}${mode}.${userId}`;
}

function legacyModeKey(mode) {
  return `${LS_MODE_PREFIX}${mode}`;
}

function readDismissed(scopedKey, legacyKey) {
  if (typeof window === "undefined") return true;
  if (localStorage.getItem(scopedKey) === "1") return true;
  if (legacyKey && localStorage.getItem(legacyKey) === "1") {
    localStorage.setItem(scopedKey, "1");
    return true;
  }
  return false;
}

function writeDismissed(scopedKey, legacyKey) {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedKey, "1");
  if (legacyKey) localStorage.setItem(legacyKey, "1");
}

export function wasHomeHowToPlayDismissed(userId) {
  if (!userId) return true;
  return readDismissed(scopedHomeKey(userId), HOME_HOW_TO_PLAY_KEY);
}

export function dismissHomeHowToPlay(userId) {
  if (!userId) return;
  writeDismissed(scopedHomeKey(userId), HOME_HOW_TO_PLAY_KEY);
}

export function wasModeHelpDismissed(mode, userId) {
  if (!userId || !mode) return true;
  return readDismissed(scopedModeKey(mode, userId), legacyModeKey(mode));
}

export function dismissModeHelp(mode, userId) {
  if (!userId || !mode) return;
  writeDismissed(scopedModeKey(mode, userId), legacyModeKey(mode));
}
