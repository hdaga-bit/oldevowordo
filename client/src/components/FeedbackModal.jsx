import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { submitFeedback } from "../api";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";
import LoadingSpinner from "./ui/LoadingSpinner";

const CATEGORIES = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature idea" },
  { value: "general", label: "General feedback" },
];

const MIN_MESSAGE_LEN = 10;
const MAX_MESSAGE_LEN = 2000;

export default function FeedbackModal({ open, onOpenChange }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const { showNotification } = useErrorNotification();

  const [category, setCategory] = useState("feature");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    previouslyFocused.current = document.activeElement;
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onOpenChange?.(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onOpenChange, submitting]);

  useEffect(() => {
    if (!open) {
      setCategory("feature");
      setMessage("");
      setContactEmail("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const trimmedMessage = message.trim();
  const canSubmit =
    trimmedMessage.length >= MIN_MESSAGE_LEN &&
    trimmedMessage.length <= MAX_MESSAGE_LEN &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : undefined;
      await submitFeedback({
        category,
        message: trimmedMessage,
        contactEmail: contactEmail.trim() || undefined,
        pageUrl,
      });
      showNotification("Thanks for your feedback!", "success", { duration: 2800 });
      onOpenChange?.(false);
    } catch (err) {
      setError(err.message || "Failed to send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !submitting && onOpenChange?.(false)}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#12121f] p-6 shadow-2xl outline-none scrollbar-track-panel"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="feedback-title" className="text-xl font-bold text-white">
              Send feedback
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Suggest improvements or report issues. We read every message.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onOpenChange?.(false)}
            disabled={submitting}
            className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-zinc-500 shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback-category" className="block text-sm font-medium text-white/80 mb-1.5">
              Category
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium text-white/80 mb-1.5">
              Message
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitting}
              rows={5}
              maxLength={MAX_MESSAGE_LEN}
              placeholder="Describe your idea or what went wrong…"
              className="w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <p className="mt-1 text-xs text-white/50 text-right">
              {trimmedMessage.length}/{MAX_MESSAGE_LEN}
              {trimmedMessage.length > 0 && trimmedMessage.length < MIN_MESSAGE_LEN
                ? ` (min ${MIN_MESSAGE_LEN})`
                : null}
            </p>
          </div>

          <div>
            <label htmlFor="feedback-email" className="block text-sm font-medium text-white/80 mb-1.5">
              Email <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={submitting}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl btn-success disabled:opacity-50 disabled:cursor-not-allowed py-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--btn-success-bg)]"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" variant="white" />
                  Sending…
                </>
              ) : (
                "Send feedback"
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              disabled={submitting}
              className="flex-1 rounded-xl border border-white/20 text-white/80 py-2.5 text-sm hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}