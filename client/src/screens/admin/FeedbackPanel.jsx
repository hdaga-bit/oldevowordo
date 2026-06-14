import { updateFeedbackStatus } from "../../api/adminApi";
import { EmptyState, formatDateTime } from "./adminUtils";

export default function FeedbackPanel({ feedback, loading, onReload, onError }) {
  const markReviewed = async (item) => {
    onError("");
    try {
      await updateFeedbackStatus(item.id, "reviewed");
      await onReload();
    } catch (err) {
      onError(err.message || "Failed to update feedback");
    }
  };

  if (loading && feedback.length === 0) return <EmptyState>Loading feedback…</EmptyState>;
  if (feedback.length === 0) return <EmptyState>No feedback yet.</EmptyState>;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-white">Feedback Queue</h2>
        <p className="text-sm text-white/45">Current support and operations feedback.</p>
      </div>
      {feedback.map((item) => (
        <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
              {item.category}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${item.status === "new" ? "bg-amber-500/20 text-amber-200" : "bg-white/10 text-white/50"}`}>
              {item.status}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-white/90">{item.message}</p>
          <p className="mt-2 text-xs text-white/40">
            {formatDateTime(item.createdAt)}
            {item.contactEmail ? ` · ${item.contactEmail}` : ""}
          </p>
          {item.status === "new" ? (
            <button
              type="button"
              onClick={() => markReviewed(item)}
              className="mt-3 text-xs font-semibold text-zinc-300 hover:text-zinc-100"
            >
              Mark reviewed
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
