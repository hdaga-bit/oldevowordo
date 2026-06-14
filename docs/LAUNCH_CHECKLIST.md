# EvoWordo Public Launch Checklist

Use with [DEPLOYMENT.md](../DEPLOYMENT.md) and [LAUNCH_QA.md](./LAUNCH_QA.md).

## Infrastructure

- [ ] `DATABASE_URL` set with `?sslmode=require`
- [ ] `SESSION_SECRET` — `openssl rand -base64 32` (never dev default in prod)
- [ ] `NODE_ENV=production`
- [ ] `REDIS_URL` or `UPSTASH_REDIS_URL` configured (required for multi-instance / restart safety)
- [ ] `BASE_URL` = public frontend origin (no trailing slash)
- [ ] `CORS_ALLOWED_ORIGINS` includes frontend origin(s)
- [ ] `VITE_SERVER_URL` set at **client build time** to API origin
- [ ] OAuth redirect URIs updated for production domain
- [ ] `npx prisma migrate deploy` on production DB
- [ ] `cd server && npm run predeploy`
- [ ] `BASE_URL=https://api.yourdomain.com npm run postdeploy:verify`
- [ ] `VITE_SENTRY_DSN` and `SENTRY_DSN` configured
- [ ] External uptime monitor on `GET /alive` (60s interval)

## Product (in-app)

- [ ] `VITE_PAYSTACK_DONATE_URL` set (Paystack Payment Page — see `docs/PAYSTACK_DONATE.md`)
- [ ] `/privacy` and `/terms` reachable from footer
- [ ] Daily result **Copy** / **Share** works
- [ ] Invite link `/duel/ROOMID` shows join banner on home
- [ ] `robots.txt` and `sitemap.xml` served from client `public/`

## Manual QA

- [ ] Complete [LAUNCH_QA.md](./LAUNCH_QA.md) on mobile Safari + desktop Chrome

## Announce

- [ ] Soft launch with small group; monitor Sentry 48h
- [ ] Fix P0 issues before wide announce
