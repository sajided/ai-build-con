import { getSystemEnvStatus } from "@/lib/env";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  isDemo: boolean;
}

export const DEMO_USER: UserSession = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo.patient@glucovision.health",
  fullName: "Alex Rivera",
  isDemo: true,
};

export async function getCurrentUserSession(): Promise<UserSession> {
  const envStatus = getSystemEnvStatus();

  // If live Supabase credentials are configured, attempt to fetch authenticated user
  if (envStatus.supabase.isLive) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        return {
          id: user.id,
          email: user.email || "",
          fullName: (user.user_metadata?.full_name as string) || "Patient",
          isDemo: false,
        };
      }
    } catch {
      // Fallback to demo mode if auth error occurs
    }
  }

  // Return standard demo session for local development and smoke tests
  return DEMO_USER;
}

export const getCurrentUser = getCurrentUserSession;
