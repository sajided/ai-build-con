import { NextRequest, NextResponse } from "next/server";
import {
  DOCS_ADMIN_COOKIE,
  SESSION_TTL_MS,
  getAdminSession,
  isAdminConfigured,
  roleForPassword,
  signSession,
} from "@/lib/docs/admin-auth";
import { storageStatus } from "@/lib/docs/store";

export const dynamic = "force-dynamic";

// Slow down password guessing on a warm instance
const failures = new Map<string, { count: number; until: number }>();

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({ session, configured: isAdminConfigured(), storage: await storageStatus() });
}

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin sign-in is off. Set DOCS_ADMIN_PASSWORD on the server." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const f = failures.get(ip);
  if (f && f.until > Date.now()) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  const role = roleForPassword(typeof password === "string" ? password : "");
  if (!role) {
    const count = (f?.count ?? 0) + 1;
    failures.set(ip, { count, until: count >= 5 ? Date.now() + 60_000 : 0 });
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  failures.delete(ip);

  const session = { role, exp: Date.now() + SESSION_TTL_MS };
  const token = signSession(session)!;
  const res = NextResponse.json({ session });
  res.cookies.set(DOCS_ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DOCS_ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
