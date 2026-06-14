import { buildApiUrl } from "../config";

async function devFetch(path, options = {}) {
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

/** Max level, all themes, all achievements (local dev API only). */
export function grantSuperUser() {
  return devFetch("/api/dev/grant-superuser", { method: "POST" });
}
