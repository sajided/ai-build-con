import type React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
// Charts need layout APIs jsdom lacks; the numbers and sections around them are what we check here
vi.mock("recharts", async (orig) => ({ ...(await orig<typeof import("recharts")>()), ResponsiveContainer: () => <div data-testid="chart" /> }));

import SugarInsights from "@/components/dashboard/SugarInsights";

describe("dashboard sugar insights", () => {
  beforeEach(() => localStorage.clear());

  it("explains the empty state and can show sample data", () => {
    render(<SugarInsights />);
    expect(screen.getByText(/গ্রাফ দেখাবে/)).toBeTruthy();
    fireEvent.click(screen.getByText("নমুনা তথ্য দিয়ে দেখুন"));
    expect(screen.getByText("নমুনা তথ্য")).toBeTruthy();
    expect(screen.getByText("সুগার কেমন যাচ্ছে")).toBeTruthy();
    expect(screen.getByText("কতবার সুগার ঠিক ছিল")).toBeTruthy();
    expect(screen.getByText("কখন সুগার বেশি থাকে")).toBeTruthy();
    expect(screen.getByText(/বার ওষুধ খেয়েছেন/)).toBeTruthy();
    // The low reading in the sample is called out in words, not colour alone
    expect(screen.getByText(/বার সুগার কমে গিয়েছিল/)).toBeTruthy();
  });

  it("uses the patient's own readings when there are enough", () => {
    const now = Date.now();
    const logs = [6.1, 7.0, 9.4].map((mmol, i) => ({
      id: `l${i}`,
      glucose_value: Math.round(mmol * 18),
      context: "fasting",
      measured_at: new Date(now - (i + 1) * 3600_000).toISOString(),
      day_offset: 0,
    }));
    localStorage.setItem("glucovision_glucose_logs", JSON.stringify(logs));
    render(<SugarInsights />);
    expect(screen.queryByText("নমুনা তথ্য")).toBeNull();
    expect(screen.getByText("৩ বারের মধ্যে ২ বার লক্ষ্যের মধ্যে")).toBeTruthy();
  });
});
