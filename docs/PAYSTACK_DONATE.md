# Paystack donations

## Phase 1 (current): Payment Page link

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com).
2. Go to **Payment Pages** (or **Payment Links**) → **Create**.
3. Name: e.g. `Support EvoWordo`.
4. Currency: **NGN** (or USD if your account supports it for your audience).
5. Enable **custom amount** or set suggested amounts (e.g. ₦500, ₦1000, ₦2000).
6. Publish and copy the public URL (e.g. `https://paystack.com/pay/your-slug`).
7. **Page image (SEO / social preview)** in Paystack (Dashboard → Payment Pages → your page → upload image):
   upload `Paystack.png` directly in the dashboard, or use **`https://www.evowordo.com/paystack.png`** after deploy.
   PNG/JPG only (no SVG), ideally **1024×512** and **under 1 MB**.
   **Note:** this image is for link previews when the Paystack URL is shared (Discord, WhatsApp, etc.).
   It does **not** render as a large banner on the live checkout left panel — that panel only shows a
   **small business logo** (Settings → Preferences → Logo, max 1 MB) plus the page title.

### Client env (Vercel / `client/.env`)

```env
VITE_PAYSTACK_DONATE_URL=https://paystack.com/pay/your-slug
```

Rebuild/redeploy the client after setting this. If unset, Donate links are hidden.

### Test

Use Paystack **test mode** first, then switch to live when ready.

---

## Phase 2 (deferred): In-app amounts + API

- `POST /api/donate/initialize` on the server (`PAYSTACK_SECRET_KEY`).
- `POST /api/donate/webhook` with Paystack signature verification.
- Client: `DonateModal` + `@paystack/inline-js` with `VITE_PAYSTACK_PUBLIC_KEY`.
- Webhook URL in Paystack: `https://your-api-host/api/donate/webhook`.

See launch env checklist in `docs/LAUNCH_CHECKLIST.md`.
