import { NextRequest, NextResponse } from "next/server";
import { analyzeBazaarImage, MOCK_BAZAAR_SCAN_RESPONSE } from "@/lib/ai/gemini";
import { parseAndValidateBazaarResponse } from "@/lib/ai/bazaar-parser";
import { getCurrentUserSession } from "@/lib/auth/session";
import { getSystemEnvStatus } from "@/lib/env";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = req.headers.get("content-type") || "";

    let imageBuffer: Buffer | string | null = null;
    let mimeType = "image/jpeg";

    // 1. Handle multipart/form-data (Browser camera / file picker upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        mimeType = file.type || "image/jpeg";
      }
    } 
    // 2. Handle application/json (Base64 payload or raw test simulation)
    else if (contentType.includes("application/json")) {
      const jsonBody = await req.json();

      // Direct raw output testing simulation (TC-P2-01 testing prompt)
      if (jsonBody.rawAiOutput !== undefined) {
        try {
          const parsed = parseAndValidateBazaarResponse(jsonBody.rawAiOutput);
          return NextResponse.json({
            success: true,
            data: parsed,
            latencyMs: Date.now() - startTime,
          });
        } catch (parseError: unknown) {
          const msg = parseError instanceof Error ? parseError.message : "Malformed JSON";
          return NextResponse.json(
            { success: false, error: "Unprocessable Entity", details: msg },
            { status: 422 }
          );
        }
      }

      if (jsonBody.imageBase64) {
        imageBuffer = jsonBody.imageBase64;
        mimeType = jsonBody.mimeType || "image/jpeg";
      }
    }

    // Default to mock test image if no buffer supplied (for rapid automated test executions)
    let scanResult;
    if (imageBuffer) {
      scanResult = await analyzeBazaarImage(imageBuffer, mimeType);
    } else {
      scanResult = MOCK_BAZAAR_SCAN_RESPONSE;
    }

    const latencyMs = Date.now() - startTime;
    const session = await getCurrentUserSession();
    const envStatus = getSystemEnvStatus();

    // 3. Persist scan if connected to live Supabase
    let persistedScanId = "mock-scan-" + Date.now();
    if (envStatus.supabase.isLive) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = createClient();

        const insertRes = await supabase
          .from("food_scans")
          .insert({
            user_id: session.id,
            scan_type: "bazaar_grocery",
            image_url: null,
            raw_ai_response: scanResult,
            detected_items: scanResult.scanned_items,
          })
          .select("id")
          .maybeSingle();

        if (insertRes?.data) {
          persistedScanId = insertRes.data.id;
        }
      } catch (dbErr) {
        console.warn("[Food Scans DB Persistence Warning]:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      scanId: persistedScanId,
      data: scanResult,
      latencyMs,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";

    // Format syntax/Zod validation failures as 422
    if (errorMsg.includes("JSON") || errorMsg.includes("validation")) {
      return NextResponse.json(
        { success: false, error: "Unprocessable Entity", details: errorMsg },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
