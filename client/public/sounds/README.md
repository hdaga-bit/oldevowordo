# Sound Effects

Files in this folder (must match `SOUND_FILES` in `client/src/utils/sounds.js`):

| File | Used for |
|------|----------|
| **correct.mp3** | Tile flip on guess (green / yellow / gray) and guess submit |
| **typing.mp3** | On-screen keyboard letter taps |
| **error.wav** | Invalid word / validation error |
| **wrong.wav** | Loss (out of guesses without solving) |
| **4th guess.wav** | Bonus clip when you solve on your **4th** guess (all modes) |

## Specs

- **MP3** for `correct` and `typing`; **WAV** for `error`, `wrong`, and `4th guess`
- Keep clips short (typing ~30–80 ms; tiles ~0.1–0.3 s; error/wrong ~0.2–0.8 s)
- Normalize levels so nothing clips

## Adding a new sound

1. Add the file here
2. Register it in `SOUND_FILES` in `client/src/utils/sounds.js`
3. Wire playback in `AudioFeedback.jsx`, `Keyboard.jsx`, or the relevant hook
