import { z } from "zod";

/**
 * Zod validation schemas for Phase 5 Blood Glucose Telemetry and Dual-Trajectory Analytics.
 */

export const measurementContextSchema = z.enum([
  "fasting",
  "post_meal",
  "bedtime",
  "random",
], {
  message: "Context must be fasting, post_meal, bedtime, or random",
});

export type MeasurementContext = z.infer<typeof measurementContextSchema>;

export const glucoseLogSchema = z.object({
  id: z.string().default(() => "log-" + Math.random().toString(36).substring(2, 9)),
  user_id: z.string().optional(),
  glucose_value: z
    .number({ message: "Glucose value is required" })
    .min(30, "Glucose reading must be at least 30 mg/dL")
    .max(600, "Glucose reading cannot exceed 600 mg/dL"),
  context: measurementContextSchema.default("fasting"),
  measured_at: z.string().default(() => new Date().toISOString()),
  notes: z.string().optional(),
  linked_meal_title: z.string().optional(),
  linked_meal_id: z.string().optional(),
  day_offset: z.number().int().min(0).default(0),
});

export type GlucoseLog = z.infer<typeof glucoseLogSchema>;

export const trajectoryPointSchema = z.object({
  day: z.number(),
  date_label: z.string(),
  actual: z.number().nullable().optional(),
  target: z.number(),
  context: measurementContextSchema.optional(),
  linked_meal: z.string().optional(),
});

export type TrajectoryPoint = z.infer<typeof trajectoryPointSchema>;

export const telemetrySummarySchema = z.object({
  mean_glucose: z.number(),
  estimated_hba1c: z.number(),
  time_in_range_percent: z.number(),
  total_readings: z.number().int(),
  readings_in_range: z.number().int(),
  baseline_fbs: z.number(),
  target_fbs: z.number(),
  horizon_days: z.number().default(84),
});

export type TelemetrySummary = z.infer<typeof telemetrySummarySchema>;
