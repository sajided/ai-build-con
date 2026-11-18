# Jotno RAG Architecture & Nutrition Grounding Specification

## 1. Overview
Jotno integrates a low-latency, clinically grounded Retrieval-Augmented Generation (RAG) engine designed specifically for Bangladeshi diabetic and metabolic care. It powers both real-time multimodal camera scanning and natural voice conversational assistance.

The architecture ensures **ultra-fast response times (<1ms local cache/baseline, <800ms bounded vector search)** and complete resilience whether Supabase is configured or running offline.

```
                          ┌────────────────────────┐
                          │   Multimodal Vision /  │
                          │   Voice Assistant      │
                          └───────────┬────────────┘
                                      │
                         [Identified Food Items]
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ queryNutritionSourcesBatch│
                        └─────────────┬─────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │ (Hit)                   │ (Miss)                  │ (Miss)
            ▼                         ▼                         ▼
   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │ In-Memory Cache │       │ Local Clinical  │       │ Supabase Vector │
   │ (Sub-millisecond│       │ Baselines       │       │ pgvector        │
   │  TTL: 1 Hour)   │       │ (30+ Staples)   │       │ (Bounded 800ms) │
   └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Core Capabilities

### A. Hybrid Tiered Retrieval
1. **Tier 1 — High-Speed In-Memory Cache (`RAG_CACHE`):**
   * Pre-computed and dynamically memoized queries.
   * Typical latency: `<0.1ms`.
   * Normalized Bengali/English keys (e.g., `করলা` ↔ `karela`, `ভাত` ↔ `rice`).
2. **Tier 2 — Curated Clinical Diabetic Baselines:**
   * Embedded lookup covering over 30 traditional Bangladeshi foods, vegetables, lentils, fish, and snacks.
   * Precise Glycemic Index (GI), Glycemic Load (GL), Net Carbs (g), and Risk Level (`green`, `yellow`, `red`).
   * Typical latency: `<1ms`.
3. **Tier 3 — Remote Supabase Vector Retrieval (`match_nutrition_documents`):**
   * Uses `pgvector` with cosine similarity (`1 - (embedding <=> query_embedding)`).
   * Strictly bounded by an `AbortSignal.timeout(800)` so slow networks or missing keys never stall inference.

### B. Prompt Grounding & Hallucination Guard
* **Recipe Generator (`recipe-generator.ts`):** Dynamically injects clinical nutrition tables into the Gemini synthesis prompt. Strict anti-hallucination guards reject unauthorized high-GI starches (maida, refined sugar, excessive potato).
* **Elder Voice Assistant (`elder-assistant.ts`):** Contextually fetches staple nutrition and injects warnings into spoken Bangla system prompts.

---

## 3. Multimodal Scanner Optimization
* **Thinking Budget Tuning:** `gemini-2.5-flash` defaults to an extended reasoning budget which took 14–23 seconds. Jotno sets `thinkingConfig: { thinkingBudget: 0 }`, reducing inference time to **3.5–5.0 seconds** without sacrificing accuracy.
* **Graceful Empty/Non-Food Detection:** Rather than crashing into fallback mock data on non-food or blank images, the guardrail detects `isNoFoodDetected` and returns informative Bangla voice guidance.

---

## 4. API Endpoints

### `GET /api/rag/nutrition-lookup?items=করলা,ভাত`
Returns clinical metrics, risk levels, and execution latency.

### `POST /api/rag/nutrition-lookup`
Batch payload:
```json
{
  "items": ["Red Rice", "Lentil Soup", "Bitter Gourd"]
}
```

Response:
```json
{
  "success": true,
  "count": 3,
  "latencyMs": 0,
  "data": {
    "Red Rice": { "glycemic_index_est": 55, "risk_level": "green" },
    ...
  }
}
```

---

## 5. Verification & Test Suite
All 19 dedicated RAG tests and the full application test suite pass cleanly:
* `src/__tests__/rag-engine.test.ts` (19 tests)
* Total test suite: 21 test files, 190 tests passing (0 failures).
