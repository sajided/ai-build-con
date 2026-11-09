import { z } from "zod";
import { calculateGlycemicLoad, evaluateRiskCategory, sanitizeJson } from "@/lib/ai/bazaar-parser";

/**
 * Server-side validation and clinical guard for Jotno Live Scan (Gemini multimodal) output.
 *
 * The model's JSON is never trusted as-is:
 * - malformed/partial payloads are rejected (caller must show an error, never sample data)
 * - GL is recomputed from net carbs when available
 * - risk can only be RAISED by the deterministic GI/GL rules, never lowered
 */

export type RiskLevel = "green" | "yellow" | "red";

const RISK_RANK: Record<RiskLevel, number> = { green: 0, yellow: 1, red: 2 };

export function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b;
}

const nonNegNumber = z.coerce.number().finite().nonnegative();

const rawItemSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.string().catch(""),
  category: z.string().optional().catch(undefined),
  gi_index: nonNegNumber.max(150),
  gl_load: nonNegNumber.optional().catch(undefined),
  net_carbs_g: nonNegNumber.optional().catch(undefined),
  risk_level: z.enum(["green", "yellow", "red"]).optional().catch(undefined),
});

const rawOutputSchema = z.object({
  detected_type: z.enum(["grocery_bazaar", "restaurant_menu", "prepared_food"]).optional().catch(undefined),
  detected_title: z.string().optional().catch(undefined),
  identified_items: z.array(z.unknown()).catch([]),
  nutritional_summary: z
    .object({
      calories: nonNegNumber.catch(0),
      protein_g: nonNegNumber.catch(0),
      carbs_g: nonNegNumber.catch(0),
      fats_g: nonNegNumber.catch(0),
      fiber_g: nonNegNumber.catch(0),
      sodium_mg: nonNegNumber.catch(0),
    })
    .catch({ calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, fiber_g: 0, sodium_mg: 0 }),
  health_risk_alerts: z.array(z.string()).catch([]),
  recipe_or_menu_suggestions: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string().catch(""),
        missing_ingredients: z.array(z.string()).optional().catch(undefined),
        estimated_budget_level: z.enum(["low", "moderate", "high"]).catch("moderate"),
      })
    )
    .catch([]),
  waiter_script: z.string().optional().catch(undefined),
  plate_sequencing: z
    .array(z.object({ step: z.coerce.number(), phase: z.string(), instruction: z.string() }))
    .optional()
    .catch(undefined),
  voice_assistant_response: z.string().trim().min(1),
});

export interface GuardedItem {
  name: string;
  quantity: string;
  category?: string;
  gi_index: number;
  gl_load: number;
  net_carbs_g?: number;
  risk_level: RiskLevel;
}

export type GuardedOutput = Omit<z.infer<typeof rawOutputSchema>, "identified_items"> & {
  identified_items: GuardedItem[];
};

/** Applies deterministic GI/GL rules; model risk can only be raised. */
export function guardItem(item: z.infer<typeof rawItemSchema>): { item: GuardedItem; raised: boolean } {
  const gl =
    item.net_carbs_g !== undefined
      ? calculateGlycemicLoad(item.gi_index, item.net_carbs_g)
      : item.gl_load;

  // Without a GL we can still apply the GI thresholds; unknown risk defaults to caution.
  const ruleRisk: RiskLevel =
    gl !== undefined
      ? evaluateRiskCategory(item.gi_index, gl)
      : item.gi_index >= 70
      ? "red"
      : item.gi_index >= 55
      ? "yellow"
      : "green";

  const modelRisk: RiskLevel = item.risk_level ?? "yellow";
  const finalRisk = maxRisk(modelRisk, ruleRisk);

  return {
    item: {
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      gi_index: item.gi_index,
      gl_load: gl ?? 0,
      net_carbs_g: item.net_carbs_g,
      risk_level: finalRisk,
    },
    raised: RISK_RANK[finalRisk] > RISK_RANK[modelRisk],
  };
}

/**
 * Parses raw model text into a validated, clinically guarded output.
 * Throws if the payload is unusable — the caller must surface an error, not sample data.
 */
export function parseAndGuardMultimodalOutput(rawText: string): GuardedOutput {
  const parsed: unknown = JSON.parse(sanitizeJson(rawText));
  const out = rawOutputSchema.parse(parsed);

  const raisedToRed: string[] = [];
  const items: GuardedItem[] = [];
  for (const candidate of out.identified_items) {
    const res = rawItemSchema.safeParse(candidate);
    if (!res.success) continue; // drop items we cannot risk-rate
    const { item, raised } = guardItem(res.data);
    if (raised && item.risk_level === "red") raisedToRed.push(item.name);
    items.push(item);
  }

  if (items.length === 0) {
    throw new Error("Model returned no usable food items");
  }

  const alerts = [...out.health_risk_alerts];
  let voice = out.voice_assistant_response;
  if (raisedToRed.length > 0) {
    alerts.unshift(
      `Safety check raised to high risk (GI/GL): ${raisedToRed.join(", ")}. Eat only a small portion, last.`
    );
    voice = `${voice} সতর্কতা: ${raisedToRed.join(", ")} রক্তে সুগার দ্রুত বাড়াতে পারে, খুব অল্প খাবেন।`;
  }

  return { ...out, identified_items: items, health_risk_alerts: alerts, voice_assistant_response: voice };
}

/** Resolves to `fallback` if `promise` does not settle within `ms` (or rejects). */
export async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  if (ms <= 0) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.catch(() => fallback),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
