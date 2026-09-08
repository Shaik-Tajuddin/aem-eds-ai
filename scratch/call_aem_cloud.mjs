import fs from 'fs';

async function runMcp() {
  const tokensRaw = fs.readFileSync('C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensRaw);
  const aemCloud = tokens['https://mcp.adobeaemcloud.com/adobe/mcp/aem'];
  const token = aemCloud?.token?.access_token;
  const mcpUrl = 'https://mcp.adobeaemcloud.com/adobe/mcp/aem';

  // 1. Initialize
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
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'Antigravity', version: '1.0.0' },
      },
    }),
  });
  const sessionId = initRes.headers.get('mcp-session-id');
  console.log('Session ID:', sessionId);

  await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  });

  async function callTool(name, args) {
    const res = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    });
    const json = await res.json();
    return json.result;
  }

  // 2. Call list-aem-environments
  console.log('\n--- Calling list-aem-environments ---');
  const envs = await callTool('list-aem-environments', {});
  console.log('Environments:', JSON.stringify(envs, null, 2));

  // 3. Lookup api spec for reading pages / content
  console.log('\n--- Calling lookup-api-spec for pages ---');
  const spec = await callTool('lookup-api-spec', {
    aemUrl: 'https://author-p149251-e1522049.adobeaemcloud.com',
    query: 'get page content or jcr nodes for sites pages',
  });
  console.log('API Spec:', JSON.stringify(spec, null, 2));
}

runMcp().catch(console.error);
