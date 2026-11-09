'use client';

import React from 'react';
import { NutrientMetric } from '@/lib/validations/deficits';
import { Wheat, Atom, Beef, Leaf } from 'lucide-react';
import ProgressRing from '@/components/app/ProgressRing';
import { toBanglaDigits } from '@/lib/assistant/bangla';

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

/** Plain-Bangla display copy per metric id (engine data stays English) */
const NUTRIENT_COPY_BN: Record<string, { name: string; unit: string; good: string; low: string; badge: string }> = {
  fiber: {
    name: 'আঁশ',
    unit: 'গ্রাম',
    good: 'আপনি যথেষ্ট আঁশ খাচ্ছেন। এতে খাওয়ার পরে সুগার ধীরে বাড়ে।',
    low: 'আঁশ কম খাচ্ছেন। এতে খাওয়ার পরে সুগার হঠাৎ বেড়ে যায়। শাক-সবজি বেশি খান।',
    badge: 'আঁশ যথেষ্ট আছে',
  },
  magnesium: {
    name: 'ম্যাগনেসিয়াম',
    unit: 'মি.গ্রা.',
    good: 'ম্যাগনেসিয়াম ঠিক আছে। এতে শরীরের ইনসুলিন ভালো কাজ করে।',
    low: 'ম্যাগনেসিয়াম কম। এতে ইনসুলিন ঠিকমতো কাজ করে না। পালং শাক, তিসি খান।',
    badge: 'ম্যাগনেসিয়াম ঠিক আছে',
  },
  protein_carb: {
    name: 'প্রোটিন আর শর্করার ভারসাম্য',
    unit: '',
    good: 'ভাত-রুটির সঙ্গে যথেষ্ট মাছ, ডাল, ডিম খাচ্ছেন। এতে সুগার ধীরে বাড়ে।',
    low: 'ভাত-রুটি বেশি, মাছ-ডাল-ডিম কম। এতে সুগার দ্রুত বাড়ে।',
    badge: 'ভারসাম্য ঠিক আছে',
  },
};

export function NutrientProgressMeter({ metrics }: NutrientProgressMeterProps) {
  return (
    <div lang="bn" className="space-y-3">
      {metrics.map((metric) => {
        const isOptimal = metric.status === 'optimal' || metric.status === 'surplus';
        const isCritical = metric.status === 'critical_deficit';
        const style = NUTRIENT_STYLE[metric.id] ?? DEFAULT_STYLE;
        const copy = NUTRIENT_COPY_BN[metric.id];
        const Icon = style.icon;

        const statusPill = isOptimal
          ? 'bg-risk-safe text-risk-safeInk'
          : isCritical
          ? 'bg-risk-danger text-risk-dangerInk'
          : 'bg-risk-caution text-risk-cautionInk';
        const statusLabel = isOptimal ? 'ভালো' : isCritical ? 'অনেক কম' : 'কম';

        const unit = copy ? copy.unit : metric.unit;
        const amount =
          metric.unit === 'ratio'
            ? `${toBanglaDigits(metric.current)}, লক্ষ্য ${toBanglaDigits(metric.target)}`
            : `রোজ ${toBanglaDigits(metric.current)} ${unit}, লক্ষ্য ${toBanglaDigits(metric.target)} ${unit}`;

        return (
          <div key={metric.id} className="card p-4">
            {/* Row: icon badge, title + meta, ring */}
            <div className="flex items-center gap-3">
              <div className={`icon-badge ${style.badge}`}>
                <Icon className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-ink">{copy?.name ?? metric.name}</span>
                  <span className={`rounded-full px-3 py-0.5 text-base font-bold ${statusPill}`}>{statusLabel}</span>
                </div>
                <p className="text-base font-semibold text-ink-soft">{amount}</p>
              </div>

              <ProgressRing
                value={metric.percentage}
                color={style.ring}
                size={56}
                stroke={7}
                label={`${toBanglaDigits(Math.round(Math.min(100, metric.percentage)))}%`}
              />
            </div>

            {metric.badge && (
              <span
                data-testid={`${metric.id}-badge`}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-risk-safe px-3 py-1 text-base font-bold text-risk-safeInk"
              >
                ★ {copy?.badge ?? metric.badge}
              </span>
            )}

            {/* Plain explanation */}
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {copy ? (isOptimal ? copy.good : copy.low) : metric.clinicalImpact}
            </p>
          </div>
        );
      })}
    </div>
  );
}
