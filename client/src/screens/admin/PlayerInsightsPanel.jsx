import { useState } from "react";
import { Search } from "lucide-react";
import { fetchAdminPlayers } from "../../api/adminApi";
import { EmptyState, formatDateTime, formatNumber } from "./adminUtils";

export default function PlayerInsightsPanel({ players, setPlayers, loading, onError }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setSearching(true);
    onError("");
    try {
      const data = await fetchAdminPlayers({ q: query, limit: 100 });
      setPlayers(data.items || []);
    } catch (err) {
      onError(err.message || "Failed to search players");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Player Insights</h2>
          <p className="text-sm text-white/45">Profile stats, recent activity, event participation, and moderation-ready signals.</p>
        </div>
        <form onSubmit={search} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username/email"
            className="min-h-[44px] w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 sm:w-72"
          />
          <button type="submit" disabled={searching} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50">
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>

      {(loading || searching) && players.length === 0 ? <EmptyState>Loading players…</EmptyState> : null}
      {!loading && players.length === 0 ? <EmptyState>No players found.</EmptyState> : null}

      <div className="grid gap-3">
        {players.map((player) => {
          const name = player.displayName || player.username || player.email || "Anonymous player";
          const eventCount = player.eventParticipations?.length || 0;
          const disconnects = player.eventParticipations?.reduce((sum, p) => sum + (p.disconnects || 0), 0) || 0;
          return (
            <article key={player.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">{name}</h3>
                  <p className="text-xs text-white/40">
                    {player.isAnonymous ? "Guest" : "Account"} · Last active {formatDateTime(player.updatedAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Metric label="Games" value={formatNumber(player.totalGames)} />
                  <Metric label="Wins" value={formatNumber(player.totalWins)} />
                  <Metric label="Streak" value={formatNumber(player.streak)} />
                  <Metric label="Events" value={formatNumber(eventCount)} />
                  <Metric label="Disconnects" value={formatNumber(disconnects)} />
                </div>
              </div>
              {player.eventParticipations?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {player.eventParticipations.map((p) => (
                    <span key={p.id} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/50">
                      {p.eventRun?.eventKey || "event"} · {p.matchesPlayed} match
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-[78px] rounded-xl bg-white/5 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
