/**
 * Default /docs content. Admin edits (stored in Supabase) override these per section;
 * anything never edited keeps the text below, which ships with the code.
 */

export type DocsGroup = "pitch" | "technical";
/** Sections with a `live` key also render a component fed by real app state. */
export type LiveBlock = "status" | "features" | "api" | "team" | "changelog" | "analytics";

export interface DocSection {
  id: string;
  group: DocsGroup;
  title: string;
  body: string; // Markdown; ```mermaid fences render as diagrams
  live?: LiveBlock;
  hidden?: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  email?: string;
  /** Path under /public (e.g. /team/siam.jpg) or an https URL */
  photo?: string;
}

export interface DocsContent {
  teamName: string;
  tagline: string;
  team: TeamMember[];
  sections: DocSection[];
}

const md = (s: string) => s.replace(/^\n/, "").replace(/\n\s*$/, "");

export const DEFAULT_CONTENT: DocsContent = {
  teamName: "Team Jotno",
  tagline: "A diabetes companion for people who have never used an app. Speak in Bangla. Take a photo. Jotno takes care of the rest.",
  // Phone numbers are deliberately not published here; add public emails/photos via /docs/admin → Team
  team: [
    { name: "Sajid Ali", role: "Team Lead" },
    { name: "Bijan Sarkar", role: "Team member" },
    { name: "Nazifa Kawsar", role: "Team member" },
    { name: "Md. Junaid Al Habib Siam", role: "Team member" },
    { name: "Jannatul Ferdous", role: "Team member" },
  ],
  sections: [
    // ───────────── A. Pitch deck ─────────────
    {
      id: "problem",
      group: "pitch",
      title: "Problem",
      body: md(`
Bangladesh has about **13.9 million adults living with diabetes** ([IDF Diabetes Atlas, 2024](https://diabetesatlas.org/data-by-location/country/bangladesh/)). Many are older, read little, have weak eyesight and don't use English.

Diabetes apps assume the opposite: small text, typed numbers, English menus and calorie tables built for Western food.

Meet **Rahima Begum, 68, from Dhaka**. Type 2 diabetes. She can't read the digits on her meter, eats rice three times a day, and her son lives in another city. Readings go unrecorded, lows are noticed too late, and every meal is a guess.
`),
    },
    {
      id: "solution",
      group: "pitch",
      title: "Solution",
      body: md(`
**Jotno (যত্ন, "care")**: one screen, one big talk button, four picture tiles. Everything is spoken aloud in natural Bangla.

| Rahima… | Jotno… |
|---|---|
| says "my sugar is nine and a half, after eating" | logs 9.5 mmol/L, reads it back, waits for her OK |
| photographs a meter reading 3.4 | turns into a low-sugar help screen with a one-tap call to her son and 999 |
| points the camera at her plate | answers good / eat less / avoid, with one practical sentence |
| photographs a restaurant menu | rates every dish and writes an English request for the waiter |
| has karela, dal and okra at home | writes a low-GI recipe from only those, plus the order to eat them |
| forgets Metformin | reminds her by voice, never with a dose |
`),
    },
    {
      id: "why-now",
      group: "pitch",
      title: "Why now",
      body: md(`
- **Multimodal models finally speak Bangla.** Speech understanding, vision and natural Bangla text-to-speech are now available from one API at Flash-Lite prices.
- **Cheap Android phones are everywhere,** even in homes where nobody types. Voice and camera are the interface people already use, on WhatsApp.
- **Families are split across cities.** Children want to look after parents from afar but have no shared view of their health.
`),
    },
    {
      id: "demo",
      group: "pitch",
      title: "Product demo",
      body: md(`
- **Live app:** open [/](/) on a phone. Hold the green button and speak, or tap a picture tile.
- **3½-minute guided tour (no mic, camera or login):** open [/demo](/demo). A scripted week plays inside the real app with English captions.
- On a laptop, the **Watch the simulation** button beside the app runs the same tour in place.
`),
    },
    {
      id: "market",
      group: "pitch",
      title: "Market opportunity",
      body: md(`
- **Beachhead:** older adults with type 2 diabetes in Bangladesh. That's a subset of the 13.9 million adults the IDF estimates live with diabetes.
- **Expansion:** 300M+ Bangla speakers across Bangladesh and India (West Bengal, Assam, Tripura), then other low-literacy, non-English markets where the same voice-and-picture pattern applies.
- **Payers who already exist:** diabetes clinics, NGOs and community health programmes that need low-cost follow-up between visits.

*Sizing beyond the IDF figure is still to be validated in our pilot.*
`),
    },
    {
      id: "business-model",
      group: "pitch",
      title: "Business model",
      body: md(`
*Proposed. To be tested in the pilot.*

1. **Free for patients.** Logging, safety screen, reminders and reports are always free.
2. **Family plan:** a small monthly fee for the caregiver dashboard, alerts and multiple elders.
3. **B2B2C:** licences for clinics, NGOs and insurers. Jotno handles daily follow-up while the clinic's panel follows many patients.
4. **Bazaar partnerships:** referral fees from local grocers and pharmacies on low-GI basket orders, with the user's consent.
`),
    },
    {
      id: "traction",
      group: "pitch",
      title: "Traction",
      body: md(`
Hackathon build. No real users yet, and we won't claim any.

- A working app on a real phone. Every feature in the **Feature matrix** marked *live* can be tried today, and each AI feature has an offline or rule-based fallback
- 160+ automated tests passing, including safety, adversarial auditor and row-level-security tests. The **Product overview** shows the latest run
- Tested by hand with real Bangla voice clips, meter photos, Bangladeshi plates and restaurant menus

**Next:** a 4-week pilot with 20–30 elders through a Dhaka diabetes clinic.
`),
    },
    {
      id: "competition",
      group: "pitch",
      title: "Competition",
      body: md(`
| | Typical diabetes apps | General AI chatbots | **Jotno** |
|---|---|---|---|
| Works without reading or typing | ✗ | ✗ | **✓ voice + photos** |
| Bangla in and out, natural voice | ✗ | partial | **✓** |
| Knows bhat, dal, kacchi, mishti; prices in ৳ | ✗ | partial | **✓** |
| Refuses medicine doses in code | n/a | ✗ (prompt only) | **✓ EN + বাংলা guardrail** |
| AI checked by deterministic rules | ✗ | ✗ | **✓ can only raise risk** |
| Family dashboard + doctor report | some | ✗ | **✓** |
`),
    },
    {
      id: "advantage",
      group: "pitch",
      title: "Unique advantage",
      body: md(`
- **Elder-first by design.** Every decision starts from a 68-year-old who can't read the screen.
- **"AI suggests, rules decide."** Deterministic auditors can make Jotno more careful, never less. That kind of safety is what clinics will need before they recommend an app.
- **Local food knowledge:** curated Bangladeshi staples, high-GI dish traps and Taka prices that a general model doesn't have.
- **Privacy by architecture:** local-first data, and reports shared in the URL #fragment so no server ever sees them.
`),
    },
    {
      id: "gtm",
      group: "pitch",
      title: "Go-to-market",
      body: md(`
1. **Clinics first:** doctors prescribe Jotno at check-up, and the printable report brings the patient back with data.
2. **The family is the installer:** the son or daughter sets it up once, then sees the dashboard and gets bazaar lists on WhatsApp.
3. **NGO and community health worker programmes** for rural reach, plus the offline model on the roadmap.
4. **Word of mouth in WhatsApp family groups:** every shared report and bazaar list carries the Jotno name.
`),
    },
    {
      id: "team",
      group: "pitch",
      title: "Team",
      live: "team",
      body: md(`
A student team building for our own parents and grandparents.
`),
    },
    {
      id: "vision",
      group: "pitch",
      title: "Vision",
      body: md(`
Every older person with a chronic illness should have a patient, caring companion that speaks their language, knows their food and keeps their family close. That's true whether or not they can read.

Diabetes in Bangla is where we start. Hypertension, heart and kidney care, and other languages follow on the same voice-first, rules-checked foundation.
`),
    },

    // ───────────── B–O. Technical documentation ─────────────
    {
      id: "overview",
      group: "technical",
      title: "Product overview",
      live: "status",
      body: md(`
**What it does:** voice-first and picture-first diabetes care with sugar logging, low/high-sugar emergencies, food and menu checks, recipes, a bazaar list in Taka, medicine reminders and a doctor report. Everything is spoken in Bangla.

**Target users:** elderly Bangla-speaking people with type 2 diabetes (primary), their adult children (caregivers) and their doctors (report readers).

**Core use cases:** log a reading by voice or photo · get help during a low · decide what to eat (plate, menu, groceries) · cook with what's at home · take medicines on time · show the doctor a clear report.
`),
    },
    {
      id: "features",
      group: "technical",
      title: "Feature matrix",
      live: "features",
      body: md(`
Status is computed live from the running deployment. A feature that needs Gemini shows **fallback** when no AI key is configured, and the fallback behaviour is listed.
`),
    },
    {
      id: "architecture",
      group: "technical",
      title: "Architecture",
      body: md(`
\`\`\`mermaid
flowchart LR
  subgraph Phone["PWA on the phone (Next.js 14, React 18)"]
    UI["Elder home, scanner, menu, recipes, nutrition, reminders, report, dashboard"]
    LS[("localStorage: readings, doses, cart")]
  end
  subgraph API["Next.js API routes"]
    AS["/api/assistant"]
    TTS["/api/tts"]
    SC["/api/scanner, /api/scan/menu"]
    RC["/api/recipes/generate"]
    NU["/api/analytics/deficiencies"]
  end
  subgraph Guard["Deterministic safety layer"]
    G1["Dose guardrail EN + BN"]
    G2["Menu / scan / recipe auditors"]
    G3["Glucose thresholds"]
  end
  KB[("Nutrition KB, Open Food Facts, USDA")]
  GEM["Google Gemini: speech, vision, TTS"]
  SB[("Supabase Postgres + RLS")]
  UI --> AS & SC & RC & NU & TTS
  AS & SC & RC --> GEM
  TTS --> GEM
  SC --> KB
  GEM --> Guard --> UI
  NU --> UI
  UI <--> LS
  LS -.background sync.-> SB
\`\`\`
`),
    },
    {
      id: "data-flow",
      group: "technical",
      title: "Data flow",
      body: md(`
\`\`\`mermaid
flowchart LR
  I["Input: Bangla voice, meter / food / menu photo, typed number"] --> P["Processing: dose guardrail, image downscale, mode routing"]
  P --> A["AI: Gemini, JSON schema output"]
  A --> V["Verify: Zod schema, retrieval grounding, GI/GL + trap auditors, clinical thresholds"]
  V --> O["Output: spoken Bangla reply, traffic light, help screen, recipe, bazaar list"]
  O --> C{"User confirms?"}
  C -- "OK" --> S[("Saved on phone, synced when online")]
  C -- "No" --> I
  S --> F["Feedback: dashboard, doctor report, reminders"]
\`\`\`

Nothing is saved until the user hears the value read back and taps **ঠিক আছে** (OK).
`),
    },
    {
      id: "stack",
      group: "technical",
      title: "Technology stack",
      body: md(`
| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, lucide-react | One codebase for UI + API routes, fast on low-end phones |
| Offline | PWA via @ducanh2912/next-pwa | Installable, offline page, works on patchy data |
| Backend | Next.js API routes (serverless) | Keeps keys on the server, per-route time budgets |
| Database | Supabase Postgres + Auth, row-level security | Each user can only read their own rows |
| AI | Gemini Flash / Flash-Lite, Gemini TTS | Speech, vision and Bangla voice in one API |
| Validation | Zod | Every model output is schema-checked |
| Charts | Recharts | Dashboard graphs with table fallbacks |
| Docs | marked + Mermaid | This page |
| Agent interface | Model Context Protocol SDK (Streamable HTTP) | Other AI agents can use Jotno's safety rules |
| Tests | Vitest, Testing Library, jsdom | 160+ tests incl. safety, RLS and docs-API sync |
`),
    },
    {
      id: "api",
      group: "technical",
      title: "API documentation",
      live: "api",
      body: md(`
**Auth model:** the patient app works without an account (demo/local mode). When Supabase Auth is configured, a signed-in user's readings and scans are written to Postgres under row-level security. **session-optional** means "works signed out, persists when signed in". The docs admin endpoints need the signed admin cookie.

All JSON endpoints return \`{ error }\` with a 4xx/5xx status on failure. AI endpoints have hard time budgets so they finish within the serverless limit.
`),
    },
    {
      id: "mcp",
      group: "technical",
      title: "MCP server",
      body: md(`
Jotno ships its own **Model Context Protocol server** at \`/api/mcp\`. Any MCP client (Claude Code, Claude Desktop, IDE agents, a doctor's AI assistant) can use Jotno's safety and nutrition engines directly.

**Connect (Claude Code):**

\`\`\`
claude mcp add --transport http jotno https://jotno-omega.vercel.app/api/mcp
\`\`\`

**Transport:** Streamable HTTP, stateless (a fresh server per request, which suits serverless), JSON responses. Built on the official \`@modelcontextprotocol/sdk\`.

| Tool | What it does |
|---|---|
| \`check_medication_safety\` | English + Bangla dose guardrail, returns the refusal |
| \`classify_glucose\` | Fixed clinical bands, emergency flag, spoken Bangla feedback |
| \`audit_menu_dishes\` | High-GI Bangladeshi dish traps, risk and waiter script |
| \`lookup_nutrition\` | Curated KB, then Open Food Facts, then USDA |
| \`analyze_fiber_gap\` | Weekly gap and local foods priced in ৳ |
| \`get_feature_status\` | Live feature states of this deployment |
| \`get_api_reference\` | Every HTTP endpoint |
| \`search_docs\` | Search these docs |

**Resources:** \`jotno://docs/{id}\` (every section of this page as Markdown) and \`jotno://catalog/bazaar\`. **Prompt:** \`explain_reading_bn\`.

**Safe to expose publicly:** every tool is read-only (\`readOnlyHint\`), stores nothing, takes no personal data and never calls an LLM, so it can't leak patient data or spend AI quota. The same safety rules the app uses now protect any agent that connects.
`),
    },
    {
      id: "data-layer",
      group: "technical",
      title: "Data layer",
      body: md(`
**Sources:** user input (voice, photos, typed numbers) · a curated clinical nutrition dataset of South Asian staples with GI/GL estimates · Open Food Facts and USDA FoodData Central APIs · a bazaar catalogue of low-cost local foods with Taka prices · a dictionary of high-GI Bangladeshi dishes.

**Parsing:** Gemini returns JSON constrained by a schema, then Zod validates it, with range checks (glucose 1–600). Bangla digits are converted both ways. mg/dL is converted to mmol/L (÷ 18).

**Storage:** readings, doses and the cart live in the phone's localStorage first. When signed in, they sync to Supabase (\`glucose_logs\`, \`food_scans\`, \`generated_recipes\`, \`profiles\`, \`voice_interaction_logs\`).

**Privacy:** photos are never stored (\`image_url\` stays null). Scan results and voice transcripts are stored only for signed-in users, under row-level security. The doctor report travels in the link's #fragment, which browsers never send to a server.
`),
    },
    {
      id: "ai-layer",
      group: "technical",
      title: "AI layer",
      body: md(`
**Models:** Gemini 2.5 Flash and Flash-Lite variants (assistant and scanner, as a fallback chain with 9–12 s timeouts), Gemini Flash (menu, recipes, bazaar vision), Gemini TTS (three models, then the browser voice). Temperature 0.2–0.3.

**Prompts:** a separate expert role per feature. The voice assistant's system prompt is written natively in Bangla, with mode-specific rules (talk / meter / food) and a 2-sentence cap.

**Retrieval (corrective):** after Gemini names the foods, verified nutrition is fetched from the curated KB, then Open Food Facts, then USDA, and attached as \`verified_rag_data\`.

**Explainability:** every verdict comes with a reason in words ("hidden sugar in the gravy", "high GI: white rice"). Colours always come with a word and an arrow.

**Safety:** AI suggests, rules decide. Auditors recompute glycemic load, apply GI/GL thresholds, flag local high-GI dishes and strip added sugar from recipes, and they **can only raise risk**. The dose guardrail runs before and after the model.

**Personalisation:** the user's name, recent readings (for the dashboard insights) and what's in her kitchen (recipes). No medical decision is personalised by the model.
`),
    },
    {
      id: "roadmap",
      group: "technical",
      title: "Product roadmap",
      body: md(`
| Horizon | What |
|---|---|
| **Short (0–3 months)** | Clinic pilot with 20–30 elders · automatic family alerts on dangerous readings · semantic Bangla food search on the existing pgvector schema |
| **Mid (3–9 months)** | Clinic & NGO panel · on-device Bangla intent model for offline villages · Bluetooth glucose meter import |
| **Long (9+ months)** | Hypertension and kidney care · more languages · insurer partnerships · doctor-side AI assistant over shared reports, with consent |
`),
    },
    {
      id: "performance",
      group: "technical",
      title: "Performance & scalability",
      body: md(`
- **Latency:** Flash-Lite models answer in about 2 s. Each AI route has a shared time budget (the scanner gives up after 21 s, inside the 30 s serverless limit), so one slow model never stalls the elder.
- **Payload:** photos are downscaled on the phone to at most 1024 px JPEG (quality 0.7) before upload. TTS audio is downsampled to 12 kHz for slow mobile data.
- **Caching:** voice clips are cached on the device and over HTTP (24 h). Nutrition lookups hit the in-process KB first (0 ms).
- **Scale:** API routes are stateless serverless functions that scale horizontally. Postgres handles writes only for signed-in users, and most reads happen on the phone.
- **Load expectation for the pilot:** fewer than 1,000 daily users. The main cost is Gemini calls, which are capped by the 2-sentence replies and JSON output.
`),
    },
    {
      id: "security",
      group: "technical",
      title: "Security",
      body: md(`
- **Auth:** Supabase Auth for patients. The docs admin uses a password, then an HMAC-signed, httpOnly, SameSite cookie valid for 8 h, with constant-time comparison.
- **RBAC:** \`admin\` can edit, publish and schedule the docs. \`super_admin\` can also restore earlier versions. Database rows use row-level security per user. The docs tables have RLS on with no public policies, so only the server (service role) touches them.
- **Data protection:** API keys stay server-side. Photos are not stored. The report is shared through the URL #fragment. Medicine dosing is refused in code.
- **Input safety:** every model output is schema-validated and the model can only return a closed set of actions, which limits the damage a prompt injection can do.
`),
    },
    {
      id: "analytics",
      group: "technical",
      title: "Analytics & KPIs",
      live: "analytics",
      body: md(`
**Health outcomes we'll track in the pilot:** time-in-range (3.9–10 mmol/L) · lows per week · average sugar trend · medicine adherence (% doses marked taken).

**Product KPIs:** readings logged per user per week · % of readings logged by voice or photo rather than typed · help-screen activations followed by a family call · weekly active elders · caregivers viewing the dashboard.
`),
    },
    {
      id: "contributors",
      group: "technical",
      title: "Team & contributors",
      body: md(`
See the [Team](#team) section for roles and contacts. Code contributions are in the git history. The changelog below is generated from it.
`),
    },
    {
      id: "changelog",
      group: "technical",
      title: "Changelog",
      live: "changelog",
      body: md(`
Generated from the repository's commit history at build time.
`),
    },
  ],
};
