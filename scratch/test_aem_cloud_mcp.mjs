import fs from 'fs';

async function testAemCloudMcp() {
  const tokensRaw = fs.readFileSync('C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensRaw);
  const aemCloud = tokens['https://mcp.adobeaemcloud.com/adobe/mcp/aem'];
  const token = aemCloud?.token?.access_token;
  console.log('Got access token:', Boolean(token), token ? token.slice(0, 30) + '...' : '');

  const mcpUrl = 'https://mcp.adobeaemcloud.com/adobe/mcp/aem';

  // 1. List tools
  console.log('\n--- Calling tools/list ---');
  const listRes = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }),
  });

  console.log('List HTTP status:', listRes.status);
  const listText = await listRes.text();
  console.log('List response (first 1000 chars):', listText.slice(0, 1000));
  fs.writeFileSync('scratch/mcp_tools_list.json', listText);
}

testAemCloudMcp();
