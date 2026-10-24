import {
  bazaarScanResponseSchema,
  type BazaarScanResponse,
  type ScannedItem,
} from "@/lib/validations/scanner";

/**
 * Sanitizes raw text from LLMs, stripping Markdown fences and repairing formatting.
 * Strictly adheres to TC-P2-01 requirement for resilient payload extraction.
 */
export function sanitizeJson(raw: string): string {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty or non-string input provided for JSON sanitization");
  }

  let cleaned = raw.trim();

  // 1. Remove markdown code fence blocks: ```json ... ``` or ``` ... ```
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
    cleaned = cleaned.trim();
  }

  // 2. Extract substring between first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Strip trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
}

/**
 * Calculates Glycemic Load based on clinical formula:
 * GL = (GI * Net Carbs) / 100
 */
export function calculateGlycemicLoad(gi: number, netCarbs: number): number {
  if (gi <= 0 || netCarbs <= 0) return 0;
  return Number(((gi * netCarbs) / 100).toFixed(1));
}

/**
 * Evaluates clinical risk category strictly according to TC-P2-02:
 * - Green (Safe): GI < 55 and GL <= 10
 * - Yellow (Caution): GI 56-69 or GL 11-19
 * - Red (High Spike): GI >= 70 or GL >= 20
 *
 * Hard Failure Condition: Any item with GI >= 75 classified as "Green" is strictly blocked.
 */
export function evaluateRiskCategory(gi: number, gl: number): "green" | "yellow" | "red" {
  if (gi >= 70 || gl >= 20) {
    return "red";
  }
  if (gi < 55 && gl <= 10) {
    return "green";
  }
  return "yellow";
}

/**
 * Enforces clinical guardrails on scanned items:
 * Recalculates GL and overrides risk category if the generative model misclassified it.
 */
export function enforceClinicalGuard(item: ScannedItem): ScannedItem {
  // Hard clinical check: GI >= 75 can NEVER be green
  if (item.glycemic_index >= 75 && item.risk_category === "green") {
    console.warn(
      `[Clinical Guardrail Override] Item "${item.item_name}" has GI ${item.glycemic_index} >= 75 but was classified as Green. Promoting to Red.`
    );
  }

  // Calculate precise clinical GL
  const calculatedGl = calculateGlycemicLoad(item.glycemic_index, item.net_carbs_g);
  const clinicalCategory = evaluateRiskCategory(item.glycemic_index, calculatedGl);

  return {
    ...item,
    glycemic_load: calculatedGl,
    risk_category: clinicalCategory,
  };
}

/**
 * Parses and validates raw LLM output into typed BazaarScanResponse.
 */
export function parseAndValidateBazaarResponse(rawOutput: string): BazaarScanResponse {
  const sanitized = sanitizeJson(rawOutput);
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(sanitized);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Malformed JSON syntax";
    throw new Error(`JSON Sanitizer could not recover valid JSON: ${msg}`);
  }

  // First pass through schema
  const validated = bazaarScanResponseSchema.parse(parsed);

  // Apply deterministic clinical guardrail to every scanned item (TC-P2-02)
  const guardedItems = validated.scanned_items.map((item) => enforceClinicalGuard(item));

  return {
    ...validated,
    scanned_items: guardedItems,
  };
}
