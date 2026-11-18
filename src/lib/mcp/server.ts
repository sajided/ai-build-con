import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { evaluateClinicalSafety, STANDARDIZED_CLINICAL_REFUSAL } from "@/lib/safety/guardrails";
import { BANGLA_CLINICAL_REFUSAL, isUnsafeRequest } from "@/lib/assistant/safety";
import { classifyGlucose, readingFeedbackBn, LEVEL_LABELS_BN } from "@/lib/assistant/bangla";
import { auditMenuItem } from "@/lib/ai/menu-auditor";
import { queryNutritionSources } from "@/lib/rag/nutrition-fetcher";
import { buildDeficiencyAnalysis, BAZAAR_STAPLES_CATALOG } from "@/lib/nutrition/deficiency-engine";
import { API_ENDPOINTS } from "@/lib/docs/registry";
import { featureStates } from "@/lib/docs/live";
import { getContent } from "@/lib/docs/store";
import { plainText, visibleSections } from "@/lib/docs/markdown";
import { getSystemEnvStatus } from "@/lib/env";

/**
 * Jotno MCP server: exposes Jotno's deterministic diabetes-safety engines and its live docs
 * to any MCP client (Claude Code, Claude Desktop, IDE agents).
 *
 * Every tool is read-only, stores nothing, takes no personal data and never calls an LLM,
 * so the public endpoint cannot leak patient data or burn AI quota.
 */

export const MCP_SERVER_INFO = { name: "jotno", version: "1.0.0" } as const;
const BDT_PER_USD = 120; // same rate as src/lib/pricing/cost-estimator.ts

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true } as const;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const LEVEL_EN = {
  low: "Low: below 3.9 mmol/L. Emergency help screen.",
  good: "In target (up to 7.8 mmol/L).",
  slightly_high: "Slightly high (7.8 to 10 mmol/L).",
  high: "High (10 to 16.7 mmol/L).",
  very_high: "Very high: 16.7 mmol/L or above. Emergency help screen.",
} as const;

export function createJotnoMcpServer(): McpServer {
  const server = new McpServer(MCP_SERVER_INFO, {
    instructions:
      "Jotno is a voice-first Bangla diabetes companion for elderly people. These tools run Jotno's deterministic safety and " +
      "nutrition rules. They never give medicine doses: if a user asks about doses, call check_medication_safety and relay its refusal. " +
      "Glucose is in mmol/L unless stated (Bangladesh standard).",
  });

  // ───────── Safety ─────────

  server.registerTool(
    "check_medication_safety",
    {
      title: "Check a message for medicine-dose requests",
      description:
        "Runs Jotno's English + Bangla clinical guardrail. Returns whether the message asks for an insulin/tablet dose or a change to medication, " +
        "and the refusal Jotno would give. Use before answering any medication question.",
      inputSchema: { text: z.string().min(1).max(2000).describe("The user's message, in Bangla or English") },
      annotations: { title: "Medication safety check", ...READ_ONLY },
    },
    async ({ text }) => {
      const en = evaluateClinicalSafety(text);
      const blocked = en.isBlocked || isUnsafeRequest(text);
      return json({
        blocked,
        category: en.isBlocked ? en.category : blocked ? "medication_adjustment" : "safe",
        reason: en.reason ?? (blocked ? "Bangla dosing or medication-change request" : null),
        refusal: blocked ? { en: STANDARDIZED_CLINICAL_REFUSAL, bn: BANGLA_CLINICAL_REFUSAL } : null,
      });
    }
  );

  server.registerTool(
    "classify_glucose",
    {
      title: "Classify a blood-sugar reading",
      description:
        "Applies Jotno's fixed clinical thresholds to one reading. Returns the band, whether Jotno would open its emergency help screen " +
        "(< 3.9 or >= 16.7 mmol/L), and the spoken Bangla feedback. Never gives medication advice.",
      inputSchema: {
        value: z.number().positive().max(600).describe("The reading"),
        unit: z.enum(["mmol/L", "mg/dL"]).default("mmol/L"),
      },
      annotations: { title: "Glucose classification", ...READ_ONLY },
    },
    async ({ value, unit }) => {
      const mmol = unit === "mg/dL" ? Number((value / 18).toFixed(1)) : value;
      const level = classifyGlucose(mmol <= 35 ? mmol : mmol * 18);
      return json({
        mmol_per_l: mmol,
        mg_per_dl: Math.round(mmol * 18),
        level,
        level_bn: LEVEL_LABELS_BN[level],
        meaning: LEVEL_EN[level],
        emergency: level === "low" || level === "very_high",
        spoken_feedback_bn: readingFeedbackBn(mmol),
      });
    }
  );

  // ───────── Food ─────────

  server.registerTool(
    "audit_menu_dishes",
    {
      title: "Audit restaurant dishes for hidden sugar and starch",
      description:
        "Runs Jotno's deterministic menu auditor (Bangladeshi high-GI traps such as biryani, kacchi, porota, mishti, plus sauces and frying). " +
        "Returns a risk rating, the traps found, and a waiter request for each dish. No AI involved.",
      inputSchema: { dishes: z.array(z.string().min(1).max(120)).min(1).max(30).describe("Dish names as written on the menu") },
      annotations: { title: "Menu audit", ...READ_ONLY },
    },
    async ({ dishes }) => {
      const items = dishes.map((d) => auditMenuItem(d));
      return json(
        items.map((i) => ({
          dish: i.dish_name,
          risk: i.risk_category,
          glycemic_impact: i.glycemic_impact,
          traps: i.flagged_traps,
          safe_elements: i.safe_elements,
          why: i.clinical_rationale,
          waiter_script: i.waiter_script,
          swap: i.suggested_side_swap ?? null,
        }))
      );
    }
  );

  server.registerTool(
    "lookup_nutrition",
    {
      title: "Look up verified nutrition for a food",
      description:
        "Jotno's corrective retrieval chain: curated South Asian staples knowledge base, then Open Food Facts, then USDA FoodData Central. " +
        "Returns per-serving macros with GI/GL estimates and the source used.",
      inputSchema: { food: z.string().min(2).max(80).describe("Food name, e.g. 'bitter gourd', 'red lentils', 'white rice'") },
      annotations: { title: "Nutrition lookup", ...READ_ONLY, openWorldHint: true },
    },
    async ({ food }) => {
      const results = await queryNutritionSources(food);
      return json(results.length ? results : { found: false, food });
    }
  );

  server.registerTool(
    "analyze_fiber_gap",
    {
      title: "Find a weekly nutrition gap and cheap local fixes",
      description:
        "Jotno's rule-based nutrition engine. Given 7-day daily averages, returns the fibre gap against the 30 g/day target, " +
        "other nutrient metrics, and low-cost local Bangladeshi foods priced in Taka.",
      inputSchema: {
        daily_fiber_g: z.number().min(0).max(150),
        magnesium_mg: z.number().min(0).max(2000).optional(),
        protein_g: z.number().min(0).max(400).optional(),
        carbs_g: z.number().min(0).max(1000).optional(),
      },
      annotations: { title: "Nutrition gap analysis", ...READ_ONLY },
    },
    async ({ daily_fiber_g, magnesium_mg, protein_g, carbs_g }) => {
      const a = buildDeficiencyAnalysis(daily_fiber_g, magnesium_mg, protein_g, carbs_g);
      return json({
        ...a,
        // The catalogue stores USD; elders shop in Taka
        recommendations: a.recommendations.map((r) => ({
          ...r,
          approx_price_bdt: `৳${Math.round(r.pricePerUnit * BDT_PER_USD)}/${r.unit}`,
        })),
        price_note: `Prices are converted from the catalogue at ${BDT_PER_USD} BDT/USD and are estimates.`,
      });
    }
  );

  // ───────── Product / docs ─────────

  server.registerTool(
    "get_feature_status",
    {
      title: "Live Jotno feature status",
      description: "Every Jotno feature with its live state on this deployment (live / beta / fallback / planned) and its offline fallback.",
      inputSchema: {},
      annotations: { title: "Feature status", ...READ_ONLY },
    },
    async () => {
      const env = getSystemEnvStatus();
      return json(featureStates({ gemini: env.gemini.isLive, supabase: env.supabase.isLive }));
    }
  );

  server.registerTool(
    "get_api_reference",
    {
      title: "Jotno HTTP API reference",
      description: "All of Jotno's HTTP endpoints with methods, auth model and purpose (kept in sync with the code by a test).",
      inputSchema: {},
      annotations: { title: "API reference", ...READ_ONLY },
    },
    async () => json(API_ENDPOINTS)
  );

  server.registerTool(
    "search_docs",
    {
      title: "Search the Jotno docs",
      description: "Full-text search over the published /docs pitch and technical documentation. Read a hit with the jotno://docs/{id} resource.",
      inputSchema: { query: z.string().min(2).max(100) },
      annotations: { title: "Docs search", ...READ_ONLY },
    },
    async ({ query }) => {
      const q = query.toLowerCase();
      const content = await getContent("published");
      const hits = visibleSections(content)
        .map((s) => ({ s, text: plainText(s.body) }))
        .filter(({ s, text }) => s.title.toLowerCase().includes(q) || text.toLowerCase().includes(q))
        .map(({ s, text }) => {
          const i = text.toLowerCase().indexOf(q);
          return { id: s.id, title: s.title, part: s.group, uri: `jotno://docs/${s.id}`, snippet: i >= 0 ? text.slice(Math.max(0, i - 60), i + 140) : text.slice(0, 160) };
        });
      return json(hits);
    }
  );

  // ───────── Resources ─────────

  server.registerResource(
    "docs-section",
    new ResourceTemplate("jotno://docs/{id}", {
      list: async () => {
        const content = await getContent("published");
        return {
          resources: visibleSections(content).map((s) => ({
            uri: `jotno://docs/${s.id}`,
            name: s.title,
            description: `${s.group === "pitch" ? "Pitch" : "Technical"}: ${s.title}`,
            mimeType: "text/markdown",
          })),
        };
      },
    }),
    { title: "Jotno docs section", description: "One section of the published /docs as Markdown", mimeType: "text/markdown" },
    async (uri, { id }) => {
      const content = await getContent("published");
      const s = visibleSections(content).find((x) => x.id === String(id));
      if (!s) throw new Error(`No docs section "${id}"`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: `# ${s.title}\n\n${s.body}` }] };
    }
  );

  server.registerResource(
    "bazaar-catalog",
    "jotno://catalog/bazaar",
    { title: "Low-GI bazaar catalogue", description: "Local Bangladeshi foods Jotno recommends, with nutrients and how to eat them", mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            BAZAAR_STAPLES_CATALOG.map((i) => ({ ...i, approx_price_bdt: Math.round(i.pricePerUnit * BDT_PER_USD) })),
            null,
            2
          ),
        },
      ],
    })
  );

  // ───────── Prompts ─────────

  server.registerPrompt(
    "explain_reading_bn",
    {
      title: "Explain a sugar reading to an elder, in Bangla",
      description: "Builds a prompt that explains one reading in simple, respectful Bangla using Jotno's rules, never mentioning doses.",
      argsSchema: {
        value: z.string().describe("Reading in mmol/L, e.g. 9.5"),
        context: z.string().optional().describe("fasting | post_meal | bedtime | random"),
      },
    },
    ({ value, context }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `First call classify_glucose with value=${value} (mmol/L). Then explain the result to an elderly Bangladeshi patient` +
              `${context ? ` (measured: ${context})` : ""} in at most two short, respectful Bangla sentences using "আপনি", Bangla digits and mmol/L. ` +
              `If emergency is true, tell them to call family now. Never mention any medicine dose; for medicine questions say to ask their doctor.`,
          },
        },
      ],
    })
  );

  return server;
}

export const MCP_TOOL_NAMES = [
  "check_medication_safety",
  "classify_glucose",
  "audit_menu_dishes",
  "lookup_nutrition",
  "analyze_fiber_gap",
  "get_feature_status",
  "get_api_reference",
  "search_docs",
] as const;
