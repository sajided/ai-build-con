import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { env, getSystemEnvStatus } from "@/lib/env";

describe("Phase 0 Test Suite: Scaffolding, PWA & Environment Verification", () => {
  describe("TC-P0-01: Environment & Dependency Health Check", () => {
    it("should include all mandatory dependencies in package.json", () => {
      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Critical dependencies specified in TC-P0-01
      expect(allDeps["@supabase/ssr"]).toBeDefined();
      expect(allDeps["@supabase/supabase-js"]).toBeDefined();
      expect(allDeps["@google/genai"]).toBeDefined();
      expect(allDeps["recharts"]).toBeDefined();
      expect(allDeps["lucide-react"]).toBeDefined();
      expect(allDeps["clsx"]).toBeDefined();
      expect(allDeps["tailwind-merge"]).toBeDefined();
      expect(allDeps["zod"]).toBeDefined();
    });

    it("should access configured environment bindings with zero crashes", () => {
      const status = getSystemEnvStatus();
      expect(status).toHaveProperty("supabase");
      expect(status).toHaveProperty("gemini");
      expect(status).toHaveProperty("appUrl");

      expect(typeof env.appUrl).toBe("string");
      expect(env.appUrl.length).toBeGreaterThan(0);
    });
  });

  describe("TC-P0-02: PWA Manifest & Viewport Meta Verification", () => {
    it("should have a valid public/manifest.json with required PWA attributes", () => {
      const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.start_url).toBe("/");
      expect(manifest.display).toBe("standalone");
      expect(manifest.theme_color).toBe("#059669");
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it("should include strict viewport restrictions in src/app/layout.tsx", () => {
      const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      expect(fs.existsSync(layoutPath)).toBe(true);

      const layoutContent = fs.readFileSync(layoutPath, "utf-8");
      // Viewport export must lock zoom (maximumScale 1, userScalable false)
      expect(layoutContent).toContain('userScalable: false');
      expect(layoutContent).toContain('maximumScale: 1');
      expect(layoutContent).toContain('#059669');
    });
  });
});
