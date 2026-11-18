import { createHmac, timingSafeEqual } from "crypto";

/**
 * Password sign-in for the /docs editor.
 *   DOCS_ADMIN_PASSWORD        → role "admin": edit content, drafts, publish, schedule
 *   DOCS_SUPER_ADMIN_PASSWORD  → role "super_admin": everything above, plus restoring versions
 *   DOCS_ADMIN_SECRET          → optional signing key; derived from the passwords when unset
 * The session is an HMAC-signed, httpOnly cookie, so no user table is needed.
 */

export type DocsRole = "admin" | "super_admin";

export interface DocsAdminSession {
  role: DocsRole;
  exp: number; // epoch ms
}

export const DOCS_ADMIN_COOKIE = "jotno_docs_admin";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type Env = Record<string, string | undefined>;

function signingKey(env: Env): string | null {
  if (env.DOCS_ADMIN_SECRET) return env.DOCS_ADMIN_SECRET;
  const seed = [env.DOCS_ADMIN_PASSWORD, env.DOCS_SUPER_ADMIN_PASSWORD].filter(Boolean).join("|");
  return seed ? createHmac("sha256", "jotno-docs").update(seed).digest("hex") : null;
}

export function isAdminConfigured(env: Env = process.env): boolean {
  return Boolean(env.DOCS_ADMIN_PASSWORD || env.DOCS_SUPER_ADMIN_PASSWORD);
}

function safeEqual(a: string, b: string): boolean {
  // Hash both sides first so lengths match and timing reveals nothing
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function roleForPassword(password: string, env: Env = process.env): DocsRole | null {
  if (!password) return null;
  if (env.DOCS_SUPER_ADMIN_PASSWORD && safeEqual(password, env.DOCS_SUPER_ADMIN_PASSWORD)) return "super_admin";
  if (env.DOCS_ADMIN_PASSWORD && safeEqual(password, env.DOCS_ADMIN_PASSWORD)) return "admin";
  return null;
}

export function signSession(session: DocsAdminSession, env: Env = process.env): string | null {
  const key = signingKey(env);
  if (!key) return null;
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined, env: Env = process.env, now = Date.now()): DocsAdminSession | null {
  const key = signingKey(env);
  if (!token || !key) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as DocsAdminSession;
    if (s.role !== "admin" && s.role !== "super_admin") return null;
    if (typeof s.exp !== "number" || s.exp < now) return null;
    return s;
  } catch {
    return null;
  }
}

/** Reads the session from Next's cookie store. Server-only. */
export async function getAdminSession(): Promise<DocsAdminSession | null> {
  const { cookies } = await import("next/headers");
  return verifySession(cookies().get(DOCS_ADMIN_COOKIE)?.value);
}
