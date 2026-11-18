import { NextRequest, NextResponse } from "next/server";
import { contentSchema, requireAdmin, storageError } from "@/lib/docs/guard";
import { getContent, publish, saveDraft, storageStatus } from "@/lib/docs/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const [draft, published] = await Promise.all([getContent("draft"), getContent("published")]);
  return NextResponse.json({ draft, published, storage: await storageStatus(), role: admin.role });
}

/** PUT { action: "save" | "publish", content, note? } */
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const body = await req.json().catch(() => ({}));
  const parsed = contentSchema.safeParse(body.content);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid content." }, { status: 400 });
  }
  try {
    if (body.action === "publish") {
      const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 200) : null;
      await publish(parsed.data, admin.role, note);
    } else {
      await saveDraft(parsed.data, admin.role);
    }
  } catch (err) {
    return storageError(err);
  }
  return NextResponse.json({ ok: true, action: body.action === "publish" ? "published" : "saved" });
}
