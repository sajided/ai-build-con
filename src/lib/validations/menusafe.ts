import { z } from "zod";

/**
 * MenuSafe Validation Schema (Phase 4).
 * Enforces strict typing for restaurant menu scanning, hidden trap detection,
 * and waiter modification scripts (TC-P4-01 & TC-P4-02).
 */

export const menuItemRiskSchema = z.enum(["green", "yellow", "red"], {
  message: "Risk category must be green, yellow, or red",
});

export type MenuItemRisk = z.infer<typeof menuItemRiskSchema>;

export const menuItemSchema = z.object({
  id: z.string().default(() => "menu-item-" + Math.random().toString(36).substring(2, 9)),
  dish_name: z.string({ message: "Dish name is required" }).min(1),
  risk_category: menuItemRiskSchema,
  glycemic_impact: z.enum(["low", "medium", "high"], {
    message: "Glycemic impact must be low, medium, or high",
  }),
  flagged_traps: z.array(z.string()).default([]), // e.g. ["Honey glaze", "Cornstarch thickener", "Deep-fry batter"]
  safe_elements: z.array(z.string()).default([]), // e.g. ["Lean protein", "Steamed broccoli", "Mint yoghurt"]
  clinical_rationale: z.string().min(10, "Clinical rationale must be descriptive"),
  waiter_script: z.string().min(10, "Waiter modification script is required"),
  suggested_side_swap: z.string().optional(), // e.g. "Swap white rice for extra sautéed greens"
});

export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuScanResponseSchema = z.object({
  scanned_at: z.string().default(() => new Date().toISOString()),
  restaurant_type: z.string().default("Casual Dining"),
  safe_selections: z.array(menuItemSchema).default([]),
  caution_items: z.array(menuItemSchema).default([]),
  risky_traps: z.array(menuItemSchema).default([]),
  overall_menu_verdict: z.string().min(10, "Overall menu verdict is required"),
});

export type MenuScanResponse = z.infer<typeof menuScanResponseSchema>;

export const menuScanRequestSchema = z.object({
  text: z.string().optional(),
  imageBase64: z.string().optional(),
});

export type MenuScanRequest = z.infer<typeof menuScanRequestSchema>;
