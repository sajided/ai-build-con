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
      <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>{label || `Day ${point.day}`}</span>
          {point.context && (
            <span className="text-[10px] uppercase font-semibold text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/60">
              {point.context.replace("_", " ")}
            </span>
          )}
        </div>

        {actualVal !== null && actualVal !== undefined ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Actual Log:</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                {actualVal} <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
              </span>
            </div>
            <div className="text-[10px]">
              {isInRange ? (
                <span className="text-emerald-400 font-medium">✓ In Safe Range (70-140)</span>
              ) : (
                <span className="text-amber-400 font-medium">⚠ Above Safe Zone</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic">No logged reading for this day</div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
          <span className="text-purple-400">AI Target:</span>
          <span className="font-bold text-purple-300">
            {targetVal} <span className="text-[9px] font-normal text-slate-400">mg/dL</span>
          </span>
        </div>

        {point.linked_meal && (
          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-300">
            <span className="text-teal-400 font-medium">Linked Meal: </span>
            <span>{point.linked_meal}</span>
          </div>
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
    <div className="w-full relative rounded-2xl bg-slate-950/80 p-3 sm:p-4 border border-slate-800/90 shadow-inner">
      {/* Chart Title and Safe Zone Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Dual-Trajectory Glucose Dynamics
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-300 font-medium">Actual Log</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 border-b-2 border-dashed border-purple-400 inline-block"></span>
            <span className="text-purple-300 font-medium">Target Trajectory</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/50 inline-block"></span>
            <span className="text-emerald-400 font-medium">Safe Zone (70-140)</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="date_label"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />

            <YAxis
              domain={[60, 180]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              ticks={[70, 100, 140, 160, 180]}
            />

            {/* TC-P5-02 Reference Area: Green Safe Zone (70 - 140 mg/dL) */}
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#10b981"
              fillOpacity={0.08}
              stroke="#10b981"
              strokeOpacity={0.25}
              strokeDasharray="4 4"
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Line 1: Actual Patient Readings (Solid Emerald Line) */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Reading"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#10b981", strokeWidth: 1.5, stroke: "#022c22" }}
              activeDot={{ r: 6, fill: "#34d399", stroke: "#047857" }}
              connectNulls={true}
            />

            {/* Line 2: AI Predicted Target Line (Purple Dashed Line) */}
            <Line
              type="linear"
              dataKey="target"
              name="Predicted Target"
              stroke="#a855f7"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center text-[10px] text-slate-500">
        Safe Zone reference: ADA clinical fasting & postprandial glycemic boundaries (70–140 mg/dL).
      </div>
    </div>
  );
}
