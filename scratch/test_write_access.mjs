import { callAemCloudMcp } from './call_mcp.mjs';
import fs from 'fs';

async function main() {
  const tokensRaw = fs.readFileSync('C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensRaw);
  const aemCloud = tokens['https://mcp.adobeaemcloud.com/adobe/mcp/aem'];
  const token = aemCloud?.token?.access_token;

  console.log('--- Inspecting Token Details ---');
  if (token) {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      console.log('JWT Claims:', {
        iss: payload.iss,
        sub: payload.sub,
        aud: payload.aud,
        scope: payload.scope,
        roles: payload.roles,
        user_id: payload.user_id,
        email: payload.email,
        expires: new Date(payload.exp * 1000).toISOString(),
      });
    }
  }

  console.log('--- Testing MCP Tools List ---');
  const mcpUrl = 'https://mcp.adobeaemcloud.com/adobe/mcp/aem';
  const initRes = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'Antigravity', version: '1.0.0' } },
    }),
  });
  const sessionId = initRes.headers.get('mcp-session-id');

  const toolsRes = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  });
  const toolsJson = await toolsRes.json();
  console.log('Available Tools on this connection:', toolsJson.result?.tools?.map(t => ({ name: t.name, desc: t.description?.slice(0, 80) })));

  console.log('--- Testing write-api dry call ---');
  const writeRes = await callAemCloudMcp('write-api', {
    aemUrl: 'https://author-p149251-e1522049.adobeaemcloud.com',
    code: `
      return {
        hasPatch: typeof aem.patch === 'function',
        hasPut: typeof aem.put === 'function',
        hasPost: typeof aem.post === 'function',
        hasDelete: typeof aem.delete === 'function'
      };
    `
  });
  console.log('write-api test execution response:', JSON.stringify(writeRes, null, 2));
}

main().catch(console.error);
