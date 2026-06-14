import { motion } from "framer-motion";
import GlowButton from "../ui/GlowButton";
import ModeMark from "../modes/ModeMark";
import { getOpenRoomAccent, hexToRgba } from "../../config/open-room-mode-colors";

export default function OpenRoomCard({
  room,
  meta,
  index = 0,
  onJoin,
  joining = false,
  joiningRoomId = null,
}) {
  const accent = getOpenRoomAccent(room.mode);
  const isInProgress = Boolean(room.isInProgress);
  /** AI battle lobbies are usually always “started” — skip endless accent pulse */
  const pulseAccent = isInProgress && room.mode !== "battle_ai";
  const isJoining = joiningRoomId === room.id;

  const playerLabel = room.capacity
    ? `${room.playerCount}/${room.capacity}`
    : `${room.playerCount} player${room.playerCount === 1 ? "" : "s"}`;

  const hostName =
    typeof room.hostName === "string" && room.hostName.trim()
      ? room.hostName.trim()
      : "Mystery Host";

  return (
    <div className="group relative overflow-visible">
      {/* Accent “shadow” layer — offset up-left, pushes further on hover */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl transition-transform duration-300 ease-out -translate-x-[6px] -translate-y-[6px] group-hover:-translate-x-[11px] group-hover:-translate-y-[11px]"
        style={{
          backgroundColor: hexToRgba(accent, 0.5),
          zIndex: 0,
        }}
        initial={false}
      />

      <motion.article
        className="relative z-10 flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 md:p-5 transition-transform duration-300 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
        initial={{ opacity: 0, y: 20 }}
        animate={
          pulseAccent
            ? {
                opacity: 1,
                y: 0,
                boxShadow: [
                  `0 0 0 1px ${hexToRgba(accent, 0.25)}`,
                  `0 0 0 1px ${hexToRgba(accent, 0.45)}`,
                  `0 0 0 1px ${hexToRgba(accent, 0.25)}`,
                ],
              }
            : { opacity: 1, y: 0 }
        }
        transition={
          pulseAccent
            ? { delay: 0.2 + index * 0.05, boxShadow: { duration: 2.2, repeat: Infinity } }
            : { delay: 0.2 + index * 0.05 }
        }
      >
        {/* Tiny top glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-50"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(accent, 0.14)} 0%, transparent 100%)`,
          }}
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between gap-3">
            <span
              className="inline-flex min-w-0 max-w-[58%] items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                borderColor: hexToRgba(accent, 0.45),
                backgroundColor: hexToRgba(accent, 0.14),
                color: "#fafafa",
                boxShadow: `0 0 12px ${hexToRgba(accent, 0.2)}`,
              }}
            >
              <ModeMark mode={room.mode} size="pin" className="shrink-0" />
              <span className="truncate">{meta.label}</span>
            </span>

            <span
              className="text-sm font-mono font-medium text-zinc-400 tracking-[0.08em] tabular-nums shrink-0 leading-none pt-0.5"
              title={`Room ${room.id}`}
            >
              {room.id}
            </span>
          </div>

          <p
            className="mt-4 text-sm font-medium text-zinc-200 truncate"
            title={`Host: ${hostName}`}
          >
            {hostName}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <p className="text-lg font-semibold leading-none text-white tabular-nums">
                {playerLabel}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
                <span
                  className={`h-2 w-2 rounded-full ${pulseAccent ? "animate-pulse" : ""}`}
                  style={{
                    backgroundColor: accent,
                    boxShadow: pulseAccent
                      ? `0 0 8px ${hexToRgba(accent, 0.9)}`
                      : `0 0 4px ${hexToRgba(accent, 0.5)}`,
                  }}
                  aria-hidden
                />
                {isInProgress
                  ? room.mode === "battle_ai"
                    ? "Live"
                    : "In match"
                  : "Waiting"}
              </p>
            </div>

            <GlowButton
              size="sm"
              onClick={onJoin}
              disabled={joining || isJoining}
              loading={isJoining}
              loadingText="Joining..."
              className="shrink-0"
            >
              Join
            </GlowButton>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
