The cabinet server's earlier contract tests checked only that a call to its MCP endpoint did not come back 401 (unauthorized) or 429 (rate limited). They were passing while the server was answering the requests they sent with an HTTP 406 error: the requests did not ask for the event-stream response the MCP transport requires, so the transport refused them, and a refusal that is neither 401 nor 429 counted as a pass. This file replaced them. It sends real MCP requests and checks what comes back: the server's name from initialize, the tool list, and the payload of a tool call. It also pins a negative fixture, a request without the event-stream Accept header that must fail with 406, so the same false pass cannot come back unnoticed. The server it imports is not in this repository; the file is shown here, not run.

```ts
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import * as apiKeyStore from '../src/auth/apiKeyStore.js';

/**
 * End-to-end MCP contract fixtures over POST /mcp.
 *
 * These assert on the actual JSON-RPC result payloads produced by the MCP
 * server, not merely on HTTP status. Auth is satisfied by mocking
 * validateApiKey so the contract is proven without a live Postgres.
 *
 * The Streamable HTTP transport is created in stateless mode
 * (sessionIdGenerator: undefined) and, with enableJsonResponse unset, replies
 * over Server-Sent Events. The good-path Accept header MUST list both
 * application/json and text/event-stream; omitting text/event-stream is a
 * 406 from the transport (see the negative fixture), which is exactly the
 * error shape the old `status !== 401/429` assertions silently accepted.
 */

const GOOD_ACCEPT = 'application/json, text/event-stream';

async function withHttpServer(app: Express, fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });
  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('expected TCP address');
  }
  const baseUrl = `http://127.0.0.1:${(addr as AddressInfo).port}`;
  try {
    await fn(baseUrl);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

/**
 * Parse a single JSON-RPC message out of an SSE response body. The transport
 * writes `event: message\ndata: <json>\n\n`; we concatenate all `data:` lines
 * (SSE allows a payload to span several) and JSON.parse the result.
 */
function parseSseMessage(body: string): Record<string, unknown> {
  const dataLines = body
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart());
  if (dataLines.length === 0) {
    throw new Error(`no SSE data line in body: ${JSON.stringify(body)}`);
  }
  return JSON.parse(dataLines.join('')) as Record<string, unknown>;
}

async function postMcp(
  baseUrl: string,
  message: unknown,
  headers: Record<string, string>,
): Promise<{ status: number; contentType: string | null; text: string }> {
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'ps_mocked_valid_key', ...headers },
    body: JSON.stringify(message),
  });
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    text: await res.text(),
  };
}

describe('MCP contract over POST /mcp', () => {
  beforeEach(() => {
    vi.spyOn(apiKeyStore, 'validateApiKey').mockResolvedValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initialize returns the pillscout-cabinet server identity and a protocol version', async () => {
    const app = createApp({ databaseReady: false, mcpExpressHost: '127.0.0.1' });
    await withHttpServer(app, async (baseUrl) => {
      const { status, contentType, text } = await postMcp(
        baseUrl,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'contract-test', version: '0.0.0' },
          },
        },
        { Accept: GOOD_ACCEPT },
      );
      expect(status).toBe(200);
      expect(contentType).toContain('text/event-stream');
      const msg = parseSseMessage(text);
      expect(msg['jsonrpc']).toBe('2.0');
      expect(msg['id']).toBe(1);
      const result = msg['result'] as Record<string, unknown> | undefined;
      expect(result).toBeDefined();
      const serverInfo = result?.['serverInfo'] as Record<string, unknown> | undefined;
      expect(serverInfo?.['name']).toBe('pillscout-cabinet');
      expect(typeof result?.['protocolVersion']).toBe('string');
      expect(result?.['capabilities']).toBeDefined();
    });
  });

  it('tools/list advertises the hello_pillscout tool', async () => {
    const app = createApp({ databaseReady: false, mcpExpressHost: '127.0.0.1' });
    await withHttpServer(app, async (baseUrl) => {
      const { status, text } = await postMcp(
        baseUrl,
        { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
        { Accept: GOOD_ACCEPT },
      );
      expect(status).toBe(200);
      const msg = parseSseMessage(text);
      const result = msg['result'] as { tools?: Array<Record<string, unknown>> } | undefined;
      const tools = result?.tools ?? [];
      const hello = tools.find((t) => t['name'] === 'hello_pillscout');
      expect(hello).toBeDefined();
      expect(typeof hello?.['description']).toBe('string');
    });
  });

  it('tools/call hello_pillscout returns the hello-world scaffold payload', async () => {
    const app = createApp({ databaseReady: false, mcpExpressHost: '127.0.0.1' });
    await withHttpServer(app, async (baseUrl) => {
      const { status, text } = await postMcp(
        baseUrl,
        {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: { name: 'hello_pillscout', arguments: {} },
        },
        { Accept: GOOD_ACCEPT },
      );
      expect(status).toBe(200);
      const msg = parseSseMessage(text);
      expect(msg['id']).toBe(3);
      const result = msg['result'] as
        | { isError?: boolean; content?: Array<Record<string, unknown>> }
        | undefined;
      expect(result).toBeDefined();
      expect(result?.isError).not.toBe(true);
      const first = result?.content?.[0];
      expect(first?.['type']).toBe('text');
      const payload = JSON.parse(String(first?.['text'])) as Record<string, unknown>;
      expect(payload).toEqual({ message: 'Hello from PillScout', phase: 0 });
    });
  });

  it('rejects a POST whose Accept header omits text/event-stream with 406 (not 401)', async () => {
    const app = createApp({ databaseReady: false, mcpExpressHost: '127.0.0.1' });
    await withHttpServer(app, async (baseUrl) => {
      const { status, text } = await postMcp(
        baseUrl,
        {
          jsonrpc: '2.0',
          id: 4,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'contract-test', version: '0.0.0' },
          },
        },
        { Accept: 'application/json' },
      );
      // Auth passed (mocked valid key), so this is the transport's 406, not a
      // 401. This is the exact response the old status-only assertions accepted
      // as a "passing" MCP call.
      expect(status).toBe(406);
      expect(status).not.toBe(401);
      const body = JSON.parse(text) as { error?: { code?: number } };
      expect(body.error?.code).toBe(-32000);
    });
  });
});
```
