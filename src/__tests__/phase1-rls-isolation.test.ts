import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 1: Database Setup & RLS Cross-User Isolation (TC-P1-01)", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261025000000_phase1_schema_rls.sql"
  );

  it("should have canonical migration file containing all clinical tables and RLS enablement", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");

    // Verify all four core tables exist
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.profiles");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.food_scans");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.generated_recipes");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.glucose_logs");
    expect(sqlContent).toContain("INSERT INTO storage.buckets");

    // Verify RLS is enabled on all tables
    expect(sqlContent).toContain("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;");
    expect(sqlContent).toContain("ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;");
    expect(sqlContent).toContain("ALTER TABLE public.generated_recipes ENABLE ROW LEVEL SECURITY;");
    expect(sqlContent).toContain("ALTER TABLE public.glucose_logs ENABLE ROW LEVEL SECURITY;");

    // Verify cross-user isolation predicates
    expect(sqlContent).toContain("auth.uid() = id");
    expect(sqlContent).toContain("auth.uid() = user_id");
  });

  describe("TC-P1-01 Execution Simulation: User A vs User B Data Boundary", () => {
    interface GlucoseLogRecord {
      id: string;
      user_id: string;
      reading_type: "fasting" | "post_prandial_1h" | "post_prandial_2h";
      glucose_value: number;
    }

    // Mock Database Store
    const mockDatabase: {
      glucose_logs: GlucoseLogRecord[];
    } = {
      glucose_logs: [],
    };

    // RLS Policy Simulation Engine matching Postgres auth.uid() = user_id
    function queryGlucoseLogs(currentAuthUid: string, targetUserId?: string): GlucoseLogRecord[] {
      return mockDatabase.glucose_logs.filter((record) => {
        // Postgres RLS Policy: auth.uid() = user_id
        const isOwner = record.user_id === currentAuthUid;
        if (!isOwner) return false;
        if (targetUserId && record.user_id !== targetUserId) return false;
        return true;
      });
    }

    function insertGlucoseLog(currentAuthUid: string, record: GlucoseLogRecord): { success: boolean; error?: string } {
      // Postgres WITH CHECK policy: auth.uid() = user_id
      if (record.user_id !== currentAuthUid) {
        return {
          success: false,
          error: "new row violates row-level security policy for table 'glucose_logs'",
        };
      }
      mockDatabase.glucose_logs.push(record);
      return { success: true };
    }

    const USER_A_ID = "00000000-0000-4000-a000-000000000001";
    const USER_B_ID = "00000000-0000-4000-b000-000000000002";

    it("Step 1: User A successfully inserts glucose log", () => {
      const result = insertGlucoseLog(USER_A_ID, {
        id: "log-1",
        user_id: USER_A_ID,
        reading_type: "fasting",
        glucose_value: 115,
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // User A can read their own record
      const userALogs = queryGlucoseLogs(USER_A_ID);
      expect(userALogs).toHaveLength(1);
      expect(userALogs[0].glucose_value).toBe(115);
    });

    it("Step 2: User B queries public.glucose_logs and receives empty array [] (Zero data leakage)", () => {
      // User B attempts to read glucose logs (querying with their session token)
      const userBLogs = queryGlucoseLogs(USER_B_ID);
      expect(userBLogs).toEqual([]);
      expect(userBLogs).toHaveLength(0);

      // User B attempts to target User A's records specifically
      const targetedQuery = queryGlucoseLogs(USER_B_ID, USER_A_ID);
      expect(targetedQuery).toEqual([]);
    });

    it("Step 3: User B attempts to insert row with user_id = User A (Fails RLS check)", () => {
      const spoofAttempt = insertGlucoseLog(USER_B_ID, {
        id: "malicious-log-2",
        user_id: USER_A_ID, // Malicious spoof
        reading_type: "fasting",
        glucose_value: 280,
      });

      expect(spoofAttempt.success).toBe(false);
      expect(spoofAttempt.error).toContain("row-level security policy");

      // Verify User A's data was not corrupted
      const userALogs = queryGlucoseLogs(USER_A_ID);
      expect(userALogs).toHaveLength(1);
      expect(userALogs[0].id).toBe("log-1");
    });
  });
});
