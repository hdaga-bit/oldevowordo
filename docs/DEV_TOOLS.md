# Dev tools (local only)

WordlePlus exposes **development-only** helpers for testing progression cosmetics. They are disabled when `NODE_ENV=production` (including Vercel/Render deploys), even if `ENABLE_DEV_TOOLS` is set in the environment.

## Enable on the server

In development (`npm run dev` in `server/`):

- **Default:** dev tools are **on** when `ENABLE_DEV_TOOLS` is unset.
- **Explicit:** set `ENABLE_DEV_TOOLS=true` in root `.env` (see `.env.example`).
- **Disable locally:** `ENABLE_DEV_TOOLS=false`

The flag is read in `server/config/env.js` as `config.enableDevTools`.

## Grant super user API

When dev tools are enabled:

```http
POST /api/dev/grant-superuser
```

Requires a session cookie (`credentials: "include"`). If no user is linked yet, the server creates/links an anonymous user like other auth routes.

**Effect on the signed-in account:**

- `xp` → max tier (4000) → level **11**
- `unlockedCosmetics` → every namespaced unlock from the registry (`theme:*`, `font:*`, `cursor:*`, `win:*`, `sound:*`)
- `UserAchievement` rows for every achievement in the catalog (existing rows skipped)

Response: `{ ok: true, progression }`.

When dev tools are off, this route is **not registered** (client receives 404).

## Cosmetics lab UI

**URL:** `/dev/lab` (only parsed when `import.meta.env.DEV` — production builds treat unknown paths as home).

**Entry:** Settings → **Cosmetics lab (dev)** (link hidden in production builds).

The lab lets you:

1. Preview every cosmetics slot on a sample grid: board theme, font pack, cursor trail, win animation, sound pack.
2. Trigger confetti / win animations and victory particles for the selected combination.
3. **Grant super user on this account** — calls the API above and refreshes auth via `GET /api/auth/user`.

After granting, open **Profile → Customise / Achievements** from the header menu to verify real unlock UI and equip flows. The Customise tab now exposes the same five slots as the lab.

## Client helper

`client/src/api/devApi.js` — `grantSuperUser()`.

## Safety

- No bypass in normal gameplay handlers; only persisted DB updates via the dev route.
- Do not enable `ENABLE_DEV_TOOLS` on production hosts.
