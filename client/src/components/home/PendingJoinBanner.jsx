import { MODE_LABELS } from "../../config/mode-branding";
import GlowButton from "../ui/GlowButton";

const MODE_LABEL = {
  duel: MODE_LABELS.duel,
  battle: MODE_LABELS.battle,
  shared: MODE_LABELS.shared,
};

export default function PendingJoinBanner({
  roomId,
  mode = "duel",
  joining = false,
  onJoin,
  onDismiss,
}) {
  if (!roomId) return null;
  const code = roomId.toUpperCase();
  const modeLabel = MODE_LABEL[mode] || "game";

  return (
    <div
      role="region"
      aria-label="Join invitation"
      className="rounded-2xl border border-zinc-600/80 bg-zinc-900/90 p-4 shadow-lg"
    >
      <p className="text-sm text-zinc-400">You&apos;re joining a room</p>
      <p className="mt-1 text-lg font-semibold text-white">
        {modeLabel} · <span className="font-mono tracking-widest">{code}</span>
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Enter your name above if needed, then join to play.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <GlowButton
          type="button"
          size="md"
          disabled={joining}
          onClick={() => onJoin?.(code)}
          className="min-w-[120px]"
        >
          {joining ? "Joining…" : "Join room"}
        </GlowButton>
        <button
          type="button"
          onClick={onDismiss}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
