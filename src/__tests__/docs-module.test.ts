import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import {
  DEFAULT_VISIBILITY,
  evaluateAvailability,
  validateVisibility,
  visibilityFromEnv,
  windowFromDuration,
} from "@/lib/docs/access";
import { roleForPassword, signSession, verifySession } from "@/lib/docs/admin-auth";
import { renderMarkdown, toMarkdownDocument } from "@/lib/docs/markdown";
import { mergeContent } from "@/lib/docs/store";
import { DEFAULT_CONTENT } from "@/lib/docs/content";
import { API_ENDPOINTS } from "@/lib/docs/registry";
import { featureStates } from "@/lib/docs/live";
import { contentSchema } from "@/lib/docs/guard";

describe("/docs visibility window", () => {
  const v = { ...DEFAULT_VISIBILITY, startAt: "2026-11-18T00:00:00+06:00", endAt: "2026-12-18T23:59:59+06:00" };

  it("is closed before the start, open inside, closed after the end", () => {
    expect(evaluateAvailability(v, new Date("2026-11-17T17:59:59Z"))).toMatchObject({ open: false, reason: "not_started" });
    expect(evaluateAvailability(v, new Date("2026-11-17T18:00:00Z")).open).toBe(true); // 00:00 Dhaka
    expect(evaluateAvailability(v, new Date("2026-12-18T17:59:59Z")).open).toBe(true); // 23:59:59 Dhaka
    expect(evaluateAvailability(v, new Date("2026-12-18T18:00:01Z"))).toMatchObject({ open: false, reason: "ended" });
  });

  it("the master switch overrides the schedule", () => {
    expect(evaluateAvailability({ ...v, enabled: false }, new Date("2026-11-20T00:00:00Z"))).toMatchObject({ open: false, reason: "disabled" });
  });

  it("open-ended windows stay open", () => {
    expect(evaluateAvailability({ ...v, startAt: null, endAt: null }, new Date("2030-01-01")).open).toBe(true);
  });

  it("rejects an end before the start and bad dates", () => {
    expect(validateVisibility({ enabled: true, startAt: "2026-12-01T00:00:00Z", endAt: "2026-11-01T00:00:00Z" }).ok).toBe(false);
    expect(validateVisibility({ enabled: true, startAt: "not a date" }).ok).toBe(false);
    expect(validateVisibility({ enabled: true, startAt: null, endAt: null }).ok).toBe(true);
  });

  it("builds a duration window from now", () => {
    const now = new Date("2026-11-18T06:00:00Z");
    const w = windowFromDuration(72, now);
    expect(w.startAt).toBe("2026-11-18T06:00:00.000Z");
    expect(w.endAt).toBe("2026-11-21T06:00:00.000Z");
  });

  it("env vars can pin the window when there is no database", () => {
    const fromEnv = visibilityFromEnv({ DOCS_ENABLED: "false", DOCS_START_AT: "", DOCS_END_AT: "2027-01-01T00:00:00Z" });
    expect(fromEnv).toMatchObject({ enabled: false, startAt: null, endAt: "2027-01-01T00:00:00Z" });
    expect(visibilityFromEnv({})).toEqual(DEFAULT_VISIBILITY);
  });
});

describe("/docs admin sessions", () => {
  const env = { DOCS_ADMIN_PASSWORD: "admin-pass", DOCS_SUPER_ADMIN_PASSWORD: "super-pass" };

  it("maps passwords to roles", () => {
    expect(roleForPassword("admin-pass", env)).toBe("admin");
    expect(roleForPassword("super-pass", env)).toBe("super_admin");
    expect(roleForPassword("wrong", env)).toBeNull();
    expect(roleForPassword("", env)).toBeNull();
    expect(roleForPassword("anything", {})).toBeNull();
  });

  it("signed sessions verify, and tampering or expiry is rejected", () => {
    const now = Date.now();
    const token = signSession({ role: "admin", exp: now + 60_000 }, env)!;
    expect(verifySession(token, env, now)?.role).toBe("admin");

    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ role: "super_admin", exp: now + 60_000 })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, env, now)).toBeNull();
    expect(verifySession(`${payload}.${sig}x`, env, now)).toBeNull();
    expect(verifySession(token, { DOCS_ADMIN_PASSWORD: "rotated" }, now)).toBeNull();
    expect(verifySession(token, env, now + 120_000)).toBeNull();
  });
});

describe("/docs markdown rendering", () => {
  it("escapes raw HTML and drops script links", () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) <img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain('href="javascript');
  });

  it("turns mermaid fences into diagram placeholders", () => {
    const html = renderMarkdown("```mermaid\nflowchart LR\n  A --> B\n```");
    expect(html).toContain('class="docs-mermaid"');
    expect(html).toContain("A --&gt; B");
  });

  it("opens external links in a new tab safely", () => {
    expect(renderMarkdown("[IDF](https://diabetesatlas.org)")).toContain('rel="noopener noreferrer"');
  });

  it("exports every visible section to Markdown", () => {
    const md = toMarkdownDocument(DEFAULT_CONTENT, null);
    for (const s of DEFAULT_CONTENT.sections) expect(md).toContain(`### ${s.title}`);
    expect(md).toContain("/api/assistant");
  });
});

describe("/docs content", () => {
  it("default content passes the admin save schema", () => {
    expect(contentSchema.safeParse(DEFAULT_CONTENT).success).toBe(true);
  });

  it("covers every section the brief asks for", () => {
    const ids = DEFAULT_CONTENT.sections.map((s) => s.id);
    for (const id of [
      "problem", "solution", "why-now", "demo", "market", "business-model", "traction", "competition",
      "advantage", "gtm", "team", "vision", "overview", "features", "architecture", "data-flow", "stack",
      "api", "data-layer", "ai-layer", "roadmap", "performance", "security", "analytics", "contributors", "changelog",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("stored edits win, and sections added to the code later still show up", () => {
    const stored = { ...DEFAULT_CONTENT, sections: [{ ...DEFAULT_CONTENT.sections[0], title: "Edited" }] };
    const merged = mergeContent(stored);
    expect(merged.sections[0].title).toBe("Edited");
    expect(merged.sections).toHaveLength(DEFAULT_CONTENT.sections.length);
  });

  it("marks AI features as fallback when Gemini is not configured", () => {
    const states = featureStates({ gemini: false, supabase: false });
    expect(states.find((f) => f.id === "voice")?.state).toBe("fallback");
    expect(states.find((f) => f.id === "emergency")?.state).toBe("live");
    expect(featureStates({ gemini: true, supabase: true }).find((f) => f.id === "voice")?.state).toBe("live");
  });
});

describe("/docs API reference stays in sync with the code", () => {
  const apiRoot = path.resolve(__dirname, "../app/api");
  const routes: { path: string; methods: string[] }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === "route.ts") {
        const src = readFileSync(full, "utf8");
        const methods = Array.from(src.matchAll(/export (?:async )?function (GET|POST|PUT|DELETE|PATCH)\b/g)).map((m) => m[1]);
        const reexport = src.match(/export \{ ([A-Z, ]+) \} from/);
        if (reexport) methods.push(...reexport[1].split(",").map((m) => m.trim()));
        routes.push({ path: "/api/" + path.relative(apiRoot, path.dirname(full)).split(path.sep).join("/"), methods: methods.sort() });
      }
    }
  };
  walk(apiRoot);

  it("lists every route with its real methods", () => {
    const documented = API_ENDPOINTS.map((a) => ({ path: a.path, methods: [...a.methods].sort() })).sort((a, b) => a.path.localeCompare(b.path));
    expect(documented).toEqual(routes.sort((a, b) => a.path.localeCompare(b.path)));
  });
});
