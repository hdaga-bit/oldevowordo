import { useMemo, useState } from "react";
import { Pencil, Play, Plus, Power, Square, Trash2 } from "lucide-react";
import {
  createLiveOpsEvent,
  deleteScheduledEvent,
  disableLiveOpsEvent,
  enableLiveOpsEvent,
  startLiveOpsEvent,
  stopLiveOpsEvent,
  updateLiveOpsEvent,
} from "../../api/adminApi";
import { EmptyState, formatDateTime, StatusPill } from "./adminUtils";

const EMPTY_FORM = {
  name: "",
  eventKey: "",
  mode: "battle_ai",
  description: "",
  startsAt: "",
  durationMinutes: 60,
  recurrenceRule: "",
  timezone: "UTC",
  recurrenceTimezone: "UTC",
  theme: "",
  rules: "",
  rewards: "",
  enabled: true,
  featured: true,
};

export default function EventManagementPanel({ events, loading, onReload, onError }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState(null);

  const sorted = useMemo(() => events || [], [events]);

  const openCreate = () => {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setForm({
      name: event.name || "",
      eventKey: event.eventKey || "",
      mode: event.mode || "battle_ai",
      description: event.description || "",
      startsAt: event.startsAt ? new Date(event.startsAt).toISOString().slice(0, 16) : "",
      durationMinutes: event.durationMinutes || 60,
      recurrenceRule: event.recurrenceRule || "",
      timezone: event.timezone || "UTC",
      recurrenceTimezone: event.recurrenceTimezone || event.timezone || "UTC",
      theme: event.theme ? JSON.stringify(event.theme, null, 2) : "",
      rules: event.rules ? JSON.stringify(event.rules, null, 2) : "",
      rewards: event.rewards ? JSON.stringify(event.rewards, null, 2) : "",
      enabled: event.enabled !== false,
      featured: event.featured !== false,
    });
    setModalOpen(true);
  };

  const payloadFromForm = () => ({
    ...form,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    durationMinutes: Number(form.durationMinutes) || 60,
    theme: form.theme ? JSON.parse(form.theme) : null,
    rules: form.rules ? JSON.parse(form.rules) : null,
    rewards: form.rewards ? JSON.parse(form.rewards) : null,
  });

  const runAction = async (id, action) => {
    setBusyId(id);
    onError("");
    try {
      await action(id);
      await onReload();
    } catch (err) {
      onError(err.message || "Event action failed");
    } finally {
      setBusyId(null);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusyId(editingEvent?.id || "new");
    onError("");
    try {
      const payload = payloadFromForm();
      if (editingEvent) await updateLiveOpsEvent(editingEvent.id, payload);
      else await createLiveOpsEvent(payload);
      setModalOpen(false);
      await onReload();
    } catch (err) {
      onError(err.message || "Failed to save event");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Event Management</h2>
          <p className="text-sm text-white/45">Create reusable configs, schedule runs, and control live state.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      {loading && sorted.length === 0 ? <EmptyState>Loading events…</EmptyState> : null}
      {!loading && sorted.length === 0 ? <EmptyState>No live-ops events yet.</EmptyState> : null}

      <div className="grid gap-3">
        {sorted.map((event) => (
          <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                  <StatusPill status={event.status || (event.isActive ? "live" : "draft")} />
                  {event.recurrenceRule ? (
                    <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">
                      Recurring
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-white/55">{event.description || "No description"}</p>
                <p className="mt-2 text-xs text-white/35">
                  {event.eventKey} · {event.mode} · {event.durationMinutes || 60}m · Next: {formatDateTime(event.nextRunAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.isActive ? (
                  <IconButton label="Stop" icon={Square} busy={busyId === event.id} onClick={() => runAction(event.id, stopLiveOpsEvent)} />
                ) : (
                  <IconButton label="Start" icon={Play} busy={busyId === event.id} onClick={() => runAction(event.id, startLiveOpsEvent)} />
                )}
                {event.enabled === false || event.status === "disabled" ? (
                  <IconButton label="Enable" icon={Power} busy={busyId === event.id} onClick={() => runAction(event.id, enableLiveOpsEvent)} />
                ) : (
                  <IconButton label="Disable" icon={Power} busy={busyId === event.id} onClick={() => runAction(event.id, disableLiveOpsEvent)} />
                )}
                <IconButton label="Edit" icon={Pencil} onClick={() => openEdit(event)} />
                <IconButton
                  label="Delete"
                  icon={Trash2}
                  tone="danger"
                  busy={busyId === event.id}
                  onClick={() => {
                    if (window.confirm(`Disable/delete "${event.name}"?`)) {
                      runAction(event.id, deleteScheduledEvent);
                    }
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      {modalOpen ? (
        <EventFormModal
          form={form}
          setForm={setForm}
          editing={Boolean(editingEvent)}
          saving={Boolean(busyId)}
          onSubmit={save}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

function IconButton({ label, icon: Icon, onClick, busy = false, tone = "default" }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
        tone === "danger"
          ? "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/20"
          : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" />
      {busy ? "Working…" : label}
    </button>
  );
}

function EventFormModal({ form, setForm, editing, saving, onSubmit, onClose }) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-[#101019] p-5 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-white">{editing ? "Edit Event" : "Create Event"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(v) => update("name", v)} required />
          <Field label="Event key" value={form.eventKey} onChange={(v) => update("eventKey", v.toLowerCase())} required disabled={editing} />
          <Select label="Mode" value={form.mode} onChange={(v) => update("mode", v)} options={[["battle_ai", "Battle AI"], ["battle", "Battle"], ["duel", "Duel"], ["shared", "Shared"]]} />
          <Field label="Duration minutes" type="number" value={form.durationMinutes} onChange={(v) => update("durationMinutes", v)} />
          <Field label="Start time" type="datetime-local" value={form.startsAt} onChange={(v) => update("startsAt", v)} />
          <Select label="Recurrence" value={form.recurrenceRule} onChange={(v) => update("recurrenceRule", v)} options={[["", "One-time"], ["daily", "Daily"], ["weekly", "Weekly"]]} />
          <Field label="Timezone" value={form.timezone} onChange={(v) => update("timezone", v)} />
          <Field label="Recurrence timezone" value={form.recurrenceTimezone} onChange={(v) => update("recurrenceTimezone", v)} />
        </div>
        <label className="mt-3 block text-sm text-white/70">
          Description
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white" />
        </label>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <JsonField label="Rules JSON" value={form.rules} onChange={(v) => update("rules", v)} />
          <JsonField label="Theme JSON" value={form.theme} onChange={(v) => update("theme", v)} />
          <JsonField label="Rewards JSON" value={form.rewards} onChange={(v) => update("rewards", v)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/70">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.enabled} onChange={(e) => update("enabled", e.target.checked)} />
            Enabled
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
            Featured
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white/75">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false }) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      <input required={required} disabled={disabled} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white disabled:opacity-50" />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-[#101019] px-3 py-2 text-white">
        {options.map(([id, labelText]) => <option key={id} value={id}>{labelText}</option>)}
      </select>
    </label>
  );
}

function JsonField({ label, value, onChange }) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} placeholder='{"roundMs":300000}' className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-white" />
    </label>
  );
}
