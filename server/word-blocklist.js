/**
 * Safety filter for 5-letter word lists (solutions + allowed guesses).
 *
 * Words are blocked if they appear in blocklist.txt (one word per line, # comments).
 * Extend the file as needed; restart the server (or POST /api/reload-words in dev).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_BLOCKLIST_PATH = path.join(__dirname, "blocklist.txt");

/** Built-in fallback when blocklist.txt is missing (5-letter uppercase). */
export const BUILTIN_BLOCKED = [
  "BOOBS",
  "COCKS",
  "CUNTS",
  "DYKES",
  "FAGGY",
  "FAGOT",
  "FUCKS",
  "GOOKS",
  "KIKES",
  "NEGRO",
  "NIGER",
  "PENIS",
  "RAPED",
  "RAPES",
  "SEMEN",
  "SLUTS",
  "SPERM",
  "SPICS",
  "WHORE",
];

/**
 * @param {string} [filePath]
 * @returns {Set<string>}
 */
export function loadBlocklist(filePath = DEFAULT_BLOCKLIST_PATH) {
  const set = new Set(BUILTIN_BLOCKED.map((w) => w.toUpperCase()));

  if (!filePath || !fs.existsSync(filePath)) {
    return set;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const word = trimmed.toUpperCase();
    if (/^[A-Z]{5}$/.test(word)) {
      set.add(word);
    }
  }

  return set;
}

/**
 * @param {string[]} words
 * @param {Set<string>} blocklist
 * @returns {{ kept: string[], removed: string[] }}
 */
export function filterBlockedWords(words, blocklist) {
  const kept = [];
  const removed = [];
  for (const w of words) {
    const upper = w.toUpperCase();
    if (blocklist.has(upper)) {
      removed.push(upper);
    } else {
      kept.push(upper);
    }
  }
  return { kept, removed };
}
