import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { glucoseLogSchema } from "@/lib/validations/telemetry";
import {
  generateTelemetrySummary,
  generateTrajectoryDataset,
  MOCK_TC_P5_01_LOGS,
} from "@/utils/telemetry";

const telemetrySummaryRequestSchema = z.object({
  logs: z.array(glucoseLogSchema).optional(),
  baselineFBS: z.number().optional().default(160),
  targetFBS: z.number().optional().default(100),
  horizonDays: z.number().optional().default(84),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = telemetrySummaryRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const {
      logs = MOCK_TC_P5_01_LOGS,
      baselineFBS,
      targetFBS,
      horizonDays,
    } = parsed.data;

    const summary = generateTelemetrySummary(logs, baselineFBS, targetFBS, horizonDays);
    const trajectoryPoints = generateTrajectoryDataset({
      logs,
      baselineFBS,
      targetFBS,
      horizonDays,
    });

    return NextResponse.json(
      {
        success: true,
        summary,
        trajectory_points: trajectoryPoints,
        logs_count: logs.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Telemetry Summary Route Error]:", error);
    return NextResponse.json(
      {
        error: "Internal server error while computing telemetry analytics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const summary = generateTelemetrySummary(MOCK_TC_P5_01_LOGS, 160, 100, 84);
  const trajectoryPoints = generateTrajectoryDataset({
    logs: MOCK_TC_P5_01_LOGS,
    baselineFBS: 160,
    targetFBS: 100,
    horizonDays: 84,
  });

  return NextResponse.json(
    {
      success: true,
      summary,
      trajectory_points: trajectoryPoints,
      logs_count: MOCK_TC_P5_01_LOGS.length,
    },
    { status: 200 }
  );
}
