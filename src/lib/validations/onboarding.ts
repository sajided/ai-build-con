import { z } from "zod";

/**
 * Zod validation schema for GlucoVision Clinical Onboarding Flow.
 * Strictly adheres to TC-P1-02 clinical bounds and legal disclaimer requirements.
 */
export const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters"),
  
  age: z
    .number({ message: "Age is required and must be a number" })
    .int("Age must be a whole number")
    .min(1, "Age must be > 0")
    .max(120, "Age must be <= 120"),
  
  gender: z.enum(["male", "female", "other"], {
    message: "Please select a valid gender",
  }),
  
  heightCm: z
    .number({ message: "Height must be a number" })
    .min(50, "Height must be at least 50 cm")
    .max(250, "Height must be at most 250 cm"),
  
  currentWeightKg: z
    .number({ message: "Current weight must be a number" })
    .refine((val) => val > 20, {
      message: "Weight must be > 20kg",
    })
    .refine((val) => val <= 300, {
      message: "Weight must be <= 300kg",
    }),
  
  targetWeightKg: z
    .number({ message: "Target weight must be a number" })
    .refine((val) => val > 20, { message: "Target weight must be > 20kg" })
    .refine((val) => val <= 300, { message: "Target weight must be <= 300kg" })
    .optional(),
  
  diabetesType: z.enum(
    ["type_1", "type_2", "pre_diabetes", "gestational"],
    { message: "Please select your diabetes diagnosis" }
  ),
  
  medicationRegimen: z.enum(
    ["diet_only", "oral_meds", "insulin", "combination"],
    { message: "Please select your medication regimen" }
  ),
  
  baselineHba1c: z
    .number({ message: "HbA1c must be a number" })
    .min(4.0, "HbA1c must be between 4.0% and 18.0%")
    .max(18.0, "HbA1c must be between 4.0% and 18.0%"),
  
  targetFastingGlucose: z
    .number({ message: "Target fasting glucose must be a number" })
    .min(50, "Target glucose must be at least 50 mg/dL")
    .max(300, "Target glucose must be at most 300 mg/dL")
    .default(110),
  
  glucoseUnit: z.enum(["mg/dL", "mmol/L"]).default("mg/dL"),
  
  disclaimerAccepted: z.boolean().refine((val) => val === true, {
    message: "Disclaimer acceptance is non-negotiable",
  }),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

/**
 * Step-by-step partial schemas for multi-step form wizard validation
 */
export const step1BiometricsSchema = onboardingSchema.pick({
  fullName: true,
  age: true,
  gender: true,
  heightCm: true,
  currentWeightKg: true,
  targetWeightKg: true,
});

export const step2ClinicalSchema = onboardingSchema.pick({
  diabetesType: true,
  medicationRegimen: true,
  baselineHba1c: true,
  targetFastingGlucose: true,
  glucoseUnit: true,
});

export const step3DisclaimerSchema = onboardingSchema.pick({
  disclaimerAccepted: true,
});
