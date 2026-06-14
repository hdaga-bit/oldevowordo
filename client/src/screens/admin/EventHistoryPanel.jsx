import { EmptyState, formatDateTime, formatDuration, formatNumber, StatusPill } from "./adminUtils";

export default function EventHistoryPanel({ runs, loading }) {
  if (loading && (!runs || runs.length === 0)) return <EmptyState>Loading event history…</EmptyState>;
  if (!runs || runs.length === 0) return <EmptyState>No event runs have completed yet.</EmptyState>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Event History & Analytics</h2>
        <p className="text-sm text-white/45">Run-level metrics for engagement, completion, and timing analysis.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Peak</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3">Avg Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {runs.map((run) => {
                const durationMs = run.endedAt
                  ? new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()
                  : Date.now() - new Date(run.startedAt).getTime();
                return (
                  <tr key={run.id} className="text-white/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{run.scheduledEvent?.name || run.eventKey}</div>
                      <div className="text-xs text-white/40">{run.eventKey} · {run.mode}</div>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={run.status} /></td>
                    <td className="px-4 py-3">{formatDateTime(run.startedAt)}</td>
                    <td className="px-4 py-3">{formatDuration(durationMs)}</td>
                    <td className="px-4 py-3">{formatNumber(run.uniqueParticipants)}</td>
                    <td className="px-4 py-3">{formatNumber(run.peakConcurrentPlayers)}</td>
                    <td className="px-4 py-3">{formatNumber(run.completedMatchCount || run.matchCount)}</td>
                    <td className="px-4 py-3">{run.avgSessionDurationMs ? formatDuration(run.avgSessionDurationMs) : "Pending"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
