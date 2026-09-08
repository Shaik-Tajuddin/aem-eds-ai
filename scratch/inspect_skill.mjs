import fs from 'fs';

async function testSkill() {
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

  console.log('Skill detail for find-page-by-url:');
  const detail = await callTool('lookup-api-spec', {
    aemUrl,
    code: `return await skills.get('find-page-by-url');`,
  });
  console.log(JSON.stringify(detail, null, 2));

  console.log('\nSkill plan for find-page-by-url:');
  const plan = await callTool('lookup-api-spec', {
    aemUrl,
    code: `return await skills.plan('find-page-by-url');`,
  });
  console.log(JSON.stringify(plan, null, 2));
}

testSkill().catch(console.error);
