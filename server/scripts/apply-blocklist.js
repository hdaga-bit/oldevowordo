#!/usr/bin/env node
/**
 * Remove blocklisted words from words.txt and allowed_guesses.txt on disk.
 *
 *   node server/scripts/apply-blocklist.js
 *   node server/scripts/apply-blocklist.js --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  DEFAULT_BLOCKLIST_PATH,
  filterBlockedWords,
  loadBlocklist,
} from "../word-blocklist.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.join(__dirname, "..");

function loadLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => w.toUpperCase())
    .filter((w) => /^[A-Z]{5}$/.test(w));
}

function saveLines(filePath, words) {
  const unique = [...new Set(words)].sort();
  fs.writeFileSync(filePath, unique.join("\n") + "\n", "utf8");
}

function processFile(filePath, blocklist, dryRun) {
  const before = loadLines(filePath);
  const { kept, removed } = filterBlockedWords(before, blocklist);
  console.log(`${path.basename(filePath)}: ${before.length} → ${kept.length} (removed ${removed.length})`);
  if (removed.length > 0 && removed.length <= 30) {
    console.log(`  removed: ${removed.join(", ")}`);
  } else if (removed.length > 30) {
    console.log(`  removed: ${removed.slice(0, 20).join(", ")} … (+${removed.length - 20} more)`);
  }
  if (!dryRun && removed.length > 0) {
    saveLines(filePath, kept);
  }
  return removed.length;
}

const dryRun = process.argv.includes("--dry-run");
const blocklist = loadBlocklist(DEFAULT_BLOCKLIST_PATH);

console.log(`Blocklist size: ${blocklist.size}${dryRun ? " (dry run)" : ""}\n`);

const wordsPath = path.join(SERVER_DIR, "words.txt");
const guessesPath = path.join(SERVER_DIR, "allowed_guesses.txt");

let total = 0;
total += processFile(wordsPath, blocklist, dryRun);
total += processFile(guessesPath, blocklist, dryRun);

console.log(`\nTotal removed: ${total}`);
if (dryRun) {
  console.log("Re-run without --dry-run to write files.");
} else if (total > 0) {
  console.log("Restart the server and re-seed WordLexicon if you use the DB lexicon.");
}
