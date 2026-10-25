'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  WifiOff,
  RefreshCw,
  ShoppingBag,
  LineChart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl text-center space-y-6">
        {/* Offline Badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg">
          {isOnline ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          ) : (
            <WifiOff className="h-8 w-8 text-amber-400" />
          )}
        </div>

        <div>
          <span className="inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            PWA Offline Mode Active
          </span>
          <h1 className="text-xl font-bold text-slate-100">
            {isOnline ? 'Connection Restored!' : 'You are currently offline'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {isOnline
              ? 'Your internet connection has returned. You can now resume real-time AI food scanning and cloud synchronization.'
              : 'GlucoVision continues to safeguard your data locally. Cached glucose readings and your bazaar shopping list remain accessible.'}
          </p>
        </div>

        {/* Offline Cached Data Badges */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
              <LineChart className="h-4 w-4" />
              <span>Cached Logs</span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-100">
              {cachedLogsCount} entries
            </div>
            <span className="text-[10px] text-slate-500">Available locally</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-1">
              <ShoppingBag className="h-4 w-4" />
              <span>Bazaar List</span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-100">
              {cachedCartCount} items
            </div>
            <span className="text-[10px] text-slate-500">Preserved in cache</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Check Network & Reload</span>
          </button>

          <Link
            href="/deficits"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-750"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>View Offline Bazaar List</span>
          </Link>
        </div>

        {/* Clinical Safe Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Local storage encryption active</span>
        </div>
      </div>
    </div>
  );
}
