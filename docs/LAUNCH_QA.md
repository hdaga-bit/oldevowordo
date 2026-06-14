# EvoWordo Launch QA Script

Run on **mobile Safari** and **desktop Chrome** before public announce. See [UI_UX_FLOWS.md](../UI_UX_FLOWS.md) for expected flows.

## Entry

- [ ] First visit: name entry → Continue → home loads
- [ ] Invalid name rejected; empty name blocks Continue
- [ ] Privacy / Terms links open from footer

## Daily

- [ ] Play daily → submit guesses → win or lose modal
- [ ] Copy / Share on daily result produces emoji grid + link
- [ ] Streak visible on hero after playing (if signed in)

## Game modes

- [ ] Create/join **Duel** — secret word, guesses, victory/rematch
- [ ] Create/join **Battle** — host start, players guess
- [ ] **AI Battle** — join or event card
- [ ] **Shared Duel** — turn-based guesses

## Open rooms

- [ ] Open rooms list loads; mobile horizontal scroll works
- [ ] Join from card works
- [ ] Join by 6-char code works

## Invite links

- [ ] Open `/duel/XXXXXX` (valid room) — join banner on home if not in room
- [ ] Enter name + Join completes join
- [ ] Invalid room shows clear error

## Navigation & resilience

- [ ] Logo during game → leave confirm → Stay / Leave game
- [ ] Disconnect Wi‑Fi briefly → reconnect toast; rejoin if needed
- [ ] Invalid guess plays error sound + shake
- [ ] Browser back from game leaves room cleanly

## Auth

- [ ] Sign in (OAuth) from profile menu
- [ ] Sign out works
- [ ] Anonymous play still works

## Settings

- [ ] `/settings` — toggle audio, colorblind tiles, reduced motion
- [ ] Settings persist after reload

## Onboarding

- [ ] Clear `localStorage.wp.onboardingDone` — 3-step tour appears once after name set
