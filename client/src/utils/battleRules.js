const TIMER_PRESETS = [
  { label: "Off", value: null },
  { label: "3m", value: 3 * 60 * 1000 },
  { label: "5m", value: 5 * 60 * 1000 },
  { label: "6m", value: 6 * 60 * 1000 },
];

export { TIMER_PRESETS };

function formatTimerMs(ms) {
  if (!ms || ms <= 0) return "no timer";
  const minutes = Math.round(ms / 60000);
  return `${minutes} min limit`;
}

/** One-line rules summary for players waiting in lobby. */
export function formatBattleRulesSummary(battle) {
  if (!battle) return "";
  const guesses = battle.maxGuesses ?? 6;
  const parts = [`${guesses} guess${guesses === 1 ? "" : "es"}`, formatTimerMs(battle.roundMs)];
  if (battle.locked) parts.push("not accepting new players");
  return parts.join(" · ");
}
