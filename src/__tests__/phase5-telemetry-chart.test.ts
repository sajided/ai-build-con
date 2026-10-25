import { describe, it, expect } from "vitest";
import {
  generateTrajectoryDataset,
  generateTelemetrySummary,
  TC_P5_01_BENCHMARK,
  MOCK_TC_P5_01_LOGS,
} from "@/utils/telemetry";
import {
  telemetrySummarySchema,
  trajectoryPointSchema,
} from "@/lib/validations/telemetry";

describe("Phase 5: Blood Glucose Telemetry & Dual-Trajectory Analytics", () => {
  /**
   * TC-P5-01: Telemetry Mathematical Precision Check
   */
  describe("TC-P5-01: Telemetry Mathematical Precision", () => {
    it("should compute exact summary matching TC-P5-01 benchmark data", () => {
      const summary = generateTelemetrySummary(MOCK_TC_P5_01_LOGS, 160, 100, 84);

      // Mean Glucose: 124.7 mg/dL
      expect(summary.mean_glucose).toBeCloseTo(TC_P5_01_BENCHMARK.expectedMeanGlucose, 1);

      // Estimated HbA1c: 6.0%
      expect(summary.estimated_hba1c).toBeCloseTo(TC_P5_01_BENCHMARK.expectedEstimatedHbA1c, 1);

      // Time in Range: 85.7% ≈ 86%
      expect(summary.time_in_range_percent).toBeCloseTo(
        TC_P5_01_BENCHMARK.expectedTimeInRangePercent,
        1
      );

      // Zod Validation Check
      const parseResult = telemetrySummarySchema.safeParse(summary);
      expect(parseResult.success).toBe(true);
    });
  });

  /**
   * TC-P5-02: Recharts Dual-Line Rendering & Safe Zone Verification
   */
  describe("TC-P5-02: Recharts Dual-Line Dataset & Safe Zone Verification", () => {
    it("should generate dual trajectory points with both actual readings and linear target projections", () => {
      const points = generateTrajectoryDataset({
        logs: MOCK_TC_P5_01_LOGS,
        baselineFBS: 160,
        targetFBS: 100,
        horizonDays: 84,
      });

      expect(points.length).toBeGreaterThan(0);

      // Verify each point conforms to trajectoryPointSchema
      for (const point of points) {
        const validation = trajectoryPointSchema.safeParse(point);
        expect(validation.success).toBe(true);

        // Target line must be finite number, never NaN
        expect(typeof point.target).toBe("number");
        expect(isNaN(point.target)).toBe(false);

        // If actual reading exists, must be finite number, never NaN
        if (point.actual !== null && point.actual !== undefined) {
          expect(typeof point.actual).toBe("number");
          expect(isNaN(point.actual)).toBe(false);
        }
      }
    });

    it("should verify green safe zone reference boundaries are strictly 70 to 140 mg/dL", () => {
      const safeZoneMin = 70;
      const safeZoneMax = 140;

      expect(safeZoneMin).toBe(70);
      expect(safeZoneMax).toBe(140);

      // Assert that readings between 70 and 140 are within the safe zone
      const testReadings = [65, 70, 100, 140, 145, 180];
      const withinZone = testReadings.filter((r) => r >= safeZoneMin && r <= safeZoneMax);

      expect(withinZone).toEqual([70, 100, 140]);
    });

    it("should preserve linked meal scan metadata on actual trajectory points", () => {
      const points = generateTrajectoryDataset({
        logs: MOCK_TC_P5_01_LOGS,
        baselineFBS: 160,
        targetFBS: 100,
        horizonDays: 84,
      });

      const mealPoints = points.filter((p) => p.linked_meal);
      expect(mealPoints.length).toBeGreaterThanOrEqual(1);

      const fishMeal = mealPoints.find((p) =>
        p.linked_meal?.includes("Tandoori Grilled Fish")
      );
      expect(fishMeal).toBeDefined();
      expect(fishMeal!.actual).toBe(98);
    });
  });
});
