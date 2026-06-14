import { buildApiUrl } from "../config";

async function adminFetch(path, options = {}) {
  const res = await fetch(buildApiUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export function fetchAdminMe() {
  return adminFetch("/api/admin/me");
}

export function fetchAdminStats() {
  return adminFetch("/api/admin/stats");
}

export function fetchScheduledEvents() {
  return adminFetch("/api/admin/scheduled-events");
}

export function fetchLiveOpsSummary() {
  return adminFetch("/api/admin/live-ops/summary");
}

export function fetchLiveOpsEvents() {
  return adminFetch("/api/admin/events");
}

export function createLiveOpsEvent(payload) {
  return adminFetch("/api/admin/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLiveOpsEvent(id, payload) {
  return adminFetch(`/api/admin/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function startLiveOpsEvent(id) {
  return adminFetch(`/api/admin/events/${id}/start`, {
    method: "POST",
  });
}

export function stopLiveOpsEvent(id) {
  return adminFetch(`/api/admin/events/${id}/stop`, {
    method: "POST",
  });
}

export function enableLiveOpsEvent(id) {
  return adminFetch(`/api/admin/events/${id}/enable`, {
    method: "POST",
  });
}

export function disableLiveOpsEvent(id) {
  return adminFetch(`/api/admin/events/${id}/disable`, {
    method: "POST",
  });
}

export function fetchEventRuns({ status, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return adminFetch(`/api/admin/event-runs${qs ? `?${qs}` : ""}`);
}

export function fetchEventRun(id) {
  return adminFetch(`/api/admin/event-runs/${id}`);
}

export function fetchEventRunParticipants(id) {
  return adminFetch(`/api/admin/event-runs/${id}/participants`);
}

export function fetchAdminPlayers({ q, limit } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return adminFetch(`/api/admin/players${qs ? `?${qs}` : ""}`);
}

export function fetchAdminPlayer(id) {
  return adminFetch(`/api/admin/players/${id}`);
}

export function createScheduledEvent(payload) {
  return adminFetch("/api/admin/scheduled-events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScheduledEvent(id, payload) {
  return adminFetch(`/api/admin/scheduled-events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteScheduledEvent(id) {
  return adminFetch(`/api/admin/scheduled-events/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminFeedback({ status, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return adminFetch(`/api/admin/feedback${qs ? `?${qs}` : ""}`);
}

export function updateFeedbackStatus(id, status) {
  return adminFetch(`/api/admin/feedback/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
