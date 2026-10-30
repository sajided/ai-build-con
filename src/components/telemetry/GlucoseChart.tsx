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

interface GlucoseChartProps {
  data: TrajectoryPoint[];
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: TrajectoryPoint;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const point = payload[0].payload;
    const actualVal = point.actual;
    const targetVal = point.target;

    const isInRange = actualVal !== null && actualVal !== undefined && actualVal >= 70 && actualVal <= 140;

    return (
      <div className="min-w-[170px] space-y-1.5 rounded-2xl bg-white p-3 text-sm shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-1 font-bold text-ink">
          <span>{label || `Day ${point.day}`}</span>
          {point.context && (
            <span className="text-xs font-semibold capitalize text-ink-muted">{point.context.replace("_", " ")}</span>
          )}
        </div>

        {actualVal !== null && actualVal !== undefined ? (
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Reading</span>
            <span className={`font-bold ${isInRange ? "text-risk-safeInk" : "text-risk-cautionInk"}`}>
              {actualVal} <span className="text-xs font-normal text-ink-muted">mg/dL</span>
            </span>
          </div>
        ) : (
          <div className="text-ink-muted">No reading this day</div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Target</span>
          <span className="font-bold text-pastel-lilac-ink">
            {targetVal} <span className="text-xs font-normal text-ink-muted">mg/dL</span>
          </span>
        </div>

        {point.linked_meal && (
          <div className="border-t border-line pt-1 text-xs text-ink-soft">{point.linked_meal}</div>
        )}
      </div>
    );
  }

  return null;
}

export default function GlucoseChart({ data, height = 300 }: GlucoseChartProps) {
  // Ensure we have clean, non-empty data without NaN coordinates
  const sanitizedData = data.map((d) => ({
    ...d,
    actual: typeof d.actual === "number" && !isNaN(d.actual) ? d.actual : null,
    target: typeof d.target === "number" && !isNaN(d.target) ? d.target : 100,
  }));

  return (
    <div className="card relative w-full p-4">
      {/* Chart Title and Safe Zone Indicator */}
      <div className="mb-3 space-y-2">
        <h2 className="text-base font-bold text-ink">Trend</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-ink-soft">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-3 rounded-full bg-pastel-blue-strong"></span>
            <span>Your readings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-3 border-b-2 border-dashed border-pastel-lilac-strong"></span>
            <span>Target path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded bg-pastel-lime"></span>
            <span>Healthy range</span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sanitizedData}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEECE4" vertical={false} />

            <XAxis
              dataKey="date_label"
              stroke="#8A8E95"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={[60, 180]}
              stroke="#8A8E95"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              ticks={[70, 100, 140, 160, 180]}
            />

            {/* TC-P5-02 Reference Area: Green Safe Zone (70 - 140 mg/dL) */}
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#E1ECB2"
              fillOpacity={0.6}
              stroke="none"
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E6E3D8" }} />

            {/* Line 1: Actual Patient Readings (Solid Blue Line) */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Reading"
              stroke="#7FA7EE"
              strokeWidth={3}
              dot={{ r: 4, fill: "#7FA7EE", strokeWidth: 2, stroke: "#FFFFFF" }}
              activeDot={{ r: 6, fill: "#7FA7EE", stroke: "#FFFFFF", strokeWidth: 2 }}
              connectNulls={true}
            />

            {/* Line 2: AI Predicted Target Line (Purple Dashed Line) */}
            <Line
              type="linear"
              dataKey="target"
              name="Predicted Target"
              stroke="#9F88EA"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs font-medium text-ink-muted">Healthy range is 70–140 mg/dL.</p>
    </div>
  );
}
