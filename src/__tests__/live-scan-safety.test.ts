import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Jotno Live Scan safety: server-side clinical guard on Gemini output, a bounded time budget,
 * and demo fallback that can be switched off with SCAN_DEMO_FALLBACK=false.
 */

const h = vi.hoisted(() => ({
  geminiLive: true,
  generateContent: vi.fn(),
}));

vi.mock("@/lib/env", async (orig) => {
  const actual = await orig<typeof import("@/lib/env")>();
  return {
    ...actual,
    env: { ...actual.env, geminiApiKey: "test-key" },
    getSystemEnvStatus: () => ({
      ...actual.getSystemEnvStatus(),
      supabase: { configured: false, isLive: false, url: "" },
      gemini: { configured: h.geminiLive, isLive: h.geminiLive },
    }),
  };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: h.generateContent };
  },
}));

// Keep tests offline and fast
vi.mock("@/lib/rag/nutrition-fetcher", () => ({ queryNutritionSources: async () => [] }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => {
    throw new Error("no supabase in tests");
  },
  createClient: () => {
    throw new Error("no supabase in tests");
  },
}));

import { POST } from "@/app/api/scanner/multimodal/route";
import { guardItem, parseAndGuardMultimodalOutput, withTimeout } from "@/lib/ai/multimodal-guard";

const VALID_AI_JSON = {
  detected_type: "prepared_food",
  detected_title: "ভাত ও মাছ",
  identified_items: [
    // Model wrongly says rice is green; GI 73 must force red
    { name: "White Rice", quantity: "1 plate", gi_index: 73, net_carbs_g: 45, gl_load: 5, risk_level: "green" },
    { name: "Rui Fish Curry", quantity: "1 piece", gi_index: 0, net_carbs_g: 2, gl_load: 0, risk_level: "green" },
  ],
  nutritional_summary: { calories: 600, protein_g: 30, carbs_g: 50, fats_g: 18, fiber_g: 3, sodium_mg: 700 },
  health_risk_alerts: [],
  recipe_or_menu_suggestions: [],
  voice_assistant_response: "মাছ ভালো, ভাত কম খান।",
};

function imageRequest() {
  // JSON path (multipart bodies hang under the jsdom test environment)
  const fakeJpeg = Buffer.from(new Uint8Array(2048)).toString("base64");
  return new NextRequest("http://localhost:3000/api/scanner/multimodal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_mode: "auto", imageBase64: `data:image/jpeg;base64,${fakeJpeg}` }),
  });
}

function presetRequest(preset: string) {
  return new NextRequest("http://localhost:3000/api/scanner/multimodal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preset, query: "Is this safe?" }),
  });
}

beforeEach(() => {
  h.geminiLive = true;
  h.generateContent.mockReset();
});

describe("multimodal guard", () => {
  it("raises risk from GI/GL and never lowers the model's verdict", () => {
    const rice = guardItem({ name: "Rice", quantity: "", gi_index: 73, risk_level: "green" });
    expect(rice.item.risk_level).toBe("red");
    expect(rice.raised).toBe(true);

    // Model says red, rules say green -> stays red
    const fish = guardItem({ name: "Fish", quantity: "", gi_index: 0, gl_load: 0, risk_level: "red" });
    expect(fish.item.risk_level).toBe("red");
    expect(fish.raised).toBe(false);
  });

  it("recomputes GL from net carbs instead of trusting the model's GL", () => {
    // Model claims GL 5, but GI 60 x 40g carbs = GL 24 -> red
    const { item } = guardItem({ name: "Porota", quantity: "", gi_index: 60, net_carbs_g: 40, gl_load: 5, risk_level: "green" });
    expect(item.gl_load).toBe(24);
    expect(item.risk_level).toBe("red");
  });

  it("defaults unknown model risk to caution, not safe", () => {
    const { item } = guardItem({ name: "Something", quantity: "", gi_index: 30, gl_load: 2 });
    expect(item.risk_level).toBe("yellow");
  });

  it("rejects truncated JSON and payloads with no usable items", () => {
    const truncated = JSON.stringify(VALID_AI_JSON).slice(0, 120);
    expect(() => parseAndGuardMultimodalOutput(truncated)).toThrow();
    expect(() =>
      parseAndGuardMultimodalOutput(JSON.stringify({ ...VALID_AI_JSON, identified_items: [{ name: "x" }] }))
    ).toThrow();
  });

  it("adds a spoken Bangla warning when the guard raises an item to red", () => {
    const out = parseAndGuardMultimodalOutput("```json\n" + JSON.stringify(VALID_AI_JSON) + "\n```");
    expect(out.identified_items[0].risk_level).toBe("red");
    expect(out.voice_assistant_response).toContain("সতর্কতা");
    expect(out.health_risk_alerts[0]).toContain("White Rice");
  });

  it("withTimeout resolves to the fallback when the work is too slow or fails", async () => {
    const slow = new Promise<string>((r) => setTimeout(() => r("late"), 200));
    await expect(withTimeout(slow, 10, "fallback")).resolves.toBe("fallback");
    await expect(withTimeout(Promise.reject(new Error("x")), 50, "fallback")).resolves.toBe("fallback");
    await expect(withTimeout(Promise.resolve("ok"), 0, "fallback")).resolves.toBe("fallback");
  });
});

describe("POST /api/scanner/multimodal", () => {
  it("returns guarded live results for a real photo", async () => {
    h.generateContent.mockResolvedValue({ text: JSON.stringify(VALID_AI_JSON) });
    const res = await POST(imageRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isLive).toBe(true);
    expect(json.isSample).toBe(false);
    expect(json.data.identified_items[0].risk_level).toBe("red");
  });

  it("demo mode: falls back to a flagged sample result when Gemini output is truncated", async () => {
    h.generateContent.mockResolvedValue({ text: JSON.stringify(VALID_AI_JSON).slice(0, 150) });
    const res = await POST(imageRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isLive).toBe(false);
    expect(json.isSample).toBe(true);
    expect(json.data.identified_items.length).toBeGreaterThan(0);
    expect(h.generateContent).toHaveBeenCalledTimes(2); // tried both candidate models first
  });

  it("demo mode: falls back to a flagged sample result when Gemini is not configured", async () => {
    h.geminiLive = false;
    const res = await POST(imageRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isSample).toBe(true);
    expect(h.generateContent).not.toHaveBeenCalled();
  });

  it("production mode (SCAN_DEMO_FALLBACK=false): returns an error instead of sample data", async () => {
    vi.stubEnv("SCAN_DEMO_FALLBACK", "false");
    vi.resetModules();
    try {
      const { POST: prodPOST } = await import("@/app/api/scanner/multimodal/route");
      h.generateContent.mockResolvedValue({ text: "{ not json" });
      const res = await prodPOST(imageRequest());
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json.code).toBe("AI_UNAVAILABLE");
      expect(json.data).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("labels sample results when the user explicitly picks a sample preset", async () => {
    const res = await POST(presetRequest("mock-cooked-meal"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isSample).toBe(true);
    expect(json.isLive).toBe(false);
    expect(h.generateContent).not.toHaveBeenCalled();
  });

  it("asks Gemini for enough output tokens and passes an abort signal", async () => {
    h.generateContent.mockResolvedValue({ text: JSON.stringify(VALID_AI_JSON) });
    await POST(imageRequest());
    const config = h.generateContent.mock.calls[0][0].config;
    expect(config.maxOutputTokens).toBeGreaterThanOrEqual(4096);
    expect(config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it("stops retrying once the shared time budget is spent", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    try {
      // Every call hangs until aborted
      h.generateContent.mockImplementation(
        ({ config }: { config: { abortSignal: AbortSignal } }) =>
          new Promise((_, reject) => config.abortSignal.addEventListener("abort", () => reject(new Error("aborted"))))
      );
      const pending = POST(imageRequest());
      await vi.advanceTimersByTimeAsync(30000);
      const res = await pending;

      expect(res.status).toBe(200); // demo fallback after both attempts time out
      // 12s first model + up to 9s second model fits in the 21s budget; no third attempt
      expect(h.generateContent).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
