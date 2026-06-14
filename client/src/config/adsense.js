/** Google AdSense publisher client (public in built JS). */
export const ADSENSE_CLIENT =
  import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-9407409839986837";

/** Create display units in AdSense → Ads → By ad unit, then set these in .env */
export const ADSENSE_SLOT_HOME = import.meta.env.VITE_ADSENSE_SLOT_HOME || "";
export const ADSENSE_SLOT_SIDE = import.meta.env.VITE_ADSENSE_SLOT_SIDE || "";

export function isAdsenseEnabled() {
  return Boolean(ADSENSE_CLIENT);
}

export function hasHomeAdSlot() {
  return Boolean(ADSENSE_SLOT_HOME);
}

export function hasSideAdSlot() {
  return Boolean(ADSENSE_SLOT_SIDE);
}
