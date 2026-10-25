import { NextRequest, NextResponse } from "next/server";
import { glucoseLogSchema } from "@/lib/validations/telemetry";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = glucoseLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid glucose log payload",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const logData = parsed.data;

    // Optional Supabase DB persistence
    const user = await getCurrentUser();
    if (user && !user.isDemo) {
      try {
        const supabase = createClient();
        await supabase.from("glucose_logs").insert({
          user_id: user.id,
          glucose_value: logData.glucose_value,
          context: logData.context,
          measured_at: logData.measured_at,
          notes: logData.notes,
          linked_meal_title: logData.linked_meal_title,
          day_offset: logData.day_offset,
        });
      } catch (err: unknown) {
        console.warn("[Telemetry DB Insert Notice - Handled Gracefully]:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        log: logData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Telemetry Log API Error]:", error);
    return NextResponse.json(
      {
        error: "Internal server error while logging glucose reading",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
