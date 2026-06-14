import { ArrowLeft, RefreshCw } from "lucide-react";
import { ADMIN_TABS } from "./adminUtils";

export default function AdminDashboardShell({
  adminEmail,
  tab,
  onTabChange,
  onRefresh,
  onBack,
  error,
  children,
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/70">
            EVOWORDO Live Operations
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Control Center
          </h1>
          {adminEmail ? (
            <p className="mt-1 text-sm text-white/45">{adminEmail}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {ADMIN_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === id
                ? "bg-white text-zinc-950"
                : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      {children}
    </div>
  );
}
