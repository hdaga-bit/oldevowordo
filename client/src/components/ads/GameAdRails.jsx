import AdSenseSlot from "./AdSenseSlot";
import { ADSENSE_SLOT_SIDE, hasSideAdSlot } from "../../config/adsense";

/**
 * Left/right ad columns around in-game content (desktop/tablet).
 * Hidden on small screens so boards and keyboard stay usable.
 */
export default function GameAdRails({ children, layoutKey = "game" }) {
  const showRails = hasSideAdSlot();

  if (!showRails) {
    return (
      <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-[minmax(0,1fr)]">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-[minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_auto]">
      <aside
        className="hidden xl:flex w-[160px] shrink-0 flex-col items-center justify-start border-r border-white/5 bg-black/20 px-1 pb-4 pt-2"
        aria-label="Advertisement"
      >
        <AdSenseSlot
          slot={ADSENSE_SLOT_SIDE}
          format="vertical"
          layoutKey={`${layoutKey}-left`}
          className="w-full"
          style={{ minHeight: 600 }}
          minHeight={600}
        />
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden xl:col-start-2">
        {children}
      </div>

      <aside
        className="hidden xl:flex w-[160px] shrink-0 flex-col items-center justify-start border-l border-white/5 bg-black/20 px-1 pb-4 pt-2 xl:col-start-3"
        aria-label="Advertisement"
      >
        <AdSenseSlot
          slot={ADSENSE_SLOT_SIDE}
          format="vertical"
          layoutKey={`${layoutKey}-right`}
          className="w-full"
          style={{ minHeight: 600 }}
          minHeight={600}
        />
      </aside>
    </div>
  );
}
