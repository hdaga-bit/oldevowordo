export const ADMIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "monitor", label: "Live Monitor" },
  { id: "players", label: "Players" },
  { id: "history", label: "History" },
  { id: "feedback", label: "Feedback" },
];

export function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

export function formatDateTime(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function statusTone(status) {
  if (status === "live") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
  if (status === "scheduled") return "bg-sky-500/15 text-sky-200 border-sky-400/30";
  if (status === "disabled") return "bg-white/5 text-white/45 border-white/10";
  if (status === "ended") return "bg-amber-500/15 text-amber-200 border-amber-400/30";
  return "bg-zinc-500/15 text-zinc-200 border-zinc-400/30";
}

export function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/45">{sub}</p> : null}
    </div>
  );
}

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(status)}`}>
      {status || "draft"}
    </span>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/45">
      {children}
    </div>
  );
}
