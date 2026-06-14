import { PrismaClient } from "@prisma/client";
import { config } from "../config/env.js";

const prisma = new PrismaClient();

function getAdminAllowlist() {
  if (config.adminEmails.length > 0) return config.adminEmails;
  if (!process.env.ADMIN_EMAILS) return [];
  return process.env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlistedEmail(email) {
  const allowlist = getAdminAllowlist();
  if (!email || allowlist.length === 0) return false;
  const normalized = email.trim().toLowerCase();
  return allowlist.includes(normalized);
}

export async function getAdminEmail(req) {
  if (config.isTest) {
    const testEmail = req.get("x-test-admin-email");
    if (testEmail) return testEmail.trim().toLowerCase();
  }

  if (!req.user?.dbUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: req.user.dbUserId },
    select: { email: true },
  });

  return user?.email?.trim().toLowerCase() ?? null;
}

export async function requireAdminSession(req, res, next) {
  try {
    const email = await getAdminEmail(req);

    if (!email || !isAllowlistedEmail(email)) {
      if (config.isTest && req.get("x-test-admin-email")) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!req.isAuthenticated?.()) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return res.status(403).json({ error: "Forbidden" });
    }

    req.adminEmail = email;
    return next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ error: "Admin auth failed" });
  }
}

export async function getAdminProfile(req) {
  const email = await getAdminEmail(req);
  const isAdmin = isAllowlistedEmail(email);

  if (!isAdmin) {
    return { isAdmin: false, email: email ?? null, displayName: null };
  }

  let displayName = null;
  if (req.user?.dbUserId) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.dbUserId },
      select: { displayName: true },
    });
    displayName = user?.displayName ?? null;
  }

  return { isAdmin: true, email, displayName };
}
