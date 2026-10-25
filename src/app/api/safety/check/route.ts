import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  evaluateClinicalSafety,
  STANDARDIZED_CLINICAL_REFUSAL,
} from '@/lib/safety/guardrails';

const safetyCheckRequestSchema = z.object({
  query: z.string().min(1, 'Query string cannot be empty'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = safetyCheckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid safety check payload',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { query } = parsed.data;
    const evaluation = evaluateClinicalSafety(query);

    return NextResponse.json(
      {
        success: true,
        safe: !evaluation.isBlocked,
        blocked: evaluation.isBlocked,
        category: evaluation.category,
        reason: evaluation.reason,
        refusal: evaluation.isBlocked ? STANDARDIZED_CLINICAL_REFUSAL : null,
        containsNumericalUnits: evaluation.containsNumericalUnits,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[Safety Guardrail API Error]:', error);
    return NextResponse.json(
      {
        error: 'Internal error during clinical safety inspection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
