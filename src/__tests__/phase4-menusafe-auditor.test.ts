import { describe, it, expect } from "vitest";
import { scanRestaurantMenu } from "@/lib/ai/menu-scanner";
import { auditMenuItem } from "@/lib/ai/menu-auditor";
import { menuItemSchema, menuScanResponseSchema } from "@/lib/validations/menusafe";

describe("Phase 4 Verification: MenuSafe – Restaurant Menu Auditor & Waiter Scripts", () => {
  /**
   * TC-P4-01: Hidden Trap Detection & Classification
   */
  describe("TC-P4-01: Hidden Trap Detection & Classification", () => {
    const dish1Text = "Crispy Honey Glazed Chicken in Sweet Corn Gravy";
    const dish2Text = "Tandoori Grilled Fish with Mint Yoghurt & Steamed Broccoli";

    it("should classify Dish 1 as a Risky Trap (Red) and detect honey, sweet corn, and deep-fry batter", async () => {
      const result = await scanRestaurantMenu({ text: dish1Text });

      expect(result.risky_traps).toBeDefined();
      expect(result.risky_traps.length).toBeGreaterThanOrEqual(1);

      const dish1 = result.risky_traps.find((d) =>
        d.dish_name.toLowerCase().includes("crispy honey glazed chicken")
      );
      expect(dish1).toBeDefined();
      expect(dish1!.risk_category).toBe("red");
      expect(dish1!.glycemic_impact).toBe("high");

      // Verify covert traps were explicitly flagged
      const trapsLower = dish1!.flagged_traps.map((t) => t.toLowerCase());
      expect(trapsLower.some((t) => t.includes("honey"))).toBe(true);
      expect(trapsLower.some((t) => t.includes("corn") || t.includes("sweet corn"))).toBe(true);
      expect(trapsLower.some((t) => t.includes("batter") || t.includes("deep-fry"))).toBe(true);

      // Verify Zod schema conformance
      const parseResult = menuItemSchema.safeParse(dish1);
      expect(parseResult.success).toBe(true);
    });

    it("should classify Dish 2 as a Safe Selection (Green) with high protein, low glycemic impact, and zero added sugars", async () => {
      const result = await scanRestaurantMenu({ text: dish2Text });

      expect(result.safe_selections).toBeDefined();
      expect(result.safe_selections.length).toBeGreaterThanOrEqual(1);

      const dish2 = result.safe_selections.find((d) =>
        d.dish_name.toLowerCase().includes("tandoori grilled fish")
      );
      expect(dish2).toBeDefined();
      expect(dish2!.risk_category).toBe("green");
      expect(dish2!.glycemic_impact).toBe("low");

      // Verify safe elements flagged
      const safeLower = dish2!.safe_elements.map((s) => s.toLowerCase());
      expect(safeLower.some((s) => s.includes("fish") || s.includes("protein"))).toBe(true);
      expect(safeLower.some((s) => s.includes("broccoli") || s.includes("fiber"))).toBe(true);

      // Ensure no covert sugar traps were flagged
      expect(dish2!.flagged_traps).toHaveLength(0);

      // Verify Zod schema conformance
      const parseResult = menuItemSchema.safeParse(dish2);
      expect(parseResult.success).toBe(true);
    });

    it("should deterministically override any dish with honey or sweet corn gravy to Red (Guardrail)", () => {
      // Intentionally pass an item that an LLM might erroneously mark as 'green'
      const hallucinatedItem = {
        id: "test-dish-override",
        dish_name: "Healthy Honey Corn Chicken",
        risk_category: "green" as const,
        glycemic_impact: "low" as const,
        flagged_traps: [],
        safe_elements: ["Chicken"],
        clinical_rationale: "Claimed healthy",
        waiter_script: "None needed",
      };

      const audited = auditMenuItem("Healthy Honey Corn Chicken in Sweet Corn Gravy", hallucinatedItem);

      expect(audited.risk_category).toBe("red");
      expect(audited.glycemic_impact).toBe("high");
      expect(audited.flagged_traps.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * TC-P4-02: Waiter Modification Script Generation & Clipboard Copy
   */
  describe("TC-P4-02: Waiter Modification Script Generation & Clipboard Copy", () => {
    it("should generate clear culinary substitutions for Dish 1 (grilled instead of deep-fried, sauce on side, omit honey glaze)", async () => {
      const result = await scanRestaurantMenu({
        text: "Crispy Honey Glazed Chicken in Sweet Corn Gravy",
      });

      const dish1 = result.risky_traps[0];
      expect(dish1).toBeDefined();
      expect(dish1.waiter_script).toBeDefined();

      const scriptLower = dish1.waiter_script.toLowerCase();
      expect(scriptLower).toMatch(/grilled/i);
      expect(scriptLower).toMatch(/side/i);
      expect(scriptLower).toMatch(/honey|glaze/i);
    });

    it("should provide an actionable dining sequence instruction for safe selections", async () => {
      const result = await scanRestaurantMenu({
        text: "Tandoori Grilled Fish with Mint Yoghurt & Steamed Broccoli",
      });

      const dish2 = result.safe_selections[0];
      expect(dish2).toBeDefined();
      expect(dish2.waiter_script).toBeDefined();

      const scriptLower = dish2.waiter_script.toLowerCase();
      expect(scriptLower).toMatch(/fiber|broccoli|salad|first/i);
    });

    it("should validate full MenuScanResponse against Zod schema", async () => {
      const fullResponse = await scanRestaurantMenu({
        text: "Sample Restaurant Menu with Crispy Honey Glazed Chicken and Tandoori Grilled Fish",
      });

      const parseCheck = menuScanResponseSchema.safeParse(fullResponse);
      expect(parseCheck.success).toBe(true);
      expect(fullResponse.overall_menu_verdict).toBeDefined();
      expect(fullResponse.overall_menu_verdict.length).toBeGreaterThanOrEqual(10);
    });
  });
});
