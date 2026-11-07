"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Printer } from "lucide-react";
import { decodeSnapshot, type CareSnapshot } from "@/lib/care/report";
import CareReport from "@/components/care/CareReport";

/**
 * Caregiver / family view. The report lives in the URL fragment, so it is read in the browser
 * and never reaches the server.
 */
export default function CarePage() {
  const [state, setState] = useState<{ snapshot: CareSnapshot | null } | null>(null);

  useEffect(() => {
    const read = () => setState({ snapshot: decodeSnapshot(window.location.hash.slice(1)) });
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (!state) return <main className="min-h-dvh" />;

  const { snapshot } = state;
  const ageHours = snapshot ? Math.round((Date.now() - new Date(snapshot.generatedAt).getTime()) / 3600000) : 0;

  return (
    <main lang="bn" className="min-h-dvh px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] print:p-0">
      <header className="flex items-center gap-3 print:hidden">
        <span className="icon-badge h-12 w-12 bg-pastel-coral text-pastel-coral-ink">
          <HeartHandshake className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">পরিবারের জন্য</h1>
          <p className="text-base font-semibold text-ink-muted">Family view</p>
        </div>
      </header>

      {snapshot ? (
        <>
          <p className="mt-4 rounded-2xl bg-white p-4 text-lg text-ink-soft print:hidden">
            {ageHours < 1 ? "এইমাত্র পাঠানো রিপোর্ট।" : `এই রিপোর্টটি ${ageHours} ঘণ্টা আগের।`} নতুন তথ্য দেখতে আবার রিপোর্ট পাঠাতে বলুন।
            <span className="mt-1 block text-sm text-ink-muted">
              Snapshot sent by the patient; ask them to send a new one for newer readings.
            </span>
          </p>
          <div className="mt-5">
            <CareReport snapshot={snapshot} />
          </div>
          <button type="button" onClick={() => window.print()} className="btn-secondary mt-6 h-16 text-xl print:hidden">
            <Printer className="h-6 w-6" />
            প্রিন্ট বা PDF
          </button>
        </>
      ) : (
        <div className="card mt-6 p-5">
          <p className="text-xl font-semibold text-ink">রিপোর্টটি খোলা যায়নি।</p>
          <p className="mt-2 text-lg text-ink-soft">পুরো লিংকটি কপি হয়েছে কিনা দেখুন, অথবা আবার পাঠাতে বলুন।</p>
          <p className="mt-2 text-sm text-ink-muted">This link is incomplete or damaged. Ask for the report to be sent again.</p>
        </div>
      )}
    </main>
  );
}
