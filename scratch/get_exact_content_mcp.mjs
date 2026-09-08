import fs from 'fs';

async function fetchExactContent() {
  const tokensRaw = fs.readFileSync('C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensRaw);
  const aemCloud = tokens['https://mcp.adobeaemcloud.com/adobe/mcp/aem'];
  const token = aemCloud?.token?.access_token;
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

  await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
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

  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const pageId = 'ncOvO8-G3JAhS7eHqo10fkfuXAFmm0vrLx7OpYFGynAJyfz7Y-2fkqcFOiDeaf9w';

  console.log(`Fetching content for pageId ${pageId}...`);
  const content = await callTool('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${pageId}/content');
      return r.body;
    `,
  });

  fs.writeFileSync('scratch/mcp_exact_about_us_content.json', JSON.stringify(content, null, 2));
  console.log('Saved to scratch/mcp_exact_about_us_content.json');
}

fetchExactContent().catch(console.error);
