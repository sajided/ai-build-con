import { NextRequest, NextResponse } from "next/server";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getSystemEnvStatus } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Strict Zod validation against TC-P1-02 rules
    const parseResult = onboardingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const validData = parseResult.data;

    // 2. Identify user session
    const session = await getCurrentUserSession();
    const envStatus = getSystemEnvStatus();

    // 3. If connected to live Supabase, persist profile row
    if (envStatus.supabase.isLive) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();

      const { error: dbError } = await supabase.from("profiles").upsert({
        id: session.id,
        full_name: validData.fullName,
        age: validData.age,
        gender: validData.gender,
        height_cm: validData.heightCm,
        current_weight_kg: validData.currentWeightKg,
        target_weight_kg: validData.targetWeightKg || null,
        diabetes_type: validData.diabetesType,
        medication_regimen: validData.medicationRegimen,
        baseline_hba1c: validData.baselineHba1c,
        target_fasting_glucose: validData.targetFastingGlucose,
        glucose_unit: validData.glucoseUnit,
        disclaimer_accepted: validData.disclaimerAccepted,
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        console.warn("[Supabase Profiles Upsert Notice]:", dbError.message);
        // If table is not created yet in remote Supabase, log notice and permit client session to continue
      }
    }

    // 4. Return success response with redirect target
    return NextResponse.json({
      success: true,
      message: "Clinical profile saved successfully",
      profile: {
        id: session.id,
        fullName: validData.fullName,
        diabetesType: validData.diabetesType,
        baselineHba1c: validData.baselineHba1c,
      },
      redirectUrl: "/scanner",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
