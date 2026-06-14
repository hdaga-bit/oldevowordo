import AdSenseSlot from "./AdSenseSlot";
import { ADSENSE_SLOT_HOME, hasHomeAdSlot } from "../../config/adsense";

export default function HomeFooterAd() {
  if (!hasHomeAdSlot()) return null;

  return (
    <div
      className="w-full max-w-3xl mx-auto mb-6 px-2"
      aria-label="Advertisement"
    >
      <AdSenseSlot
        slot={ADSENSE_SLOT_HOME}
        format="horizontal"
        layoutKey="home-footer"
        className="w-full"
        minHeight={90}
      />
    </div>
  );
}
