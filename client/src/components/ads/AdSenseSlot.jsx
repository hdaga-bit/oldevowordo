import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, isAdsenseEnabled } from "../../config/adsense";
import { cn } from "@/lib/utils";

/**
 * Renders one AdSense unit. Requires data-ad-slot from the AdSense dashboard.
 * @param {string} slot - Ad unit slot id
 * @param {'auto'|'horizontal'|'rectangle'|'vertical'} format
 * @param {string} layoutKey - change when remounting route so push runs once per placement
 */
export default function AdSenseSlot({
  slot,
  format = "auto",
  className,
  style,
  layoutKey = "default",
  minHeight = 90,
}) {
  const lastPushedKey = useRef(null);

  useEffect(() => {
    if (!isAdsenseEnabled() || !slot) return;
    if (lastPushedKey.current === layoutKey) return;
    lastPushedKey.current = layoutKey;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      lastPushedKey.current = null;
    }
  }, [slot, layoutKey]);

  if (!isAdsenseEnabled() || !slot) {
    return null;
  }

  return (
    <ins
      className={cn("adsbygoogle", className)}
      style={{ display: "block", minHeight, ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={format === "auto" || format === "horizontal" ? "true" : undefined}
    />
  );
}
