import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, storageError } from "@/lib/docs/guard";
import { listVersions, restoreVersion } from "@/lib/docs/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ versions: await listVersions() });
}

/** POST { id } restores a version and publishes it. Super admin only. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin("super_admin");
  if (admin instanceof NextResponse) return admin;
  const { id } = await req.json().catch(() => ({}));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Version id is required." }, { status: 400 });
  try {
    await restoreVersion(id, admin.role);
  } catch (err) {
    return storageError(err);
  }
  return NextResponse.json({ ok: true });
}
