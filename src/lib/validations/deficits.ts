import { z } from 'zod';

export const NutrientMetricSchema = z.object({
  id: z.enum(['fiber', 'magnesium', 'protein_carb']),
  name: z.string(),
  current: z.number(),
  target: z.number(),
  unit: z.string(),
  status: z.enum(['critical_deficit', 'mild_deficit', 'optimal', 'surplus']),
  difference: z.number(), // e.g. -16 or +2
  percentage: z.number(), // 0 to 100+
  clinicalImpact: z.string(),
  badge: z.string().nullable().optional(),
});

export type NutrientMetric = z.infer<typeof NutrientMetricSchema>;

export const BazaarStapleItemSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Okra / Dherosh"
  localNameBengali: z.string().optional(),
  priceEstimate: z.string(), // e.g. "$0.40/lb"
  pricePerUnit: z.number(),
  unit: z.string(),
  category: z.enum(['vegetable', 'seed', 'supplement', 'leafy_green', 'spice']),
  primaryNutrient: z.string(),
  solubleFiberGrams: z.number(),
  magnesiumMg: z.number(),
  glycemicIndex: z.number(),
  mechanism: z.string(),
  culinaryTip: z.string(),
  badge: z.string(),
  isHighMucilage: z.boolean(),
});

export type BazaarStapleItem = z.infer<typeof BazaarStapleItemSchema>;

export const BazaarCartItemSchema = z.object({
  id: z.string(),
  item: BazaarStapleItemSchema,
  quantity: z.number().min(1),
  addedAt: z.string(),
});

export type BazaarCartItem = z.infer<typeof BazaarCartItemSchema>;

export const DeficienciesResponseSchema = z.object({
  timeframe: z.string(),
  dailyAverageFiber: z.number(),
  fiberTarget: z.number(),
  fiberStatus: z.enum(['deficit', 'optimal']),
  fiberDifference: z.number(),
  fiberBadge: z.string().nullable(),
  metrics: z.array(NutrientMetricSchema),
  recommendations: z.array(BazaarStapleItemSchema),
  summaryStatement: z.string(),
});

export type DeficienciesResponse = z.infer<typeof DeficienciesResponseSchema>;
