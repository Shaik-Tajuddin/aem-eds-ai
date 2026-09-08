import fs from 'fs';

async function findLanguageMastersAboutUs() {
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

  console.log('Querying pages for authorPath /content/wknd/language-masters/en/about-us...');
  const res = await callTool('read-api', {
    aemUrl,
    code: `
      const r1 = await aem.get('/adobe/experimental/aspm-expires-20251231/pages', { 
        authorPath: '/content/wknd/language-masters/en/about-us',
        limit: 10 
      });
      return r1.body;
    `,
  });

  console.log('Result:', JSON.stringify(res, null, 2));

  // Also read content of QF59FQAzVQvUEihK31Eejc31riA4vXBjpUAdyWg-VMaj28KnZzP2zaPFwsDm1pMG (about-us)
  console.log('\nReading content of page QF59FQAzVQvUEihK31Eejc31riA4vXBjpUAdyWg-VMaj28KnZzP2zaPFwsDm1pMG...');
  const contentRes = await callTool('read-api', {
    aemUrl,
    code: `
      const r2 = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/QF59FQAzVQvUEihK31Eejc31riA4vXBjpUAdyWg-VMaj28KnZzP2zaPFwsDm1pMG/content');
      return r2.body;
    `,
  });

  fs.writeFileSync('scratch/mcp_about_us_content.json', JSON.stringify(contentRes, null, 2));
  console.log('Saved content to scratch/mcp_about_us_content.json');
}

findLanguageMastersAboutUs().catch(console.error);
