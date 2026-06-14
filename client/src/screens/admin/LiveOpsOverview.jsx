import { Activity, CalendarClock, Radio, Users } from "lucide-react";
import { EmptyState, formatDuration, formatNumber, StatCard, StatusPill } from "./adminUtils";

export default function LiveOpsOverview({ stats, summary, loading }) {
  if (loading && !summary && !stats) return <EmptyState>Loading live operations overview…</EmptyState>;

  const totals = summary?.totals || {};
  const live = summary?.live || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Radio}
          label="Live Events"
          value={formatNumber(totals.liveEvents)}
          sub={`${formatNumber(totals.scheduledEvents)} scheduled`}
        />
        <StatCard
          icon={Users}
          label="Active Participants"
          value={formatNumber(totals.activeParticipants)}
          sub={`${formatNumber(stats?.users?.total)} total players`}
        />
        <StatCard
          icon={CalendarClock}
          label="Event Configs"
          value={formatNumber(totals.events)}
          sub={`${formatNumber(totals.disabledEvents)} disabled`}
        />
        <StatCard
          icon={Activity}
          label="Live Rooms"
          value={formatNumber(stats?.live?.activeRooms)}
          sub={`${formatNumber(stats?.games?.totalGamesRecorded)} recorded games`}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Live Event Feed</h2>
            <p className="text-sm text-white/45">Current operational state from DB runs and runtime rooms.</p>
          </div>
        </div>
        {live.length === 0 ? (
          <EmptyState>No live events right now.</EmptyState>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {live.map((run) => (
              <div key={run.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">
                      {run.scheduledEvent?.name || run.eventKey}
                    </h3>
                    <p className="text-xs text-white/40">{run.mode} · {run.eventKey}</p>
                  </div>
                  <StatusPill status={run.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Active" value={formatNumber(run.activePlayers)} />
                  <Metric label="Peak" value={formatNumber(run.peakConcurrentPlayers)} />
                  <Metric label="Matches" value={formatNumber(run.matchCount)} />
                  <Metric label="Uptime" value={formatDuration(run.uptimeMs)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
