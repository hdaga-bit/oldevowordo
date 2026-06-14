import { sanitizePlayerName, isSafeInput } from "./utils/sanitize.js";

/**
 * @param {string | null | undefined} name
 * @returns {boolean}
 */
export function isPlaceholderDisplayName(name) {
  if (name == null) return true;
  const trimmed = String(name).trim();
  if (!trimmed) return true;
  if (/^(guest(\s+player)?|player)$/i.test(trimmed)) return true;
  if (/^player\s+[a-z0-9]{4,12}$/i.test(trimmed)) return true;
  return false;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizePlayerNameInput(raw) {
  if (raw == null) return null;
  const trimmed = sanitizePlayerName(String(raw).trim());
  if (!trimmed || !isSafeInput(trimmed)) return null;
  return trimmed.slice(0, 20);
}

/**
 * Save lobby / guest name to User.displayName when appropriate.
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} userId
 * @param {unknown} rawName
 * @returns {Promise<string | null>} saved display name, or existing if kept
 */
export async function persistPlayerDisplayName(prisma, userId, rawName) {
  const normalized = normalizePlayerNameInput(rawName);
  if (!userId || !normalized) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });
  if (!user) return null;

  const existing =
    typeof user.displayName === "string" ? user.displayName.trim() : "";
  if (existing && !isPlaceholderDisplayName(existing)) {
    return existing;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { displayName: normalized },
  });
  return normalized;
}
