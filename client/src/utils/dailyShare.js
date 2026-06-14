import { SITE_NAME, SITE_URL } from "../config/site";

const EMOJI = {
  green: "🟩",
  correct: "🟩",
  yellow: "🟨",
  present: "🟨",
  gray: "⬛",
  absent: "⬛",
  empty: "⬜",
};

function patternToEmoji(pattern) {
  if (!Array.isArray(pattern)) return "⬜⬜⬜⬜⬜";
  return pattern
    .map((cell) => EMOJI[cell] ?? "⬜")
    .join("");
}

/**
 * Build Wordle-style share text from daily guess entries.
 * @param {{ guess: string, pattern: string[] }[]} guesses
 * @param {{ won: boolean, guessCount: number, streak?: number }} opts
 */
export function buildDailyShareText(guesses, { won, guessCount, streak = 0 } = {}) {
  const lines = guesses
    .filter((g) => g?.pattern?.some((c) => c && c !== "empty"))
    .map((g) => patternToEmoji(g.pattern));

  const header = won
    ? `${SITE_NAME} Daily ${guessCount}/6`
    : `${SITE_NAME} Daily X/6`;
  const streakLine = streak > 0 ? `🔥 Streak: ${streak}` : "";
  const url = `${SITE_URL}/daily`;

  return [header, ...lines, streakLine, url].filter(Boolean).join("\n");
}

export async function copyDailyShareText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareDailyResult(text) {
  if (!text) return { ok: false, method: "none" };
  const title = `${SITE_NAME} Daily`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return { ok: true, method: "share" };
    }
  } catch (err) {
    if (err?.name === "AbortError") return { ok: false, method: "cancelled" };
  }
  const copied = await copyDailyShareText(text);
  return { ok: copied, method: copied ? "clipboard" : "failed" };
}
