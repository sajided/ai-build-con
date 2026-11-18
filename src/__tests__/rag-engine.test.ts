import { describe, it, expect, beforeEach } from "vitest";
import {
  queryNutritionSources,
  queryNutritionSourcesBatch,
  buildRagPromptContext,
  clearRagCache,
  findBaselineNutrition,
} from "@/lib/rag/nutrition-fetcher";
import { GET, POST } from "@/app/api/rag/nutrition-lookup/route";
import { fallbackResult } from "@/lib/ai/elder-assistant";
import { NextRequest } from "next/server";

describe("Clinical RAG Engine & Low-Latency Grounding Suite", () => {
  beforeEach(() => {
    clearRagCache();
  });

  describe("Sub-Millisecond In-Memory Caching & Performance", () => {
    it("should resolve subsequent queries from memory cache in under 5ms", async () => {
      // Prime the cache
      const startFirst = performance.now();
      const first = await queryNutritionSources("bitter gourd");
      const durationFirst = performance.now() - startFirst;

      expect(first.length).toBeGreaterThan(0);
      expect(durationFirst).toBeLessThan(1000); // Cold run is fast

      // Second retrieval must hit the in-memory RAG cache
      const startSecond = performance.now();
      const second = await queryNutritionSources("bitter gourd");
      const durationSecond = performance.now() - startSecond;

      expect(second).toEqual(first);
      expect(durationSecond).toBeLessThan(5); // Ultra-fast sub-millisecond memory hit (< 5ms threshold)
    });

    it("should clear the cache properly with clearRagCache()", async () => {
      await queryNutritionSources("okra");
      clearRagCache();
      const res = await queryNutritionSources("okra");
      expect(res.length).toBeGreaterThan(0);
    });
  });

  describe("Bengali Diabetic Staples & Clinical Grounding", () => {
    it("identifies Bitter Gourd (Karela / Korola / Uchhe) as Green (Low GI/GL)", async () => {
      for (const name of ["bitter gourd", "karela", "korola", "uchhe"]) {
        const item = findBaselineNutrition(name);
        expect(item).toBeDefined();
        expect(item?.glycemic_index_est).toBeLessThanOrEqual(20);
        expect(item?.glycemic_load_est).toBeLessThanOrEqual(2);
        expect(item?.risk_level).toBe("green");
        expect(item?.clinical_notes).toBeDefined();
        expect(item?.clinical_notes?.length).toBeGreaterThan(10);
      }
    });

    it("identifies pulses (Masoor Dal, Moong Dal) as Green with high protein and fiber", async () => {
      const dal = findBaselineNutrition("masoor dal");
      expect(dal).toBeDefined();
      expect(dal?.protein_g).toBeGreaterThanOrEqual(8);
      expect(dal?.fiber_g).toBeGreaterThanOrEqual(6);
      expect(dal?.glycemic_index_est).toBeLessThanOrEqual(35);
      expect(dal?.risk_level).toBe("green");
    });

    it("identifies White Rice / Shada Bhaat as Red (High GI/GL)", async () => {
      const rice = findBaselineNutrition("white rice");
      expect(rice).toBeDefined();
      expect(rice?.glycemic_index_est).toBeGreaterThanOrEqual(70);
      expect(rice?.glycemic_load_est).toBeGreaterThanOrEqual(20);
      expect(rice?.risk_level).toBe("red");
      expect(rice?.pairing_advice).toContain("1/2 cup");
    });

    it("identifies Okra / Dherosh as Green with mucilage fiber buffer advice", async () => {
      const okra = findBaselineNutrition("okra");
      expect(okra).toBeDefined();
      expect(okra?.risk_level).toBe("green");
      expect(okra?.fiber_g).toBeGreaterThanOrEqual(3);
    });

    it("identifies Sweets / Mishti as Red with spike warning", async () => {
      const sweet = findBaselineNutrition("mishti");
      expect(sweet).toBeDefined();
      expect(sweet?.risk_level).toBe("red");
      expect(sweet?.sugar_g).toBeGreaterThanOrEqual(25);
    });

    it("provides clinical fallback estimation for unknown foods", async () => {
      const unk = await queryNutritionSources("unrecorded-superfood-xyz");
      expect(unk.length).toBeGreaterThan(0);
      expect(unk[0].source).toBe("estimated_clinical_model");
      expect(unk[0].calories).toBeGreaterThan(0);
    });
  });

  describe("Batch RAG Retrieval & Prompt Context Generation", () => {
    it("retrieves multiple food items in parallel via queryNutritionSourcesBatch", async () => {
      const items = ["bitter gourd", "masoor dal", "spinach", "white rice"];
      const batch = await queryNutritionSourcesBatch(items);

      expect(Object.keys(batch).length).toBe(4);
      expect(batch["bitter gourd"]).toBeDefined();
      expect(batch["bitter gourd"]?.glycemic_index_est).toBeLessThanOrEqual(20);
      expect(batch["white rice"]?.risk_level).toBe("red");
    });

    it("formats LLM prompt context with GI, GL, net carbs, and clinical advice", async () => {
      const context = await buildRagPromptContext(["bitter gourd", "white rice"]);
      expect(context).toContain("CLINICAL NUTRITION KNOWLEDGE BASE (RAG VERIFIED):");
      expect(context).toContain("Bitter Gourd");
      expect(context).toContain("White Rice");
      expect(context).toContain("GI");
      expect(context).toContain("GL");
      expect(context).toContain("Net Carbs");
    });

    it("returns empty string when items array is empty", async () => {
      const context = await buildRagPromptContext([]);
      expect(context).toBe("");
    });
  });

  describe("RAG Nutrition Lookup HTTP Endpoints", () => {
    it("handles GET /api/rag/nutrition-lookup?q=bitter gourd with latencyMs and headers", async () => {
      const req = new NextRequest("http://localhost:3000/api/rag/nutrition-lookup?q=bitter+gourd");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBeGreaterThan(0);
      expect(json.latencyMs).toBeDefined();
      expect(json.data[0].name.toLowerCase()).toContain("bitter gourd");
      expect(res.headers.get("Cache-Control")).toContain("public");
    });

    it("handles GET /api/rag/nutrition-lookup?items=karela,spinach for batch queries", async () => {
      const req = new NextRequest("http://localhost:3000/api/rag/nutrition-lookup?items=karela,spinach");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(2);
      expect(json.data["karela"]).toBeDefined();
      expect(json.data["spinach"]).toBeDefined();
    });

    it("rejects GET request without query parameters with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/rag/nutrition-lookup");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("handles POST /api/rag/nutrition-lookup with single query", async () => {
      const req = new NextRequest("http://localhost:3000/api/rag/nutrition-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "spinach" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBeGreaterThan(0);
      expect(json.data[0].name.toLowerCase()).toContain("spinach");
    });

    it("handles POST /api/rag/nutrition-lookup with batch items array", async () => {
      const req = new NextRequest("http://localhost:3000/api/rag/nutrition-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: ["karela", "masoor dal"] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(2);
      expect(json.data["karela"]).toBeDefined();
    });
  });

  describe("Elder Voice Assistant Offline Clinical RAG Grounding", () => {
    it("evaluates bitter gourd/vegetables as 'good' with Bangla guidance", () => {
      const res = fallbackResult({ mode: "food", text: "আমি কি করলা খেতে পারি?" });
      expect(res.food_verdict).toBe("good");
      expect(res.reply).toContain("করলা");
    });

    it("evaluates white rice/carbs as 'limit' with portion caution", () => {
      const res = fallbackResult({ mode: "food", text: "আমি কি ভাত খেতে পারি?" });
      expect(res.food_verdict).toBe("limit");
      expect(res.reply).toContain("ভাত");
    });

    it("evaluates sweets/sugar as 'avoid' with spike alert", () => {
      const res = fallbackResult({ mode: "food", text: "আমি মিষ্টি খাব" });
      expect(res.food_verdict).toBe("avoid");
      expect(res.reply).toContain("মিষ্টি");
    });
  });
});
