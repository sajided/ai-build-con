'use client';

import React from 'react';
import { NutrientMetric } from '@/lib/validations/deficits';
import { Wheat, Atom, Beef, Leaf } from 'lucide-react';
import ProgressRing from '@/components/app/ProgressRing';

interface NutrientProgressMeterProps {
  metrics: NutrientMetric[];
}

// Per-nutrient pastel styling: icon badge fill, icon colour, ring colour (pastel "strong" hex values)
const NUTRIENT_STYLE: Record<string, { badge: string; ring: string; icon: React.ElementType }> = {
  fiber: { badge: 'bg-pastel-lime text-pastel-lime-ink', ring: '#9DB98C', icon: Wheat },
  protein_carb: { badge: 'bg-pastel-blue text-pastel-blue-ink', ring: '#7FA7EE', icon: Beef },
  magnesium: { badge: 'bg-pastel-lilac text-pastel-lilac-ink', ring: '#9F88EA', icon: Atom },
};
const DEFAULT_STYLE = { badge: 'bg-pastel-peach text-pastel-peach-ink', ring: '#E9A440', icon: Leaf };

export function NutrientProgressMeter({ metrics }: NutrientProgressMeterProps) {
  return (
    <div className="space-y-3">
      {metrics.map((metric) => {
        const isOptimal = metric.status === 'optimal' || metric.status === 'surplus';
        const isCritical = metric.status === 'critical_deficit';
        const style = NUTRIENT_STYLE[metric.id] ?? DEFAULT_STYLE;
        const Icon = style.icon;

        const statusPill = isOptimal
          ? 'bg-risk-safe text-risk-safeInk'
          : isCritical
          ? 'bg-risk-danger text-risk-dangerInk'
          : 'bg-risk-caution text-risk-cautionInk';

        return (
          <div key={metric.id} className="card p-4">
            {/* Goals-style row: icon badge, title + meta, ring */}
            <div className="flex items-center gap-3">
              <div className={`icon-badge ${style.badge}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-base font-bold text-ink">{metric.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusPill}`}>
                    {isOptimal ? 'On track' : 'Low'}
                  </span>
                </div>
                <p className="text-sm text-ink-muted">
                  <strong className="font-bold text-ink-soft">
                    {metric.current} {metric.unit}
                  </strong>{' '}
                  of {metric.target} {metric.unit} goal
                </p>
              </div>

              <ProgressRing
                value={metric.percentage}
                color={style.ring}
                size={52}
                stroke={7}
                label={`${Math.round(Math.min(100, metric.percentage))}%`}
              />
            </div>

            {metric.badge && (
              <span
                data-testid={`${metric.id}-badge`}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-risk-safe px-2.5 py-1 text-xs font-bold text-risk-safeInk"
              >
                ★ {metric.badge}
              </span>
            )}

            {/* Clinical Mechanism Explanation */}
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{metric.clinicalImpact}</p>
          </div>
        );
      })}
    </div>
  );
}
