import { describe, it, expect } from "vitest";
import { generateDiabeticRecipes } from "@/lib/ai/recipe-generator";
import {
  auditRecipeIngredients,
  auditEatingSequence,
  FORBIDDEN_HIGH_CARB_STARCHES,
} from "@/lib/ai/recipe-auditor";
import { recipeSchema } from "@/lib/validations/recipe";

describe("Phase 3 Verification: Available-Item Recipe Generator & Plate Sequencer", () => {
  /**
   * TC-P3-01: Constraint-Based Recipe Synthesis (Zero Hallucinated Carbs)
   * Input: ["Bitter Gourd", "Masoor Dal", "Green Chili"]
   */
  describe("TC-P3-01: Constraint-Based Recipe Synthesis", () => {
    const inputItems = ["Bitter Gourd", "Masoor Dal", "Green Chili"];

    it("should generate valid diabetic recipes with titles reflecting input ingredients", async () => {
      const result = await generateDiabeticRecipes(inputItems);

      expect(result.recipes).toBeDefined();
      expect(result.recipes.length).toBeGreaterThanOrEqual(1);

      const recipe = result.recipes[0];
      // Title reflects input items
      expect(
        recipe.title.toLowerCase().includes("bitter gourd") ||
          recipe.title.toLowerCase().includes("karela") ||
          recipe.title.toLowerCase().includes("masoor dal")
      ).toBe(true);

      // Conforms to Zod schema
      const validation = recipeSchema.safeParse(recipe);
      expect(validation.success).toBe(true);
    });

    it("should contain zero unauthorized starches or added refined sugars", async () => {
      const result = await generateDiabeticRecipes(inputItems);
      const recipe = result.recipes[0];

      const forbiddenMatches = recipe.ingredients.filter((ing) => {
        const nameLower = ing.name.toLowerCase();
        return FORBIDDEN_HIGH_CARB_STARCHES.some((forbidden) =>
          nameLower.includes(forbidden.toLowerCase())
        );
      });

      expect(forbiddenMatches).toHaveLength(0);
    });

    it("should mathematically enforce Net Carbs = Total Carbs - Dietary Fiber", async () => {
      const result = await generateDiabeticRecipes(inputItems);

      for (const recipe of result.recipes) {
        const calculatedNet = Number(
          Math.max(0, recipe.macros.total_carbs_g - recipe.macros.fiber_g).toFixed(1)
        );
        expect(recipe.macros.net_carbs_g).toBeCloseTo(calculatedNet, 1);
      }
    });

    it("should strip out hallucinated starches if an LLM response attempts to inject them", () => {
      const taintedRecipe = {
        id: "tainted-1",
        title: "Tainted Stew",
        description: "Test recipe with unauthorized starches",
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 2,
        glycemic_impact: "low" as const,
        macros: {
          total_carbs_g: 45,
          fiber_g: 10,
          net_carbs_g: 35,
          protein_g: 12,
          healthy_fats_g: 4,
          calories: 250,
        },
        ingredients: [
          { name: "Bitter Gourd", quantity: "2 cups", is_pantry_staple: false },
          { name: "Masoor Dal", quantity: "1 cup", is_pantry_staple: false },
          { name: "Refined White Flour (Maida)", quantity: "1/2 cup", is_pantry_staple: false },
          { name: "Cane Sugar", quantity: "2 tbsp", is_pantry_staple: false },
          { name: "Potatoes", quantity: "2 medium", is_pantry_staple: false },
          { name: "Garlic", quantity: "2 cloves", is_pantry_staple: true },
        ],
        instructions: [
          { step_number: 1, instruction: "Simmer ingredients in pot." },
        ],
        eating_sequence: {
          step_1: {
            title: "Fiber Shield",
            items: ["Bitter Gourd"],
            guidance: "Eat greens first",
            duration_minutes: 10,
          },
          step_2: {
            title: "Protein & Lipids",
            items: ["Masoor Dal"],
            guidance: "Eat dal second",
            duration_minutes: 10,
          },
          step_3: {
            title: "Starch Last",
            items: [],
            guidance: "Starches last",
            portion_limit: "none",
          },
        },
      };

      const audited = auditRecipeIngredients(taintedRecipe, inputItems);

      const auditedNames = audited.ingredients.map((i) => i.name.toLowerCase());
      expect(auditedNames.some((n) => n.includes("flour"))).toBe(false);
      expect(auditedNames.some((n) => n.includes("sugar"))).toBe(false);
      expect(auditedNames.some((n) => n.includes("potatoes"))).toBe(false);

      // Verify legitimate ingredients remained
      expect(auditedNames.some((n) => n.includes("bitter gourd"))).toBe(true);
      expect(auditedNames.some((n) => n.includes("masoor dal"))).toBe(true);
      expect(auditedNames.some((n) => n.includes("garlic"))).toBe(true);
    });
  });

  /**
   * TC-P3-02: 3-Tier Clinical Eating Sequence Validation
   * Input: ["Potatoes", "Spinach", "Eggs"]
   */
  describe("TC-P3-02: 3-Tier Clinical Eating Sequence Validation", () => {
    const inputItems = ["Potatoes", "Spinach", "Eggs"];

    it("should place Spinach in Step 1, Eggs in Step 2, and Potatoes in Step 3", async () => {
      const result = await generateDiabeticRecipes(inputItems);
      expect(result.recipes).toBeDefined();

      const recipe = result.recipes[0];
      const seq = recipe.eating_sequence;

      // Step 1: Fiber Shield must contain Spinach
      expect(
        seq.step_1.items.some((i) => i.toLowerCase().includes("spinach"))
      ).toBe(true);
      expect(seq.step_1.title).toMatch(/Fiber Shield/i);
      expect(seq.step_1.duration_minutes).toBeGreaterThanOrEqual(5);

      // Step 2: Protein & Lipids must contain Eggs
      expect(
        seq.step_2.items.some((i) => i.toLowerCase().includes("egg"))
      ).toBe(true);
      expect(seq.step_2.title).toMatch(/Protein/i);

      // Step 3: Controlled Carbohydrate Starch must contain Potatoes portioned last
      expect(
        seq.step_3.items.some((i) => i.toLowerCase().includes("potato"))
      ).toBe(true);
      expect(seq.step_3.portion_limit).toBeDefined();
    });

    it("should programmatically repair unsequenced LLM output to conform to clinical 3-tier standard", () => {
      const unsequencedRecipe = {
        id: "unsequenced-1",
        title: "Potato Egg Spinach Mix",
        description: "Unsequenced dish",
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 2,
        glycemic_impact: "medium" as const,
        macros: {
          total_carbs_g: 25,
          fiber_g: 5,
          net_carbs_g: 20,
          protein_g: 14,
          healthy_fats_g: 9,
          calories: 230,
        },
        ingredients: [
          { name: "Spinach", quantity: "2 cups", is_pantry_staple: false },
          { name: "Eggs", quantity: "2 whole", is_pantry_staple: false },
          { name: "Potatoes", quantity: "1 potato", is_pantry_staple: false },
        ],
        instructions: [
          { step_number: 1, instruction: "Cook everything in skillet." },
        ],
        eating_sequence: {
          step_1: {
            title: "Soluble Fiber Shield",
            items: [],
            guidance: "Eat fiber first",
            duration_minutes: 10,
          },
          step_2: {
            title: "Protein & Lipids",
            items: [],
            guidance: "Eat protein second",
            duration_minutes: 10,
          },
          step_3: {
            title: "Controlled Carbohydrate Starch",
            items: [],
            guidance: "Eat starch last",
            portion_limit: "50g portion maximum",
          },
        },
      };

      const audited = auditEatingSequence(unsequencedRecipe, inputItems);

      expect(audited.eating_sequence.step_1.items).toContain("Spinach");
      expect(audited.eating_sequence.step_2.items).toContain("Eggs");
      expect(audited.eating_sequence.step_3.items).toContain("Potatoes");
    });
  });
});
