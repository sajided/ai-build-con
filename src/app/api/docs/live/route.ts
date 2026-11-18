import { NextResponse } from "next/server";
import { docsAccess } from "@/lib/docs/guard";
import { getLiveSnapshot } from "@/lib/docs/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const { canView } = await docsAccess();
  if (!canView) return NextResponse.json({ error: "Docs are not available right now." }, { status: 403 });
  return NextResponse.json(await getLiveSnapshot(), { headers: { "Cache-Control": "no-store" } });
}
