import React, { useMemo, useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Copy, Check, MoreVertical, UserMinus, Trophy, Lock } from "lucide-react";
import SecretWordInputRow from "../SecretWordInputRow.jsx";
import GlowButton from "../ui/GlowButton.jsx";
import { ModeHelpButton } from "../ModeHelpSheet.jsx";
import { TIMER_PRESETS } from "../../utils/battleRules.js";

function PlayerRow({ player, onKick, kicking }) {
  const initial = (player.name || "?").charAt(0).toUpperCase();
  return (
    <li className="flex items-center gap-2 min-h-[48px] py-1.5 border-b border-white/5 last:border-0">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          player.disconnected
            ? "bg-white/5 text-white/30"
            : "bg-zinc-700/50 text-zinc-200"
        }`}
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{player.name}</p>
        <p className="text-[11px] text-white/45">
          {player.disconnected ? "Disconnected" : "Connected"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onKick(player)}
        disabled={kicking}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-40"
        aria-label={`Kick ${player.name}`}
      >
        <UserMinus className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function BattleHostDashboard({
  onExposeKeyHandler = null,
  room,
  players = [],
  onSetSettings,
  onKickPlayer,
  onSetWord,
  onSetWordAndStart,
  onStartRound,
  onOpenLeaderboard,
  settingsError = "",
  startError = "",
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [kicking, setKicking] = useState(false);
  const [kickedNotice, setKickedNotice] = useState("");
  const [starting, setStarting] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [localWord, setLocalWord] = useState("");
  const isMobile = useIsMobile();

  const battle = room?.battle;
  const locked = Boolean(battle?.locked);
  // const maxGuesses = battle?.maxGuesses ?? 6; // fixed at 6 for now
  const roundMs = battle?.roundMs ?? null;
  const hasSecret = Boolean(battle?.hasSecret);
  const wordReady = localWord.length === 5;

  const roster = useMemo(
    () => players.filter((p) => p?.id && p.id !== room?.hostId),
    [players, room?.hostId],
  );

  const connectedRoster = roster.filter((p) => !p.disconnected);
  const canStart =
    (hasSecret || wordReady) && connectedRoster.length >= 1 && !battle?.started;

  const copyCode = async () => {
    const code = room?.id?.toUpperCase?.() || "";
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const applySettings = async (partial) => {
    if (!onSetSettings || settingsBusy) return;
    setSettingsBusy(true);
    try {
      await onSetSettings(partial);
    } finally {
      setSettingsBusy(false);
    }
  };

  const confirmKick = async () => {
    if (!kickTarget || !onKickPlayer) return;
    setKicking(true);
    try {
      const result = await onKickPlayer(kickTarget.id);
      if (!result?.error) {
        setKickedNotice(`Removed ${kickTarget.name}`);
        window.setTimeout(() => setKickedNotice(""), 2500);
      }
      setKickTarget(null);
    } finally {
      setKicking(false);
    }
  };

  const handleStart = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    try {
      if (!hasSecret && wordReady && onSetWordAndStart) {
        const result = await onSetWordAndStart(localWord.toUpperCase());
        if (result?.error) return;
        return;
      }
      if (!onStartRound) return;
      const result = await onStartRound();
      if (result?.error) return;
    } finally {
      setStarting(false);
    }
  };

  const secretWordSection = (
    <section className="rounded-2xl glass-panel p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Secret word
        </h2>
      </div>
      <div className="flex justify-center">
        <SecretWordInputRow
          onSubmit={onSetWord}
          onValueChange={setLocalWord}
          onExposeKeyHandler={onExposeKeyHandler}
          autoSubmitOnComplete
          submitHint="Word sets automatically"
          hintWhenEmpty="Type a word or shuffle"
          showGenerate={false}
          shuffleMode="icon"
          size={isMobile ? 44 : 48}
          gap={6}
        />
      </div>
      <GlowButton
        onClick={handleStart}
        size="lg"
        className="w-full"
        disabled={!canStart || starting}
        loading={starting}
        loadingText="Starting…"
      >
        Start round
      </GlowButton>
      {!canStart && !starting && (
        <p className="-mt-1 text-center text-xs text-white/45">
          {!hasSecret && !wordReady
            ? "Enter a 5-letter word"
            : connectedRoster.length < 1
              ? "Need at least one player"
              : null}
        </p>
      )}
      {startError && (
        <p className="-mt-1 text-center text-xs text-red-300" role="alert">
          {startError}
        </p>
      )}
    </section>
  );

  const rosterAndRules = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Players column (vertical list) */}
      <section className="rounded-2xl glass-panel p-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Players
          </h2>
          {kickedNotice && (
            <span className="text-[10px] text-emerald-300 truncate" role="status">
              {kickedNotice}
            </span>
          )}
        </div>
        {roster.length === 0 ? (
          <p className="text-xs text-white/50 py-3 text-center">
            Share your room code to invite players.
          </p>
        ) : (
          <ul className="max-h-[26vh] sm:max-h-[44vh] overflow-y-auto -mx-1 px-1 scrollbar-track-app">
            {roster.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                kicking={kicking}
                onKick={setKickTarget}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Rules column (horizontal chip rows) */}
      <section className="rounded-2xl glass-panel p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Room rules
          </h2>
        </div>

        <label className="flex min-h-[44px] items-center justify-between gap-2">
          <span className="text-sm text-white/85">Lock room</span>
          <button
            type="button"
            role="switch"
            aria-checked={locked}
            aria-label="Lock room"
            disabled={settingsBusy}
            onClick={() => applySettings({ locked: !locked })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              locked ? "bg-zinc-100" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                locked ? "left-6" : "left-1"
              }`}
            />
          </button>
        </label>

        <div>
          <p className="text-[11px] text-white/50 mb-1.5">Timer</p>
          <div className="flex gap-1">
            {TIMER_PRESETS.map((preset) => {
              const active =
                (preset.value == null && (roundMs == null || roundMs === 0)) ||
                preset.value === roundMs;
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={settingsBusy}
                  aria-pressed={active}
                  onClick={() => applySettings({ roundMs: preset.value })}
                  className={`flex-1 min-h-[44px] rounded-lg px-1 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {settingsError && (
          <p className="text-xs text-red-300" role="alert">
            {settingsError}
          </p>
        )}
      </section>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3 pt-2 pb-2">
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl glass-panel px-3 py-2 font-mono text-sm font-bold tracking-widest text-white"
        >
          {room?.id?.toUpperCase?.() || "------"}
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" aria-hidden />
          ) : (
            <Copy className="h-4 w-4 text-white/50" aria-hidden />
          )}
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              <Lock className="h-3 w-3" aria-hidden />
              Closed
            </span>
          )}
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70 whitespace-nowrap">
            {connectedRoster.length}/{roster.length} in
          </span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-xl glass-panel text-white/70"
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/15 bg-[#12121f] py-1 shadow-xl">
                <div className="px-2 py-1">
                  <ModeHelpButton mode="battle" className="w-full justify-start !text-sm" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenLeaderboard?.();
                  }}
                  className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-3 scrollbar-track-app">
        {isMobile ? (
          <>
            {secretWordSection}
            {rosterAndRules}
          </>
        ) : (
          <>
            {rosterAndRules}
            {secretWordSection}
          </>
        )}
      </div>

      {kickTarget && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#12121f] p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kick-title"
          >
            <h3 id="kick-title" className="text-lg font-semibold text-white">
              Kick {kickTarget.name}?
            </h3>
            <p className="mt-1 text-sm text-white/55">
              They will leave the room immediately.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setKickTarget(null)}
                className="flex-1 min-h-[48px] rounded-xl border border-white/20 text-white/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmKick}
                disabled={kicking}
                className="flex-1 min-h-[48px] rounded-xl btn-danger font-semibold"
              >
                {kicking ? "Kicking…" : "Kick"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
