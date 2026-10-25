import { describe, it, expect } from "vitest";
import {
  calculateMeanGlucose,
  calculateEstimatedHbA1c,
  calculateTimeInRange,
  calculateTargetTrajectory,
  generateTrajectoryDataset,
  TC_P5_01_BENCHMARK,
  MOCK_TC_P5_01_LOGS,
} from "@/utils/telemetry";

describe("Phase 5: Telemetry Mathematical Precision Check (TC-P5-01)", () => {
  const readings = TC_P5_01_BENCHMARK.readings; // [160, 145, 130, 125, 110, 105, 98]

  describe("calculateMeanGlucose", () => {
    it("should calculate exact arithmetic mean glucose for 7 benchmark readings (124.71 mg/dL)", () => {
      const mean = calculateMeanGlucose(readings);
      // Expected: (160 + 145 + 130 + 125 + 110 + 105 + 98) / 7 = 873 / 7 = 124.714...
      expect(mean).toBeCloseTo(124.71, 1);
      expect(Number(mean.toFixed(1))).toBe(124.7);
    });

    it("should return 0 safely for empty or null readings", () => {
      expect(calculateMeanGlucose([])).toBe(0);
    });
  });

  describe("calculateEstimatedHbA1c", () => {
    it("should calculate estimated HbA1c using the eAG clinical formula (eHbA1c = 6.0%)", () => {
      const mean = calculateMeanGlucose(readings); // 124.71
      const eHbA1c = calculateEstimatedHbA1c(mean);
      // Expected: (124.71 + 46.7) / 28.7 = 171.41 / 28.7 = 5.972... ≈ 6.0%
      expect(eHbA1c).toBeCloseTo(6.0, 1);
      expect(Math.round(eHbA1c * 10) / 10).toBe(6.0);
    });

    it("should return 0 for non-positive mean glucose inputs", () => {
      expect(calculateEstimatedHbA1c(0)).toBe(0);
      expect(calculateEstimatedHbA1c(-50)).toBe(0);
    });
  });

  describe("calculateTimeInRange", () => {
    it("should compute Time in Range matching TC-P5-01 (6 of 7 readings in range = 85.7% ≈ 86%)", () => {
      const tir = calculateTimeInRange(readings);
      // Expected: 6/7 * 100% = 85.714...% ≈ 85.7%
      expect(tir).toBeCloseTo(85.7, 1);
      expect(Math.round(tir)).toBe(86);
    });

    it("should calculate standard 100% and 0% edge cases correctly", () => {
      expect(calculateTimeInRange([100, 110, 120, 130])).toBe(100);
      expect(calculateTimeInRange([250, 300, 350])).toBe(0);
    });
  });

  describe("calculateTargetTrajectory", () => {
    it("should calculate linear target trajectory across the 84-day clinical horizon", () => {
      const baselineFBS = 160;
      const targetFBS = 100;

      // Day 0: Baseline
      expect(calculateTargetTrajectory(baselineFBS, targetFBS, 0, 84)).toBe(160);

      // Day 84: Final Target
      expect(calculateTargetTrajectory(baselineFBS, targetFBS, 84, 84)).toBe(100);

      // Day 42 (Midpoint): exactly 130 mg/dL
      expect(calculateTargetTrajectory(baselineFBS, targetFBS, 42, 84)).toBe(130);
    });
  });

  describe("generateTrajectoryDataset", () => {
    it("should generate structured trajectory points combining logs and target projections", () => {
      const dataset = generateTrajectoryDataset({
        logs: MOCK_TC_P5_01_LOGS,
        baselineFBS: 160,
        targetFBS: 100,
        horizonDays: 84,
      });

      expect(dataset.length).toBeGreaterThanOrEqual(7);

      // Day 0
      const day0 = dataset.find((p) => p.day === 0);
      expect(day0).toBeDefined();
      expect(day0!.actual).toBe(160);
      expect(day0!.target).toBe(160);

      // Day 6
      const day6 = dataset.find((p) => p.day === 6);
      expect(day6).toBeDefined();
      expect(day6!.actual).toBe(98);
      expect(day6!.linked_meal).toBe("Tandoori Grilled Fish with Steamed Broccoli");
    });
  });
});
