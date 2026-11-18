#!/usr/bin/env node
/**
 * Snapshots build facts for /docs into src/lib/docs/generated/meta.json:
 *   - changelog from git history (every run, including `prebuild`)
 *   - test results, only with --with-tests (runs the suite; slow, so not on every build)
 * If git is unavailable (e.g. a shallow CI clone), the previous snapshot is kept.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const OUT = "src/lib/docs/generated/meta.json";
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const meta = { ...previous, generatedAt: new Date().toISOString() };

try {
  const SEP = "\u001f";
  const log = execFileSync("git", ["log", "-n", "60", `--format=%h${SEP}%cI${SEP}%an${SEP}%s`], { encoding: "utf8" });
  const commits = log
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, author, subject] = line.split(SEP);
      return { hash, date, author, subject };
    });
  if (commits.length) {
    meta.commits = commits;
    meta.commitCount = Number(execFileSync("git", ["rev-list", "--count", "HEAD"], { encoding: "utf8" }).trim());
  }
} catch {
  console.warn("[docs-meta] git unavailable, keeping the previous changelog");
}

if (process.argv.includes("--with-tests")) {
  const report = join(tmpdir(), `jotno-vitest-${process.pid}.json`);
  try {
    execFileSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${report}`], { stdio: "ignore" });
  } catch {
    // Non-zero exit when tests fail; the report still records it
  }
  if (existsSync(report)) {
    const r = JSON.parse(readFileSync(report, "utf8"));
    // Count from each test's own status: the summary fields count skipped tests as passed
    const statuses = (r.testResults || []).flatMap((f) => (f.assertionResults || []).map((a) => a.status));
    const n = (st) => statuses.filter((x) => st.includes(x)).length;
    meta.tests = {
      passed: n(["passed"]),
      failed: n(["failed"]),
      skipped: n(["skipped", "pending", "todo"]),
      files: (r.testResults || []).length,
      ranAt: new Date().toISOString(),
    };
    rmSync(report, { force: true });
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(meta, null, 2) + "\n");
console.log(`[docs-meta] wrote ${OUT}${meta.tests ? ` (tests: ${meta.tests.passed} passed, ${meta.tests.failed} failed)` : ""}`);
