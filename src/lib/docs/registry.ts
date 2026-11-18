/**
 * Source of truth for the /docs feature matrix and API reference.
 * src/__tests__/docs-module.test.ts fails if an API route is added, removed or changes
 * methods without this list being updated, so the docs cannot drift from the code.
 */

export type Dependency = "gemini" | "supabase";
export type FeatureStatus = "live" | "beta" | "planned";

export interface FeatureEntry {
  id: string;
  name: string;
  bangla?: string;
  route?: string;
  status: FeatureStatus;
  needs: Dependency[];
  summary: string;
  /** What still works when a dependency is down */
  fallback?: string;
}

export const FEATURES: FeatureEntry[] = [
  { id: "voice", name: "Push-to-talk sugar logging", bangla: "কথা বলে সুগার লিখুন", route: "/", status: "live", needs: ["gemini"], summary: "Spoken Bangla → structured reading → read back → confirm.", fallback: "Typed numbers (Bangla or English digits) are parsed on the phone." },
  { id: "meter", name: "Glucose meter photo", bangla: "মিটারের ছবি", route: "/", status: "live", needs: ["gemini"], summary: "Gemini Vision reads the meter; mg/dL is converted to mmol/L.", fallback: "Manual entry." },
  { id: "emergency", name: "Low / high sugar help screen", bangla: "জরুরি সাহায্য", route: "/", status: "live", needs: [], summary: "< 3.9 or ≥ 16.7 mmol/L opens steps, family call, SMS/WhatsApp and 999. Pure rules, works offline." },
  { id: "plate", name: "Live plate scan", bangla: "খাবার দেখুন", route: "/scanner", status: "live", needs: ["gemini"], summary: "Traffic-light verdict per item; GI/GL auditor can only raise risk.", fallback: "Shows an error rather than guessing (sample data only when explicitly chosen)." },
  { id: "menu", name: "Restaurant menu check", route: "/menusafe", status: "live", needs: ["gemini"], summary: "Every dish rated, hidden sugar named, English waiter request written." },
  { id: "nutrition", name: "Nutrition gaps + bazaar list", bangla: "পুষ্টি", route: "/deficits", status: "live", needs: [], summary: "Rule engine finds weekly gaps and suggests local foods priced in ৳; list shared on WhatsApp." },
  { id: "recipes", name: "Low-GI recipes from what's at home", route: "/recipes", status: "live", needs: ["gemini"], summary: "Recipe plus eating order (vegetables → protein → rice); auditor strips added sugar/starch." },
  { id: "safe-questions", name: "Safe medicine questions", route: "/safety", status: "live", needs: [], summary: "Dose questions in Bangla or English are refused in code and pointed to the doctor." },
  { id: "reminders", name: "Spoken medicine reminders", route: "/reminders", status: "live", needs: [], summary: "Spoken + PWA notification; never a dose. Tracks taken / missed." },
  { id: "dashboard", name: "Family & doctor dashboard", route: "/dashboard", status: "live", needs: [], summary: "Trend over target band, time-in-range, when sugar runs high, medicine grid, est. HbA1c." },
  { id: "report", name: "Printable doctor report", route: "/report", status: "live", needs: [], summary: "Bangla for her, English for the doctor; shared via #fragment so data never hits a server." },
  { id: "tts", name: "Natural Bangla voice", status: "live", needs: ["gemini"], summary: "Gemini TTS across 3 models, then the browser voice.", fallback: "Browser speech synthesis." },
  { id: "sync", name: "Cloud sync with row-level security", status: "beta", needs: ["supabase"], summary: "Local-first storage, background sync to Postgres when signed in.", fallback: "Everything stays on the phone." },
  { id: "simulation", name: "Judges' guided simulation", route: "/demo", status: "live", needs: [], summary: "A scripted week inside the real app with English captions. No network needed." },
  { id: "mcp", name: "Jotno MCP server", route: "/api/mcp", status: "live", needs: [], summary: "Any MCP client (Claude Code, Claude Desktop, IDE agents) can call Jotno's safety, glucose, menu and nutrition engines, and read these docs." },
  { id: "semantic", name: "Semantic Bangla food search (pgvector)", status: "planned", needs: ["supabase", "gemini"], summary: "Match করলা / korola / bitter gourd to one food. Schema is ready, not wired yet." },
  { id: "family-alerts", name: "Automatic family alerts", status: "planned", needs: [], summary: "Push a WhatsApp/Telegram alert to family when a dangerous reading is logged." },
  { id: "on-device", name: "Offline Bangla intent model", status: "planned", needs: [], summary: "Small quantized on-device model for villages with poor signal." },
  { id: "clinic", name: "Clinic & NGO panel", status: "planned", needs: ["supabase"], summary: "Health workers follow many patients with consent." },
];

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiEntry {
  path: string;
  methods: HttpMethod[];
  auth: "public" | "session-optional" | "docs-admin";
  ai: boolean;
  summary: string;
}

export const API_ENDPOINTS: ApiEntry[] = [
  { path: "/api/assistant", methods: ["POST"], auth: "public", ai: true, summary: "Voice / meter photo / food photo → transcript, Bangla reply, action (log_glucose | call_for_help | none)." },
  { path: "/api/tts", methods: ["POST"], auth: "public", ai: true, summary: "Bangla text → 12 kHz WAV. 503 when speech is unavailable." },
  { path: "/api/scanner/multimodal", methods: ["POST"], auth: "session-optional", ai: true, summary: "Plate / menu / grocery scan with retrieval enrichment, GI/GL guard and Taka cost." },
  { path: "/api/scanner/multimodal-live", methods: ["POST"], auth: "session-optional", ai: true, summary: "Alias of the multimodal scanner for the live camera view." },
  { path: "/api/scan/menu", methods: ["POST"], auth: "public", ai: true, summary: "Menu photo → rated dishes, traps, waiter script." },
  { path: "/api/scan/bazaar", methods: ["POST"], auth: "session-optional", ai: true, summary: "Grocery photo → items with GI/GL and risk." },
  { path: "/api/recipes/generate", methods: ["POST"], auth: "session-optional", ai: true, summary: "Available ingredients → audited low-GI recipe and eating order." },
  { path: "/api/safety/check", methods: ["POST"], auth: "public", ai: false, summary: "Runs the English + Bangla dose guardrail on a message." },
  { path: "/api/analytics/deficiencies", methods: ["GET", "POST"], auth: "session-optional", ai: false, summary: "Rule-based nutrition gaps and priced local suggestions." },
  { path: "/api/rag/nutrition-lookup", methods: ["GET", "POST"], auth: "public", ai: false, summary: "Curated KB → Open Food Facts → USDA nutrition lookup." },
  { path: "/api/meals/cost-aware-planner", methods: ["POST"], auth: "public", ai: false, summary: "Prototype budget meal planner (not used by the UI yet)." },
  { path: "/api/telemetry/log", methods: ["POST"], auth: "session-optional", ai: false, summary: "Validated glucose reading; saved to Postgres when signed in." },
  { path: "/api/telemetry/summary", methods: ["GET", "POST"], auth: "session-optional", ai: false, summary: "Averages and ranges for charts." },
  { path: "/api/onboarding", methods: ["POST"], auth: "session-optional", ai: false, summary: "Clinical profile setup with disclaimer guard." },
  { path: "/api/mcp", methods: ["DELETE", "GET", "POST"], auth: "public", ai: false, summary: "Jotno MCP server (Streamable HTTP, stateless): 8 read-only tools, docs resources, 1 prompt." },
  { path: "/api/docs/live", methods: ["GET"], auth: "public", ai: false, summary: "Live system status, feature matrix and usage counts for /docs." },
  { path: "/api/docs/export", methods: ["GET"], auth: "public", ai: false, summary: "Published docs as Markdown (respects the visibility window)." },
  { path: "/api/docs/admin/session", methods: ["GET", "POST", "DELETE"], auth: "docs-admin", ai: false, summary: "Admin sign-in / status / sign-out (httpOnly signed cookie)." },
  { path: "/api/docs/admin/settings", methods: ["GET", "PUT"], auth: "docs-admin", ai: false, summary: "Visibility switch and publishing window." },
  { path: "/api/docs/admin/content", methods: ["GET", "PUT"], auth: "docs-admin", ai: false, summary: "Section drafts, order, publish (creates a version)." },
  { path: "/api/docs/admin/versions", methods: ["GET", "POST"], auth: "docs-admin", ai: false, summary: "Version history; super admin can restore." },
];

export const EXTERNAL_APIS = [
  { name: "Google Gemini (Flash / Flash-Lite)", use: "Speech understanding, meter / food / menu vision, recipes" },
  { name: "Google Gemini TTS", use: "Natural Bangla voice output" },
  { name: "Supabase (Postgres + Auth)", use: "Sync, auth, row-level security, docs admin storage" },
  { name: "Open Food Facts", use: "Nutrition retrieval fallback" },
  { name: "USDA FoodData Central", use: "Nutrition retrieval fallback (optional key)" },
];
