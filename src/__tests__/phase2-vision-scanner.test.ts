import { describe, it, expect } from "vitest";
import {
  sanitizeJson,
  calculateGlycemicLoad,
  evaluateRiskCategory,
  enforceClinicalGuard,
  parseAndValidateBazaarResponse,
} from "@/lib/ai/bazaar-parser";
import { MOCK_BAZAAR_SCAN_RESPONSE } from "@/lib/ai/gemini";
import { scannedItemSchema } from "@/lib/validations/scanner";

describe("Phase 2 Test Suite: Visual Scanner & Glycemic Classifier (TC-P2-01 & TC-P2-02)", () => {
  describe("TC-P2-01: Multimodal Extraction & JSON Schema Integrity", () => {
    it("should validate all 8 required clinical fields in standard mock grocery basket", () => {
      const items = MOCK_BAZAAR_SCAN_RESPONSE.scanned_items;
      expect(items.length).toBeGreaterThanOrEqual(5);

      items.forEach((item) => {
        const result = scannedItemSchema.safeParse(item);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(typeof result.data.item_name).toBe("string");
          expect(["green", "yellow", "red"]).toContain(result.data.risk_category);
          expect(typeof result.data.glycemic_index).toBe("number");
          expect(typeof result.data.glycemic_load).toBe("number");
          expect(typeof result.data.net_carbs_g).toBe("number");
          expect(typeof result.data.fiber_g).toBe("number");
          expect(result.data.clinical_rationale.length).toBeGreaterThan(5);
          expect(result.data.pairing_advice.length).toBeGreaterThan(5);
        }
      });
    });

    it("should strip markdown backticks and code fence blocks (```json ... ```)", () => {
      const markdownWrapped = `\`\`\`json
{
  "scanned_items": [
    {
      "item_name": "Spinach",
      "quantity_estimate": "1 bunch",
      "risk_category": "green",
      "glycemic_index": 15,
      "glycemic_load": 0.4,
      "net_carbs_g": 2.5,
      "fiber_g": 2.2,
      "clinical_rationale": "High in lutein and nitrates; minimal glycemic impact.",
      "pairing_advice": "Eat as starting course."
    }
  ],
  "overall_basket_assessment": "Excellent fiber shield.",
  "missing_vital_buffers": []
}
\`\`\``;

      const parsed = parseAndValidateBazaarResponse(markdownWrapped);
      expect(parsed.scanned_items).toHaveLength(1);
      expect(parsed.scanned_items[0].item_name).toBe("Spinach");
      expect(parsed.scanned_items[0].risk_category).toBe("green");
    });

    it("should repair trailing commas before parsing", () => {
      const jsonWithTrailingCommas = `{
        "scanned_items": [
          {
            "item_name": "Bitter Gourd",
            "quantity_estimate": "3 pcs",
            "risk_category": "green",
            "glycemic_index": 15,
            "glycemic_load": 0.5,
            "net_carbs_g": 3.0,
            "fiber_g": 2.8,
            "clinical_rationale": "Charantin content aids glucose disposal.",
            "pairing_advice": "Sauté lightly.",
          },
        ],
        "overall_basket_assessment": "Safe basket.",
        "missing_vital_buffers": [],
      }`;

      const sanitized = sanitizeJson(jsonWithTrailingCommas);
      expect(() => JSON.parse(sanitized)).not.toThrow();
    });

    it("should throw a clean recoverable error on completely corrupted JSON without crashing", () => {
      const completelyCorrupted = "INVALID_RESPONSE_NOT_JSON: <<Server Crash Simulated>>";
      expect(() => parseAndValidateBazaarResponse(completelyCorrupted)).toThrow(
        /JSON Sanitizer could not recover valid JSON/
      );
    });
  });

  describe("TC-P2-02: Traffic-Light Glycemic Logic & Formula Verification", () => {
    it("should compute Glycemic Load using exact clinical formula: GL = (GI * Net Carbs) / 100", () => {
      // Test 1: Bitter Gourd (GI 15, Net Carbs 3.2g) => GL = (15 * 3.2) / 100 = 0.48 => 0.5
      expect(calculateGlycemicLoad(15, 3.2)).toBe(0.5);

      // Test 2: Red Lentils (GI 32, Net Carbs 18.0g) => GL = (32 * 18) / 100 = 5.76 => 5.8
      expect(calculateGlycemicLoad(32, 18.0)).toBe(5.8);

      // Test 3: White Potatoes (GI 82, Net Carbs 32.0g) => GL = (82 * 32) / 100 = 26.24 => 26.2
      expect(calculateGlycemicLoad(82, 32.0)).toBe(26.2);

      // Test 4: Polished White Rice (GI 73, Net Carbs 40.0g) => GL = (73 * 40) / 100 = 29.2
      expect(calculateGlycemicLoad(73, 40.0)).toBe(29.2);
    });

    it("should classify Green (Safe) when GI < 55 and GL <= 10", () => {
      // Bitter Gourd: GI 15, GL 0.5
      expect(evaluateRiskCategory(15, 0.5)).toBe("green");
      // Spinach: GI 15, GL 0.4
      expect(evaluateRiskCategory(15, 0.4)).toBe("green");
      // Red Lentils: GI 32, GL 5.8
      expect(evaluateRiskCategory(32, 5.8)).toBe("green");
    });

    it("should classify Yellow (Caution) when GI 56-69 or portion-dependent GL 11-19", () => {
      // Brown Rice: GI 68, GL 16
      expect(evaluateRiskCategory(68, 16)).toBe("yellow");
      // Banana: GI 58, GL 12
      expect(evaluateRiskCategory(58, 12)).toBe("yellow");
    });

    it("should classify Red (High Spike) when GI >= 70 or GL >= 20", () => {
      // White Potatoes: GI 82, GL 26.2
      expect(evaluateRiskCategory(82, 26.2)).toBe("red");
      // Polished Rice: GI 73, GL 29.2
      expect(evaluateRiskCategory(73, 29.2)).toBe("red");
      // Watermelon (high GI 72, lower GL 8): High GI >= 70 triggers Red
      expect(evaluateRiskCategory(72, 8)).toBe("red");
    });

    it("MANDATORY FAILURE CONDITION: Any item with GI >= 75 MUST NEVER be Green", () => {
      const maliciousHighGiItem = {
        item_name: "Baked Russet Potato",
        quantity_estimate: "1 tuber",
        risk_category: "green" as const, // Hallucinated dangerous Green tag!
        glycemic_index: 85, // GI >= 75!
        glycemic_load: 28.0,
        net_carbs_g: 33.0,
        fiber_g: 2.0,
        clinical_rationale: "Starchy tuber",
        pairing_advice: "Eat raw",
      };

      // Clinical guard must strictly override and promote to 'red'
      const guarded = enforceClinicalGuard(maliciousHighGiItem);
      expect(guarded.risk_category).not.toBe("green");
      expect(guarded.risk_category).toBe("red");

      // Direct assert on failure criteria
      const isGreen = evaluateRiskCategory(85, calculateGlycemicLoad(85, 33));
      expect(isGreen).not.toBe("green");
      expect(isGreen).toBe("red");
    });
  });
});
