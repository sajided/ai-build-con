import { describe, it, expect } from "vitest";
import {
  onboardingSchema,
  step1BiometricsSchema,
  step2ClinicalSchema,
  step3DisclaimerSchema,
} from "@/lib/validations/onboarding";

describe("Phase 1: Onboarding Validation & Disclaimer Guard (TC-P1-02)", () => {
  const validBasePayload = {
    fullName: "Alex Rivera",
    age: 45,
    gender: "male" as const,
    heightCm: 175,
    currentWeightKg: 78,
    targetWeightKg: 72,
    diabetesType: "type_2" as const,
    medicationRegimen: "oral_meds" as const,
    baselineHba1c: 7.4,
    targetFastingGlucose: 110,
    glucoseUnit: "mg/dL" as const,
    disclaimerAccepted: true as const,
  };

  it("TC-P1-02A: Rejects invalid negative age (-5) with descriptive error", () => {
    const invalidAgePayload = {
      ...validBasePayload,
      age: -5,
      currentWeightKg: 70,
      disclaimerAccepted: true as const,
    };

    const result = onboardingSchema.safeParse(invalidAgePayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.age).toBeDefined();
      expect(fieldErrors.age?.[0]).toContain("Age must be > 0");
    }

    // Step 1 Partial Schema rejection
    const step1Result = step1BiometricsSchema.safeParse(invalidAgePayload);
    expect(step1Result.success).toBe(false);
  });

  it("TC-P1-02B: Rejects invalid weight (0kg) below lower clinical bound (> 20kg)", () => {
    const invalidWeightPayload = {
      ...validBasePayload,
      age: 45,
      currentWeightKg: 0,
      disclaimerAccepted: true as const,
    };

    const result = onboardingSchema.safeParse(invalidWeightPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.currentWeightKg).toBeDefined();
      expect(fieldErrors.currentWeightKg?.[0]).toContain("Weight must be > 20kg");
    }

    // Step 1 Partial Schema rejection
    const step1Result = step1BiometricsSchema.safeParse(invalidWeightPayload);
    expect(step1Result.success).toBe(false);
  });

  it("TC-P1-02C: Rejects out-of-range HbA1c (19%) outside clinical bounds (4.0% - 18.0%)", () => {
    const invalidHba1cPayload = {
      ...validBasePayload,
      age: 52,
      currentWeightKg: 78,
      baselineHba1c: 19.0,
      disclaimerAccepted: true as const,
    };

    const result = onboardingSchema.safeParse(invalidHba1cPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.baselineHba1c).toBeDefined();
      expect(fieldErrors.baselineHba1c?.[0]).toContain("HbA1c must be between 4.0% and 18.0%");
    }

    // Step 2 Partial Schema rejection
    const step2Result = step2ClinicalSchema.safeParse(invalidHba1cPayload);
    expect(step2Result.success).toBe(false);
  });

  it("TC-P1-02D: Rejects submission when disclaimer is unchecked (false)", () => {
    const uncheckedDisclaimerPayload = {
      ...validBasePayload,
      disclaimerAccepted: false,
    };

    const result = onboardingSchema.safeParse(uncheckedDisclaimerPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.disclaimerAccepted).toBeDefined();
      expect(fieldErrors.disclaimerAccepted?.[0]).toContain("Disclaimer acceptance is non-negotiable");
    }

    // Step 3 Disclaimer Schema rejection
    const step3Result = step3DisclaimerSchema.safeParse({ disclaimerAccepted: false });
    expect(step3Result.success).toBe(false);
  });

  it("TC-P1-02E: Valid inputs and accepted disclaimer pass with clean output", () => {
    const result = onboardingSchema.safeParse(validBasePayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Alex Rivera");
      expect(result.data.age).toBe(45);
      expect(result.data.currentWeightKg).toBe(78);
      expect(result.data.baselineHba1c).toBe(7.4);
      expect(result.data.disclaimerAccepted).toBe(true);
    }
  });
});
