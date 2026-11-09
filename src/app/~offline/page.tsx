'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  WifiOff,
  RefreshCw,
  ShoppingBag,
  LineChart,
  CheckCircle2,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/assistant/bangla';

export default function OfflineFallbackPage() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [cachedLogsCount, setCachedLogsCount] = useState<number>(0);
  const [cachedCartCount, setCachedCartCount] = useState<number>(0);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : false);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Read cached telemetry logs
    try {
      const logs = localStorage.getItem('glucovision_glucose_logs');
      if (logs) {
        setCachedLogsCount(JSON.parse(logs).length || 0);
      }
    } catch {
      // ignore
    }

    // Read cached bazaar list
    try {
      const cart = localStorage.getItem('glucovision_bazaar_cart');
      if (cart) {
        setCachedCartCount(JSON.parse(cart).length || 0);
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <main lang="bn" className="flex min-h-dvh flex-col bg-canvas px-5 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col justify-center">
        <div
          className={`tile flex flex-col items-center px-6 py-10 text-center ${
            isOnline ? 'bg-pastel-lime text-pastel-lime-ink' : 'bg-pastel-blue text-pastel-blue-ink'
          }`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/85">
            {isOnline ? <CheckCircle2 className="h-10 w-10" /> : <WifiOff className="h-10 w-10" />}
          </div>

          <h1 className="mt-5 text-3xl font-bold">{isOnline ? 'ইন্টারনেট ফিরে এসেছে' : 'ইন্টারনেট নেই'}</h1>
          <p className="mt-2 max-w-xs text-lg font-medium leading-relaxed">
            {isOnline
              ? 'সংযোগ আবার চালু হয়েছে। নিচের বোতাম চেপে আবার শুরু করুন।'
              : 'স্ক্যান করতে ইন্টারনেট লাগে। তবে আপনার রাখা সুগার আর বাজারের তালিকা এই ফোনেই আছে।'}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="tile bg-pastel-lilac text-pastel-lilac-ink">
            <span className="chip text-base">
              <LineChart className="h-5 w-5" />
              সুগার
            </span>
            <p className="mt-3 text-4xl font-bold">{toBanglaDigits(cachedLogsCount)}</p>
            <p className="text-base font-semibold">বার ফোনে রাখা আছে</p>
          </div>

          <div className="tile bg-pastel-peach text-pastel-peach-ink">
            <span className="chip text-base">
              <ShoppingBag className="h-5 w-5" />
              বাজার
            </span>
            <p className="mt-3 text-4xl font-bold">{toBanglaDigits(cachedCartCount)}</p>
            <p className="text-base font-semibold">টি জিনিস</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <button type="button" onClick={handleReload} className="btn-primary h-14 text-lg">
          <RefreshCw className="h-6 w-6" />
          <span>আবার চেষ্টা করুন</span>
        </button>
        <Link href="/deficits" className="btn-secondary h-14 text-lg">
          <ShoppingBag className="h-6 w-6" />
          <span>বাজারের তালিকা দেখুন</span>
        </Link>
      </div>
    </main>
  );
}
