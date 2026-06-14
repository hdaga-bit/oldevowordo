import { EmptyState, formatDateTime, formatDuration, formatNumber, StatusPill } from "./adminUtils";

export default function LiveEventMonitor({ summary, loading }) {
  const live = summary?.live || [];
  const rooms = summary?.runtime?.rooms || [];

  if (loading && !summary) return <EmptyState>Loading live monitor…</EmptyState>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Live Event Monitoring</h2>
        <p className="text-sm text-white/45">Operational view of active runs, rooms, participants, and uptime.</p>
      </div>

      {live.length === 0 ? <EmptyState>No active event runs.</EmptyState> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {live.map((run) => {
          const runRooms = rooms.filter((room) => room.eventRunId === run.id);
          return (
            <section key={run.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {run.scheduledEvent?.name || run.eventKey}
                  </h3>
                  <p className="text-xs text-white/40">{run.eventKey} · {run.mode}</p>
                </div>
                <StatusPill status={run.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Metric label="Active" value={formatNumber(run.activePlayers)} />
                <Metric label="Unique" value={formatNumber(run.uniqueParticipants)} />
                <Metric label="Peak" value={formatNumber(run.peakConcurrentPlayers)} />
                <Metric label="Matches" value={formatNumber(run.matchCount)} />
                <Metric label="Uptime" value={formatDuration(run.uptimeMs)} />
                <Metric label="Ends" value={formatDateTime(run.plannedEndAt)} />
                <Metric label="Rooms" value={formatNumber(runRooms.length)} />
                <Metric label="Avg Session" value={run.avgSessionDurationMs ? formatDuration(run.avgSessionDurationMs) : "Pending"} />
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20">
                <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Runtime Rooms
                </div>
                {runRooms.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-white/40">No tagged runtime rooms yet.</p>
                ) : (
                  <div className="divide-y divide-white/10">
                    {runRooms.map((room) => (
                      <div key={room.roomId} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="font-mono text-white/80">{room.roomId}</span>
                        <span className="text-white/45">
                          {room.activePlayers} players · {room.inProgress ? "in progress" : "idle"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
