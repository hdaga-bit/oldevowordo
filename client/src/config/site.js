/** Public site URL for share links and OG (no trailing slash). */
export const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_SITE_URL) ||
  (typeof window !== "undefined" ? window.location.origin : "https://www.evowordo.com");

export const SITE_NAME = "EvoWordo";
export const SUPPORT_EMAIL = "anothermobile14@gmail.com";

/** Paystack Payment Page URL — set VITE_PAYSTACK_DONATE_URL at build time */
export const DONATE_URL = import.meta.env.VITE_PAYSTACK_DONATE_URL || "";

/** Public banner for Paystack Payment Page settings (Dashboard → page image URL) */
export const PAYSTACK_PAGE_IMAGE_URL = `${SITE_URL}/paystack.png`;

export function isDonateEnabled() {
  return Boolean(DONATE_URL?.trim());
}
