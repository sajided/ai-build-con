import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAvailability, type DocsAvailability } from "./access";
import { getAdminSession, type DocsAdminSession, type DocsRole } from "./admin-auth";
import { getVisibility, MigrationMissingError, StorageUnavailableError } from "./store";

/** Server helpers shared by the /docs page and its API routes. */

export async function docsAccess(): Promise<{ availability: DocsAvailability; admin: DocsAdminSession | null; canView: boolean }> {
  const [visibility, admin] = await Promise.all([getVisibility(), getAdminSession()]);
  const availability = evaluateAvailability(visibility);
  // Admins can always preview, even outside the window
  return { availability, admin, canView: availability.open || Boolean(admin) };
}

export async function requireAdmin(min: DocsRole = "admin"): Promise<DocsAdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Sign in as a docs admin." }, { status: 401 });
  if (min === "super_admin" && session.role !== "super_admin") {
    return NextResponse.json({ error: "Only a super admin can do this." }, { status: 403 });
  }
  return session;
}

export function storageError(err: unknown): NextResponse {
  if (err instanceof StorageUnavailableError || err instanceof MigrationMissingError) return NextResponse.json({ error: err.message }, { status: 503 });
  return NextResponse.json({ error: err instanceof Error ? err.message : "Save failed." }, { status: 500 });
}

const memberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120),
  email: z.string().trim().email().max(200).optional().or(z.literal("").transform(() => undefined)),
  photo: z
    .string()
    .trim()
    .max(500)
    .regex(/^(\/|https:\/\/)/, "Photo must be a /public path or an https URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

const sectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,48}$/),
  group: z.enum(["pitch", "technical"]),
  title: z.string().trim().min(1).max(120),
  body: z.string().max(40_000),
  live: z.enum(["status", "features", "api", "team", "changelog", "analytics"]).optional(),
  hidden: z.boolean().optional(),
});

export const contentSchema = z.object({
  teamName: z.string().trim().max(120),
  tagline: z.string().trim().max(400),
  team: z.array(memberSchema).max(20),
  sections: z
    .array(sectionSchema)
    .max(60)
    .refine((s) => new Set(s.map((x) => x.id)).size === s.length, "Section ids must be unique"),
});
