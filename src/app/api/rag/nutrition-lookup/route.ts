import { NextRequest, NextResponse } from "next/server";
import { queryNutritionSources, queryNutritionSourcesBatch } from "@/lib/rag/nutrition-fetcher";

export async function GET(req: NextRequest) {
  const start = performance.now();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || searchParams.get("query") || "";
  const itemsParam = searchParams.get("items");

  if (itemsParam) {
    const items = itemsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const batch = await queryNutritionSourcesBatch(items);
    const duration = Math.round(performance.now() - start);
    return NextResponse.json(
      {
        success: true,
        items,
        count: Object.keys(batch).length,
        latencyMs: duration,
        data: batch,
      },
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  }

  if (!query.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' or 'items' is required." }, { status: 400 });
  }

  const results = await queryNutritionSources(query);
  const duration = Math.round(performance.now() - start);
  return NextResponse.json(
    {
      success: true,
      query,
      count: results.length,
      latencyMs: duration,
      data: results,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    }
  );
}

export async function POST(req: NextRequest) {
  const start = performance.now();
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? (body.items as string[]) : null;
    const query = body.query || body.q || "";

    if (items && items.length > 0) {
      const batch = await queryNutritionSourcesBatch(items);
      const duration = Math.round(performance.now() - start);
      return NextResponse.json({
        success: true,
        items,
        count: Object.keys(batch).length,
        latencyMs: duration,
        data: batch,
      });
    }

    if (!query.trim()) {
      return NextResponse.json({ error: "Query string 'q' or array 'items' is required." }, { status: 400 });
    }

    const results = await queryNutritionSources(query);
    const duration = Math.round(performance.now() - start);
    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      latencyMs: duration,
      data: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
