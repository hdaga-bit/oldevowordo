import { isSafeInput } from "./utils/sanitize.js";

const VALID_CATEGORIES = new Set(["bug", "feature", "general"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LEN = 10;
const MAX_MESSAGE_LEN = 2000;
const MAX_EMAIL_LEN = 254;
const MAX_PAGE_URL_LEN = 500;
const MAX_USER_AGENT_LEN = 500;

function parseFeedbackBody(body) {
  const category =
    typeof body?.category === "string" ? body.category.trim().toLowerCase() : "";
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";
  const contactEmail =
    typeof body?.contactEmail === "string" && body.contactEmail.trim()
      ? body.contactEmail.trim().slice(0, MAX_EMAIL_LEN)
      : null;
  const pageUrl =
    typeof body?.pageUrl === "string" && body.pageUrl.trim()
      ? body.pageUrl.trim().slice(0, MAX_PAGE_URL_LEN)
      : null;

  if (!VALID_CATEGORIES.has(category)) {
    return { error: "Invalid category" };
  }

  if (!message || message.length < MIN_MESSAGE_LEN) {
    return { error: "Message must be at least 10 characters" };
  }

  if (message.length > MAX_MESSAGE_LEN) {
    return { error: "Message is too long" };
  }

  if (!isSafeInput(message)) {
    return { error: "Invalid message content" };
  }

  if (contactEmail && !EMAIL_RE.test(contactEmail)) {
    return { error: "Invalid email address" };
  }

  return { category, message, contactEmail, pageUrl };
}

/**
 * @param {import("express").Request} req
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {() => string | null | undefined} getUserId
 */
export async function submitFeedback(req, prisma, getUserId) {
  const parsed = parseFeedbackBody(req.body);
  if (parsed.error) {
    return { status: 400, body: { error: parsed.error } };
  }

  const userId = getUserId?.() ?? null;
  const userAgent = (req.get("user-agent") || "").slice(0, MAX_USER_AGENT_LEN) || null;

  const row = await prisma.feedback.create({
    data: {
      userId,
      category: parsed.category,
      message: parsed.message,
      contactEmail: parsed.contactEmail,
      pageUrl: parsed.pageUrl,
      userAgent,
    },
    select: { id: true },
  });

  return { status: 201, body: { ok: true, id: row.id } };
}

/**
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {{ limit?: number, status?: string }} options
 */
export async function listFeedback(prisma, { limit = 50, status } = {}) {
  const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const where =
    status && ["new", "reviewed"].includes(status) ? { status } : undefined;

  const items = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      category: true,
      message: true,
      contactEmail: true,
      pageUrl: true,
      userAgent: true,
      status: true,
    },
  });

  return { items };
}

export function requireAdminToken(req, res, next, adminToken) {
  if (!adminToken) {
    return res.status(503).json({ error: "Admin token not configured" });
  }
  const header = req.get("authorization") || "";
  const provided =
    header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
  if (!provided || provided !== adminToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}
