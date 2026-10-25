import { NextRequest, NextResponse } from "next/server";
import { scanRestaurantMenu } from "@/lib/ai/menu-scanner";
import { evaluateClinicalSafety } from "@/lib/safety/guardrails";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let textInput: string | undefined;
    let imageBase64: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (text) {
        textInput = text;
      }

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = file.type || "image/jpeg";
        imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    } else {
      const body = await req.json();
      textInput = body.text;
      imageBase64 = body.imageBase64;
    }

    if (!textInput && !imageBase64) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Please provide either menu text or an uploaded menu image.",
        },
        { status: 400 }
      );
    }

    // TC-P7-01: Clinical Safety Guardrail Inspection
    if (textInput) {
      const safetyCheck = evaluateClinicalSafety(textInput);
      if (safetyCheck.isBlocked) {
        return NextResponse.json(
          {
            error: "Clinical Safety Violation",
            safety_refusal: safetyCheck.refusalMessage,
            reason: safetyCheck.reason,
          },
          { status: 400 }
        );
      }
    }

    const result = await scanRestaurantMenu({
      text: textInput,
      imageBase64,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[MenuSafe API Route Error]:", error);
    return NextResponse.json(
      {
        error: "Internal server error during menu scan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
