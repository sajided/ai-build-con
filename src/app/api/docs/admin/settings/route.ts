import { NextRequest, NextResponse } from "next/server";
import { evaluateAvailability, validateVisibility, windowFromDuration } from "@/lib/docs/access";
import { requireAdmin, storageError } from "@/lib/docs/guard";
import { getVisibility, saveVisibility, storageStatus } from "@/lib/docs/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const visibility = await getVisibility();
  return NextResponse.json({ visibility, availability: evaluateAvailability(visibility), storage: await storageStatus() });
}

/** PUT { enabled, startAt, endAt, timeZone } or { enabled, durationHours } */
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const body = await req.json().catch(() => ({}));

  let input = body;
  if (typeof body.durationHours === "number") {
    if (!(body.durationHours > 0 && body.durationHours <= 24 * 365)) {
      return NextResponse.json({ error: "Duration must be between 1 hour and 1 year." }, { status: 400 });
    }
    input = { ...body, ...windowFromDuration(body.durationHours) };
  }
  const parsed = validateVisibility(input);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await saveVisibility(parsed.value, admin.role);
  } catch (err) {
    return storageError(err);
  }
  return NextResponse.json({ visibility: parsed.value, availability: evaluateAvailability(parsed.value) });
}
