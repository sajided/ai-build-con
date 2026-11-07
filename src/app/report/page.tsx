"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Share2, MessageCircle } from "lucide-react";
import { loadLogs, loadSettings, type ElderSettings } from "@/lib/assistant/client";
import { loadDoses, loadReminders } from "@/lib/care/reminders";
import { REPORT_PERIODS, buildSnapshot, snapshotUrl, whatsappHref } from "@/lib/care/report";
import { toBanglaDigits } from "@/lib/assistant/bangla";
import CareReport from "@/components/care/CareReport";
import type { GlucoseLog } from "@/lib/validations/telemetry";

export default function ReportPage() {
  const [data, setData] = useState<{
    settings: ElderSettings | null;
    logs: GlucoseLog[];
    reminders: ReturnType<typeof loadReminders>;
    doses: ReturnType<typeof loadDoses>;
  } | null>(null);
  const [days, setDays] = useState<number>(14);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    setData({ settings: loadSettings(), logs: loadLogs(), reminders: loadReminders(), doses: loadDoses() });
  }, []);

  const snapshot = useMemo(
    () => (data ? buildSnapshot(data.settings?.name ?? "", data.logs, data.reminders, data.doses, days) : null),
    [data, days]
  );

  if (!data || !snapshot) return <main className="min-h-dvh" />;

  const link = snapshotUrl(window.location.origin, snapshot);
  const shareText = `${snapshot.name || "আমার"} সুগারের রিপোর্ট (${toBanglaDigits(days)} দিন):`;
  const contactPhone = data.settings?.contactPhone;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Jotno report", text: shareText, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setShareNote("লিংক কপি হয়েছে। এখন মেসেজে পেস্ট করুন।");
    } catch {
      // User closed the share sheet
    }
  };

  return (
    <main lang="bn" className="min-h-dvh px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] print:p-0">
      <header className="flex items-center gap-2 print:hidden">
        <Link href="/" aria-label="ফিরে যান" className="-ml-2 flex h-14 w-14 items-center justify-center rounded-full active:bg-black/5">
          <ChevronLeft className="h-8 w-8" />
        </Link>
        <h1 className="text-3xl font-bold text-ink">ডাক্তারের রিপোর্ট</h1>
      </header>

      <div className="mt-4 print:hidden">
        <p className="text-lg font-semibold text-ink-soft">কত দিনের?</p>
        <div role="radiogroup" aria-label="কত দিনের রিপোর্ট" className="mt-2 grid grid-cols-3 gap-2">
          {REPORT_PERIODS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={days === d}
              onClick={() => setDays(d)}
              className="chip-toggle h-14 justify-center text-xl"
            >
              {toBanglaDigits(d)} দিন
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <CareReport snapshot={snapshot} />
      </div>

      <div className="mt-6 space-y-3 print:hidden">
        <button type="button" onClick={() => window.print()} className="btn-primary h-16 text-xl">
          <Printer className="h-6 w-6" />
          প্রিন্ট বা PDF
        </button>
        {contactPhone && (
          <a
            href={whatsappHref(contactPhone, `${shareText} ${link}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary h-16 text-xl"
          >
            <MessageCircle className="h-6 w-6" />
            {data.settings?.contactName ? `${data.settings.contactName}-কে পাঠান` : "পরিবারকে পাঠান"}
          </a>
        )}
        <button type="button" onClick={share} className="btn-secondary h-16 text-xl">
          <Share2 className="h-6 w-6" />
          অন্যভাবে পাঠান
        </button>
        {shareNote && <p className="text-center text-lg font-semibold text-ink">{shareNote}</p>}
        <p className="text-base text-ink-muted">
          লিংকে শুধু এই রিপোর্টটুকু থাকে। যাকে পাঠাবেন তিনি এটি দেখতে পাবেন, তাই শুধু বিশ্বস্ত মানুষকে পাঠান।
        </p>
      </div>
    </main>
  );
}
