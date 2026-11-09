import { describe, it, expect } from "vitest";
import { computeStats, decodeSnapshot, encodeSnapshot, toMgDl, toMmol, type CareSnapshot } from "@/lib/care/report";

describe("Doctor report: mixed mmol/L and mg/dL readings", () => {
  it("does not count a normal mmol/L reading as a low", () => {
    const stats = computeStats([
      { value: 6.5, context: "fasting" }, // mmol/L
      { value: 117, context: "post_meal" }, // mg/dL
    ]);
    expect(stats.lowCount).toBe(0);
    expect(stats.inRangePercent).toBe(100);
    expect(stats.min).toBe(117);
    expect(stats.fastingAverage).toBe(117);
  });

  it("converts for display", () => {
    expect(toMmol(117)).toBe(6.5);
    expect(toMmol(6.5)).toBe(6.5);
    expect(toMgDl(6.5)).toBe(117);
    expect(toMgDl(140)).toBe(140);
  });

  it("keeps mmol/L precision through the share link", () => {
    const snap = {
      name: "Test",
      days: 7,
      generatedAt: new Date("2026-11-09T08:00:00Z").toISOString(),
      readings: [{ at: new Date("2026-11-08T08:00:00Z").toISOString(), value: 6.5, context: "fasting" as const }],
      medicines: [],
      adherence: { taken: 0, scheduled: 0, percent: null },
    } as unknown as CareSnapshot;
    const back = decodeSnapshot(encodeSnapshot(snap));
    expect(back).not.toBeNull();
    expect(toMmol(back!.readings[0].value)).toBe(6.5);
  });
});
