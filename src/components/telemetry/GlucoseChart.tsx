"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import type { TrajectoryPoint } from "@/lib/validations/telemetry";
import { CONTEXT_LABELS_BN, toBanglaDigits } from "@/lib/assistant/bangla";

interface GlucoseChartProps {
  data: TrajectoryPoint[];
  height?: number;
}

/** Display-only conversion: stored readings may be mg/dL (> 35) or mmol/L (<= 35). */
export function toMmol(value: number): number {
  return value <= 35 ? value : Number((value / 18).toFixed(1));
}

/** Patient "good" band in mmol/L (= 70–140 mg/dL) */
export const SAFE_BAND_MMOL = { min: 3.9, max: 7.8 } as const;
export const Y_DOMAIN_MMOL: [number, (dataMax: number) => number] = [3, (dataMax) => Math.max(10.5, Math.ceil(dataMax))];
export const Y_TICKS_MMOL = [3.9, 5.5, 7.8, 9, 10];

type ChartPoint = Omit<TrajectoryPoint, "actual" | "target"> & {
  actual: number | null;
  target: number;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: ChartPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const point = payload[0].payload;
    const actualVal = point.actual;
    const targetVal = point.target;

    const isInRange =
      actualVal !== null && actualVal >= SAFE_BAND_MMOL.min && actualVal <= SAFE_BAND_MMOL.max;
    const contextLabel = point.context ? CONTEXT_LABELS_BN[point.context] ?? point.context : null;

    return (
      <div lang="bn" className="min-w-[200px] space-y-2 rounded-2xl bg-white p-3 text-base shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-1.5 font-bold text-ink">
          <span>দিন {toBanglaDigits(point.day)}</span>
          {contextLabel && <span className="text-sm font-semibold text-ink-muted">{contextLabel}</span>}
        </div>

        {actualVal !== null ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-muted">আপনার সুগার</span>
            <span className={`font-bold ${isInRange ? "text-risk-safeInk" : "text-risk-cautionInk"}`}>
              {toBanglaDigits(actualVal)} <span className="text-sm font-normal text-ink-muted">mmol/L</span>
            </span>
          </div>
        ) : (
          <div className="text-ink-muted">এই দিনে মাপা হয়নি</div>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-ink-muted">লক্ষ্য</span>
          <span className="font-bold text-pastel-lilac-ink">
            {toBanglaDigits(targetVal)} <span className="text-sm font-normal text-ink-muted">mmol/L</span>
          </span>
        </div>

        {point.linked_meal && (
          <div className="border-t border-line pt-1.5 text-sm text-ink-soft">{point.linked_meal}</div>
        )}
      </div>
    );
  }

  return null;
}

export default function GlucoseChart({ data, height = 300 }: GlucoseChartProps) {
  // Clean data (no NaN coordinates) and convert mg/dL → mmol/L for display only
  const chartData: ChartPoint[] = data.map((d) => ({
    ...d,
    actual: typeof d.actual === "number" && !isNaN(d.actual) ? toMmol(d.actual) : null,
    target: toMmol(typeof d.target === "number" && !isNaN(d.target) ? d.target : 100),
  }));

  return (
    <div lang="bn" className="card relative w-full p-4">
      {/* Chart title and legend */}
      <div className="mb-3 space-y-2">
        <h2 className="text-lg font-bold text-ink">সুগার কেমন যাচ্ছে</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-base font-semibold text-ink-soft">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-4 rounded-full bg-pastel-blue-strong"></span>
            <span>আপনার সুগার</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-4 border-b-2 border-dashed border-pastel-lilac-strong"></span>
            <span>লক্ষ্যের পথ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded bg-pastel-lime"></span>
            <span>ভালো সীমা</span>
          </div>
        </div>
      </div>

      {/* Recharts container */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEECE4" vertical={false} />

            <XAxis
              dataKey="day"
              stroke="#8A8E95"
              fontSize={14}
              tickLine={false}
              axisLine={false}
              tickFormatter={(day: number) => `দিন ${toBanglaDigits(day)}`}
            />

            <YAxis
              domain={Y_DOMAIN_MMOL}
              stroke="#8A8E95"
              fontSize={14}
              tickLine={false}
              axisLine={false}
              ticks={Y_TICKS_MMOL}
              tickFormatter={(v: number) => toBanglaDigits(v)}
            />

            {/* TC-P5-02 reference area: green safe zone 3.9–7.8 mmol/L (= 70–140 mg/dL) */}
            <ReferenceArea
              y1={SAFE_BAND_MMOL.min}
              y2={SAFE_BAND_MMOL.max}
              fill="#E1ECB2"
              fillOpacity={0.6}
              stroke="none"
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E6E3D8" }} />

            {/* Line 1: patient readings (solid blue) */}
            <Line
              type="monotone"
              dataKey="actual"
              name="আপনার সুগার"
              stroke="#7FA7EE"
              strokeWidth={3}
              dot={{ r: 5, fill: "#7FA7EE", strokeWidth: 2, stroke: "#FFFFFF" }}
              activeDot={{ r: 7, fill: "#7FA7EE", stroke: "#FFFFFF", strokeWidth: 2 }}
              connectNulls={true}
            />

            {/* Line 2: target path (purple dashed) */}
            <Line
              type="linear"
              dataKey="target"
              name="লক্ষ্যের পথ"
              stroke="#9F88EA"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-base font-medium text-ink-muted">ভালো সীমা: ৩.৯–৭.৮ mmol/L</p>
    </div>
  );
}
