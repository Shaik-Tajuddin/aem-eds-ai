import fs from 'fs';

async function testInit() {
  const tokensRaw = fs.readFileSync('C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensRaw);
  const aemCloud = tokens['https://mcp.adobeaemcloud.com/adobe/mcp/aem'];
  const token = aemCloud?.token?.access_token;

  const mcpUrl = 'https://mcp.adobeaemcloud.com/adobe/mcp/aem';

  console.log('Sending initialize request with Accept: application/json, text/event-stream...');
  const res = await fetch(mcpUrl, {
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
        clientInfo: {
          name: 'Antigravity',
          version: '1.0.0',
        },
      },
    }),
  });

  console.log('Init status:', res.status);
  console.log('Init response headers:', Object.fromEntries(res.headers.entries()));
  const body = await res.text();
  console.log('Init response body:', body);

  const sessionId = res.headers.get('mcp-session-id');
  console.log('Session ID from header:', sessionId);

  if (sessionId) {
    // Send notifications/initialized
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

    // Now call tools/list with mcp-session-id
    console.log('\n--- Calling tools/list with session ID ---');
    const listRes = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
    });
    console.log('List status:', listRes.status);
    const listBody = await listRes.text();
    console.log('List body (first 1500 chars):', listBody.slice(0, 1500));
    fs.writeFileSync('scratch/aem_cloud_tools.json', listBody);
  }
}

testInit();
