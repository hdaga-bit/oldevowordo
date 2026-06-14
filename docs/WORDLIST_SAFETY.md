# Word list safety & guess latency

## Safety filter

Blocked words are defined in `server/blocklist.txt` (one 5-letter word per line, `#` comments allowed). At startup the server also merges a small built-in list in `server/word-blocklist.js`.

**Applied to:**

- `words.txt` — solutions, daily answers, **`GET /api/random-word`** (dice)
- `allowed_guesses.txt` — merged into `GUESSSET` for guess validation

**Not applied to:** words already stored in active rooms (rejoin/new round only).

### Maintenance

```bash
# Preview removals from disk files
node server/scripts/apply-blocklist.js --dry-run

# Write cleaned words.txt + allowed_guesses.txt
node server/scripts/apply-blocklist.js

# Then restart server; re-seed DB if you use WordLexicon:
cd server && npx prisma db seed
```

After editing `blocklist.txt`, restart the server or `POST /api/reload-words` (dev only).

### Policy

- **Solutions + dice:** blocklist only (family-friendly secrets).
- **Guesses:** same blocklist today (offensive words cannot be typed). To allow typing but never as answers, split lists: keep guesses file unfiltered in git but filter only `WORDS` at load — not implemented yet.

---

## Guess latency (implemented)

1. **Removed duplicate HTTP `validateWord`** before `makeGuess` in duel / battle / shared / AI battle. Server still validates via `GUESSSET`.
2. **`broadcastRoomState`** emits `roomState` first, persists room to Redis/memory asynchronously (faster socket ack).
3. **Duel flip** triggers immediately when `guesses.length` changes (removed 100ms delay).

Secret/host word setup still uses `validateWord` over HTTP for immediate feedback while typing.

---

## Future improvements (not done)

| Area | Idea |
|------|------|
| **Blocklist** | Import a maintained open-source profanity list; scan all 12k guesses for substring/offensive stems. |
| **Optimistic UI** | On `makeGuess` ack, append row locally using returned `pattern` before `roomState` arrives. |
| **Client word cache** | Ship a hash/set of `GUESSSET` for offline invalid-word feedback (large bundle). |
| **Daily DB** | Ensure `WordLexicon` seed excludes blocklist (re-seed after `apply-blocklist.js`). |
| **Keyboard** | Map flipped key colors to `--tile-correct-*` CSS vars for colorblind mode. |
| **Reload API** | Protect `POST /api/reload-words` in production (admin-only). |
| **Rate limits** | Slightly raise `makeGuess` cap if removing HTTP validate increases burst submits. |

See also `docs/wordlist-refresh.md` for frequency curation with `curate_words.py`.
