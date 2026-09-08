import fs from 'fs';

async function getPagesWithLimit50() {
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
  const siteId = '-HGYGzO-werD3ijYEgtdCUtHn-Q-Z6hPdvMgsKH0ol_TJLgdBm7030xGl_kJnf0n';

  console.log('Fetching pages with limit: 20...');
  const res = await callTool('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages', { siteId: '${siteId}', limit: 20 });
      return r.body;
    `,
  });

  fs.writeFileSync('scratch/wknd_pages.json', JSON.stringify(res, null, 2));
  console.log('Saved to scratch/wknd_pages.json');
}

getPagesWithLimit50().catch(console.error);
