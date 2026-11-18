import { NextResponse } from "next/server";
import { docsAccess } from "@/lib/docs/guard";
import { getLiveSnapshot } from "@/lib/docs/live";
import { getContent } from "@/lib/docs/store";
import { toMarkdownDocument } from "@/lib/docs/markdown";

export const dynamic = "force-dynamic";

/** GET /api/docs/export → the published docs as a Markdown file. */
export async function GET() {
  const { canView } = await docsAccess();
  if (!canView) return NextResponse.json({ error: "Docs are not available right now." }, { status: 403 });
  const [content, live] = await Promise.all([getContent("published"), getLiveSnapshot()]);
  return new NextResponse(toMarkdownDocument(content, live), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jotno-docs.md"',
      "Cache-Control": "no-store",
    },
  });
}
