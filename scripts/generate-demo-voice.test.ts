// @vitest-environment node
/**
 * Pre-records every line Jotno speaks in the judges' demo (/demo) into public/demo-voice/,
 * so the demo never depends on live Gemini TTS quota or latency.
 *
 *   npm run dev            # in one terminal
 *   npm run demo:voice     # in another; re-run whenever the demo script's Bangla lines change
 *
 * Skipped during the normal test run.
 */
import { describe, it } from "vitest";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { DEMO_SPOKEN_LINES } from "@/app/demo/script";

const BASE = process.env.DEMO_VOICE_BASE_URL || "http://localhost:3000";
const OUT = path.resolve(__dirname, "../public/demo-voice");

describe.skipIf(!process.env.GENERATE_DEMO_VOICE)("generate demo voice", () => {
  it("records every spoken demo line", async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const manifestPath = path.join(OUT, "manifest.json");
    const old: Record<string, string> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
    const manifest: Record<string, string> = {};
    const failed: string[] = [];

    for (const line of DEMO_SPOKEN_LINES) {
      const file = createHash("sha1").update(line).digest("hex").slice(0, 12) + ".wav";
      if (old[line] === file && fs.existsSync(path.join(OUT, file))) {
        manifest[line] = file;
        continue;
      }
      // Free-tier TTS allows only a few requests a minute: back off and retry
      let res: Response | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt) await new Promise((r) => setTimeout(r, 25000));
        res = await fetch(`${BASE}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: line }),
        });
        if (res.ok) break;
      }
      if (!res) continue;
      if (!res.ok) {
        failed.push(line);
        console.warn(`✗ ${res.status} ${line}`);
        continue;
      }
      fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
      manifest[line] = file;
      console.log(`✓ ${file} ${line}`);
    }

    // Drop clips for lines no longer in the script
    for (const f of fs.readdirSync(OUT)) {
      if (f.endsWith(".wav") && !Object.values(manifest).includes(f)) fs.unlinkSync(path.join(OUT, f));
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    if (failed.length) throw new Error(`${failed.length} line(s) failed; run again (the demo falls back to live TTS for these)`);
  }, 900000);
});
