'use client';

import React from 'react';
import { NutrientMetric } from '@/lib/validations/deficits';
import { ShieldCheck, AlertTriangle, Activity } from 'lucide-react';

interface NutrientProgressMeterProps {
  metrics: NutrientMetric[];
}

export function NutrientProgressMeter({ metrics }: NutrientProgressMeterProps) {
  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const isOptimal = metric.status === 'optimal' || metric.status === 'surplus';
        const isCritical = metric.status === 'critical_deficit';

        // Color classes
        const barColor = isOptimal
          ? 'bg-emerald-500'
          : isCritical
          ? 'bg-rose-500'
          : 'bg-amber-500';

        const textColor = isOptimal
          ? 'text-emerald-400'
          : isCritical
          ? 'text-rose-400'
          : 'text-amber-400';

        const badgeBg = isOptimal
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          : isCritical
          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30';

        return (
          <div
            key={metric.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isOptimal ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                ) : isCritical ? (
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                ) : (
                  <Activity className="h-5 w-5 text-amber-400" />
                )}
                <span className="font-semibold text-slate-100 text-sm">
                  {metric.name}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {metric.badge && (
                  <span
                    data-testid={`${metric.id}-badge`}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide shadow-sm animate-pulse ${badgeBg}`}
                  >
                    ★ {metric.badge}
                  </span>
                )}
                <span className={`text-xs font-semibold uppercase ${textColor}`}>
                  {isOptimal ? 'Optimal' : 'Deficit'}
                </span>
              </div>
            </div>

            {/* Metrics values */}
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="text-slate-400">
                Current:{' '}
                <strong className="text-slate-200 text-sm font-mono">
                  {metric.current} {metric.unit}
                </strong>
              </span>
              <span className="text-slate-400">
                Target:{' '}
                <span className="text-slate-300 font-mono">
                  {metric.target} {metric.unit}
                </span>
                <span className={`ml-2 font-bold font-mono ${textColor}`}>
                  ({metric.difference > 0 ? `+${metric.difference}` : metric.difference}
                  {metric.unit})
                </span>
              </span>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                style={{ width: `${Math.min(100, Math.max(8, metric.percentage))}%` }}
              />
            </div>

            {/* Clinical Mechanism Explanation */}
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {metric.clinicalImpact}
            </p>
          </div>
        );
      })}
    </div>
  );
}
