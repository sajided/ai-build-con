import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createJotnoMcpServer } from "@/lib/mcp/server";

/**
 * Jotno MCP server over Streamable HTTP, in stateless mode: every request gets a fresh
 * server + transport, which suits serverless functions (no sticky sessions needed).
 *   claude mcp add --transport http jotno https://jotno-omega.vercel.app/api/mcp
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function handle(req: Request): Promise<Response> {
  const server = createJotnoMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // The response body is fully built in JSON mode, so the pair can be released now
    void transport.close();
    void server.close();
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
