import { z } from "zod";

/**
 * Zod validation schema for generated recipes and eating sequence.
 * Strictly adheres to TC-P3-01 and TC-P3-02 clinical standards.
 */

export const recipeIngredientSchema = z.object({
  name: z.string({ message: "Ingredient name is required" }),
  quantity: z.string().default("To taste"),
  is_pantry_staple: z.boolean().default(false),
});

export const recipeInstructionSchema = z.object({
  step_number: z.number().int(),
  instruction: z.string().min(5, "Instruction must be clear and descriptive"),
  cooking_tip: z.string().optional(),
});

export const eatingSequenceSchema = z.object({
  step_1: z.object({
    title: z.string().default("Soluble Fiber Shield"),
    items: z.array(z.string()).min(1, "Step 1 must contain fiber-rich vegetables/greens"),
    guidance: z.string().min(10, "Step 1 guidance required"),
    duration_minutes: z.number().default(10),
  }),
  step_2: z.object({
    title: z.string().default("Protein & Lipids"),
    items: z.array(z.string()).min(1, "Step 2 must contain protein/lipid items"),
    guidance: z.string().min(10, "Step 2 guidance required"),
    duration_minutes: z.number().default(10),
  }),
  step_3: z.object({
    title: z.string().default("Controlled Carbohydrate Starch"),
    items: z.array(z.string()).default([]),
    guidance: z.string().min(10, "Step 3 guidance required"),
    portion_limit: z.string().default("1/2 cup max"),
  }),
});

export const recipeSchema = z.object({
  id: z.string().default(() => "recipe-" + Date.now()),
  title: z.string().min(3, "Recipe title is required"),
  description: z.string().min(10, "Description is required"),
  prep_time_minutes: z.number().int().min(1),
  cook_time_minutes: z.number().int().min(1),
  servings: z.number().int().min(1).default(2),
  glycemic_impact: z.enum(["low", "medium"], {
    message: "Glycemic impact must be low or medium",
  }),
  macros: z.object({
    total_carbs_g: z.number().min(0),
    fiber_g: z.number().min(0),
    net_carbs_g: z.number().min(0),
    protein_g: z.number().min(0),
    healthy_fats_g: z.number().min(0),
    calories: z.number().min(0),
  }),
  ingredients: z.array(recipeIngredientSchema).min(1),
  instructions: z.array(recipeInstructionSchema).min(1),
  eating_sequence: eatingSequenceSchema,
  localized_buffer_pivot: z.object({
    item_name: z.string(),
    benefit: z.string(),
    estimated_cost: z.string().default("$0.50/lb"),
  }).optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type EatingSequence = z.infer<typeof eatingSequenceSchema>;

export const recipeGenerationResponseSchema = z.object({
  recipes: z.array(recipeSchema).min(1, "At least one recipe must be generated"),
});

export type RecipeGenerationResponse = z.infer<typeof recipeGenerationResponseSchema>;
