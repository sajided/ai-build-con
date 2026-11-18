// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createJotnoMcpServer, MCP_TOOL_NAMES } from "@/lib/mcp/server";
import { POST } from "@/app/api/mcp/route";

type TextResult = { content: { type: string; text: string }[] };
const parse = (r: unknown) => JSON.parse((r as TextResult).content[0].text);

describe("Jotno MCP server (protocol level)", () => {
  const client = new Client({ name: "jotno-test", version: "1.0.0" });

  beforeAll(async () => {
    const server = createJotnoMcpServer();
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  });
  afterAll(() => client.close());

  it("advertises all tools as read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...MCP_TOOL_NAMES].sort());
    for (const t of tools) expect(t.annotations?.readOnlyHint).toBe(true);
  });

  it("refuses an insulin dose question in Bangla", async () => {
    const r = parse(await client.callTool({ name: "check_medication_safety", arguments: { text: "এক প্লেট ভাতে কত ইনসুলিন নেব?" } }));
    expect(r.blocked).toBe(true);
    expect(r.refusal.bn).toContain("ডাক্তার");
  });

  it("lets a normal food question through", async () => {
    const r = parse(await client.callTool({ name: "check_medication_safety", arguments: { text: "Is okra good for diabetes?" } }));
    expect(r.blocked).toBe(false);
  });

  it("flags a low reading as an emergency, in both units", async () => {
    const mmol = parse(await client.callTool({ name: "classify_glucose", arguments: { value: 3.4 } }));
    expect(mmol).toMatchObject({ level: "low", emergency: true });
    const mg = parse(await client.callTool({ name: "classify_glucose", arguments: { value: 61, unit: "mg/dL" } }));
    expect(mg).toMatchObject({ level: "low", emergency: true, mmol_per_l: 3.4 });
    const ok = parse(await client.callTool({ name: "classify_glucose", arguments: { value: 6.5 } }));
    expect(ok).toMatchObject({ level: "good", emergency: false });
  });

  it("rates biryani above a vegetable dish on a menu", async () => {
    const r = parse(await client.callTool({ name: "audit_menu_dishes", arguments: { dishes: ["Kacchi biryani", "Mixed vegetable bhaji"] } }));
    expect(r).toHaveLength(2);
    expect(r[0].risk).not.toBe("safe");
    expect(r[0].traps.length).toBeGreaterThan(0);
  });

  it("prices fibre-gap suggestions in Taka", async () => {
    const r = parse(await client.callTool({ name: "analyze_fiber_gap", arguments: { daily_fiber_g: 14 } }));
    expect(r.fiberStatus).toBe("deficit");
    expect(r.recommendations[0].approx_price_bdt).toMatch(/^৳\d+/);
  });

  it("serves docs as resources and finds them by search", async () => {
    const { resources } = await client.listResources();
    expect(resources.some((r) => r.uri === "jotno://docs/problem")).toBe(true);
    const doc = await client.readResource({ uri: "jotno://docs/security" });
    expect((doc.contents[0] as { text: string }).text).toContain("# Security");
    const hits = parse(await client.callTool({ name: "search_docs", arguments: { query: "row-level security" } }));
    expect(hits.length).toBeGreaterThan(0);
  });

  it("offers the Bangla explanation prompt", async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toContain("explain_reading_bn");
    const p = await client.getPrompt({ name: "explain_reading_bn", arguments: { value: "9.5", context: "post_meal" } });
    expect((p.messages[0].content as { text: string }).text).toContain("classify_glucose");
  });
});

describe("Jotno MCP server (HTTP route)", () => {
  const rpc = (body: unknown) =>
    POST(
      new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify(body),
      })
    );

  it("answers initialize and tools/list over Streamable HTTP", async () => {
    const init = await rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "curl", version: "1" } },
    });
    expect(init.status).toBe(200);
    const body = await init.json();
    expect(body.result.serverInfo.name).toBe("jotno");

    const list = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    expect((await list.json()).result.tools).toHaveLength(MCP_TOOL_NAMES.length);
  });
});
