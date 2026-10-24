import { z } from "zod";

/**
 * Zod validation schema for individual scanned bazaar/grocery items.
 * Strictly adheres to TC-P2-01 requirements.
 */
export const scannedItemSchema = z.object({
  item_name: z
    .string({ message: "Item name is required" })
    .min(1, "Item name cannot be empty"),
  
  quantity_estimate: z
    .string()
    .default("Standard serving"),
  
  risk_category: z.enum(["green", "yellow", "red"], {
    message: "Risk category must be green, yellow, or red",
  }),
  
  glycemic_index: z
    .number({ message: "Glycemic Index (GI) must be a number" })
    .min(0, "GI cannot be negative")
    .max(150, "GI is out of realistic clinical bounds"),
  
  glycemic_load: z
    .number({ message: "Glycemic Load (GL) must be a number" })
    .min(0, "GL cannot be negative"),
  
  net_carbs_g: z
    .number({ message: "Net carbs must be a number" })
    .min(0, "Net carbs cannot be negative"),
  
  fiber_g: z
    .number({ message: "Fiber must be a number" })
    .min(0, "Fiber cannot be negative"),
  
  clinical_rationale: z
    .string({ message: "Clinical rationale is required" })
    .min(5, "Clinical rationale must be descriptive"),
  
  pairing_advice: z
    .string({ message: "Pairing advice is required" })
    .min(5, "Pairing advice must be actionable"),
});

export type ScannedItem = z.infer<typeof scannedItemSchema>;

/**
 * Zod validation schema for full Bazaar scan response.
 */
export const bazaarScanResponseSchema = z.object({
  scanned_items: z
    .array(scannedItemSchema)
    .min(1, "At least one food item must be detected"),
  
  overall_basket_assessment: z
    .string({ message: "Overall basket assessment is required" }),
  
  missing_vital_buffers: z
    .array(z.string())
    .default([]),
});

export type BazaarScanResponse = z.infer<typeof bazaarScanResponseSchema>;
