import { getSystemEnvStatus } from "@/lib/env";
import { ASSISTANT_MODELS, TTS_MODELS } from "@/lib/ai/elder-assistant";
import { FEATURES, type FeatureEntry } from "./registry";
import { getUsageCounts, storageMode, type UsageCounts } from "./store";
import meta from "./generated/meta.json";

/** Everything on /docs that is computed from the running deployment rather than written by hand. */

export type LiveFeatureState = "live" | "fallback" | "beta" | "planned";

export interface LiveFeature extends FeatureEntry {
  state: LiveFeatureState;
}

export interface Commit {
  hash: string;
  date: string;
  author: string;
  subject: string;
}

export interface BuildMeta {
  generatedAt?: string;
  commitCount?: number;
  commits?: Commit[];
  tests?: { passed: number; failed: number; skipped: number; files: number; ranAt: string };
}

export interface LiveSnapshot {
  checkedAt: string;
  services: { gemini: boolean; supabase: boolean; docsStorage: "supabase" | "readonly" };
  models: { assistant: string[]; tts: string[] };
  features: LiveFeature[];
  usage: UsageCounts;
  build: BuildMeta & { commitSha: string | null; environment: string };
}

export function featureStates(services: { gemini: boolean; supabase: boolean }): LiveFeature[] {
  return FEATURES.map((f) => {
    if (f.status === "planned") return { ...f, state: "planned" };
    const missing = f.needs.some((d) => !services[d]);
    if (missing) return { ...f, state: "fallback" };
    return { ...f, state: f.status === "beta" ? "beta" : "live" };
  });
}

export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  const env = getSystemEnvStatus();
  const services = { gemini: env.gemini.isLive, supabase: env.supabase.isLive };
  let usage: UsageCounts = { connected: false };
  try {
    usage = await getUsageCounts();
  } catch {
    usage = { connected: false };
  }
  return {
    checkedAt: new Date().toISOString(),
    services: { ...services, docsStorage: storageMode() },
    models: { assistant: ASSISTANT_MODELS, tts: TTS_MODELS },
    features: featureStates(services),
    usage,
    build: {
      ...(meta as BuildMeta),
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? (meta as BuildMeta).commits?.[0]?.hash ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    },
  };
}
