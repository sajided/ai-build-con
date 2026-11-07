import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DAILY_CARE_DEFAULTS,
  dueReminders,
  localDate,
  medicineAdherence,
  reminderSpeechBn,
  slotKey,
  type DoseRecord,
  type Reminder,
} from "@/lib/care/reminders";
import {
  alertMessageBn,
  buildSnapshot,
  computeStats,
  decodeSnapshot,
  encodeSnapshot,
  smsHref,
  whatsappHref,
  whatsappNumber,
} from "@/lib/care/report";
import { containsBanglaDosage } from "@/lib/assistant/safety";
import CareReport from "@/components/care/CareReport";
import type { GlucoseLog } from "@/lib/validations/telemetry";

const metformin: Reminder = { id: "med-1", kind: "medicine", label: "মেটফরমিন", times: ["08:00", "21:00"], enabled: true };
const water: Reminder = { ...DAILY_CARE_DEFAULTS[0], enabled: true };

function at(h: number, m = 0, dayOffset = 0) {
  const d = new Date(2026, 10, 7, h, m);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

describe("Medicine reminders", () => {
  it("is due from its time until two hours later", () => {
    expect(dueReminders(at(7, 59), [metformin], [])).toHaveLength(0);
    expect(dueReminders(at(8, 0), [metformin], [])).toHaveLength(1);
    expect(dueReminders(at(10, 0), [metformin], [])).toHaveLength(1);
    expect(dueReminders(at(10, 1), [metformin], [])).toHaveLength(0);
  });

  it("disappears once taken, and only for that slot", () => {
    const now = at(8, 30);
    const dose: DoseRecord = { reminderId: "med-1", date: localDate(now), time: "08:00", status: "taken", at: now.toISOString() };
    expect(dueReminders(now, [metformin], [dose])).toHaveLength(0);
    expect(dueReminders(at(21, 5), [metformin], [dose])).toHaveLength(1);
  });

  it("hides while snoozed", () => {
    const now = at(8, 10);
    const key = slotKey("med-1", localDate(now), "08:00");
    expect(dueReminders(now, [metformin], [], { [key]: now.getTime() + 60000 })).toHaveLength(0);
    expect(dueReminders(now, [metformin], [], { [key]: now.getTime() - 1 })).toHaveLength(1);
  });

  it("ignores disabled reminders and puts medicine first", () => {
    const due = dueReminders(at(13, 0), [{ ...water, times: ["13:00"] }, { ...metformin, times: ["13:00"] }], []);
    expect(due.map((d) => d.reminder.kind)).toEqual(["medicine", "water"]);
    expect(dueReminders(at(8, 0), [{ ...metformin, enabled: false }], [])).toHaveLength(0);
  });

  it("counts adherence, treating unanswered past doses as missed", () => {
    const now = at(22, 0);
    const today = localDate(now);
    const yesterday = localDate(at(12, 0, -1));
    const doses: DoseRecord[] = [
      { reminderId: "med-1", date: yesterday, time: "08:00", status: "taken", at: "" },
      { reminderId: "med-1", date: yesterday, time: "21:00", status: "taken", at: "" },
      { reminderId: "med-1", date: today, time: "08:00", status: "taken", at: "" },
    ];
    // Today's 21:00 slot is still open at 22:00, so 3 scheduled
    expect(medicineAdherence(now, [metformin], doses, 2)).toMatchObject({ scheduled: 3, taken: 3, percent: 100 });
    expect(medicineAdherence(at(23, 30), [metformin], doses, 2)).toMatchObject({ scheduled: 4, taken: 3, missed: 1, percent: 75 });
    expect(medicineAdherence(now, [], [], 7).percent).toBeNull();
  });

  it("spoken prompts never give a dose amount", () => {
    for (const r of [metformin, ...DAILY_CARE_DEFAULTS]) expect(containsBanglaDosage(reminderSpeechBn(r))).toBe(false);
  });
});

describe("Doctor report", () => {
  it("computes summary statistics", () => {
    const stats = computeStats([
      { value: 100, context: "fasting" },
      { value: 120, context: "fasting" },
      { value: 200, context: "post_meal" },
      { value: 60, context: "random" },
      { value: 320, context: "random" },
    ]);
    expect(stats).toMatchObject({ count: 5, average: 160, min: 60, max: 320, lowCount: 1, veryHighCount: 1, fastingAverage: 110 });
    expect(stats.inRangePercent).toBe(40);
    expect(stats.byContext.post_meal).toEqual({ count: 1, average: 200 });
    expect(computeStats([]).average).toBeNull();
  });

  it("keeps only the selected period", () => {
    const now = at(12);
    const logs: GlucoseLog[] = [
      { id: "a", glucose_value: 110, context: "fasting", measured_at: at(8, 0, -3).toISOString(), day_offset: 0 },
      { id: "b", glucose_value: 150, context: "post_meal", measured_at: at(8, 0, -20).toISOString(), day_offset: 0 },
    ];
    expect(buildSnapshot("রহিম", logs, [metformin], [], 7, now).readings).toHaveLength(1);
    expect(buildSnapshot("রহিম", logs, [metformin], [], 30, now).readings).toHaveLength(2);
  });

  it("renders a bilingual report", () => {
    const snap = buildSnapshot(
      "রহিম",
      [{ id: "a", glucose_value: 65, context: "fasting", measured_at: at(8).toISOString(), day_offset: 0 }],
      [metformin],
      [],
      7,
      at(12)
    );
    render(React.createElement(CareReport, { snapshot: snap }));
    expect(screen.getByText("রহিম")).toBeInTheDocument();
    expect(screen.getByText("মেটফরমিন")).toBeInTheDocument();
    expect(screen.getByText(/Lows: 1/)).toBeInTheDocument();
  });
});

describe("Caregiver link and alerts", () => {
  it("round-trips a snapshot with Bangla text through the link", () => {
    const snap = buildSnapshot(
      "রহিম উদ্দিন",
      [{ id: "a", glucose_value: 142, context: "post_meal", measured_at: at(9, 15).toISOString(), day_offset: 0 }],
      [metformin],
      [],
      14,
      at(12)
    );
    const encoded = encodeSnapshot(snap);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    const back = decodeSnapshot(encoded)!;
    expect(back.name).toBe("রহিম উদ্দিন");
    expect(back.readings).toEqual(snap.readings);
    expect(back.medicines).toEqual([{ name: "মেটফরমিন", times: ["08:00", "21:00"] }]);
  });

  it("rejects damaged links instead of crashing", () => {
    expect(decodeSnapshot("")).toBeNull();
    expect(decodeSnapshot("not-a-report")).toBeNull();
    expect(decodeSnapshot(btoa(JSON.stringify({ v: 2 })))).toBeNull();
  });

  it("builds SMS and WhatsApp links for Bangladeshi numbers", () => {
    expect(whatsappNumber("017-1234 5678")).toBe("8801712345678");
    expect(whatsappNumber("+8801712345678")).toBe("8801712345678");
    expect(smsHref("01712345678", "হ্যালো")).toBe("sms:01712345678?&body=" + encodeURIComponent("হ্যালো"));
    expect(whatsappHref("01712345678", "a b")).toBe("https://wa.me/8801712345678?text=a%20b");
  });

  it("writes the alert in Bangla with the reading", () => {
    expect(alertMessageBn("রহিম", 55, "৫৫")).toContain("রহিম-এর সুগার এখন ৫৫ (কম)");
    expect(alertMessageBn("", 350, "৩৫০")).toContain("অনেক বেশি");
  });
});
