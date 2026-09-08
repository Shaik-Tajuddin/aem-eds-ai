import fs from 'fs';

async function testSse() {
  const tokensRaw = fs.readFileSync('C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\mcp_oauth_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensRaw);
  const aemCloud = tokens['https://mcp.adobeaemcloud.com/adobe/mcp/aem'];
  const token = aemCloud?.token?.access_token;

  const mcpUrl = 'https://mcp.adobeaemcloud.com/adobe/mcp/aem';

  console.log('Testing GET with text/event-stream...');
  const res = await fetch(mcpUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
  });

  console.log('GET status:', res.status);
  console.log('GET headers:', Object.fromEntries(res.headers.entries()));

  if (res.ok) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (let i = 0; i < 3; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      console.log('Chunk:', decoder.decode(value));
    }
  } else {
    console.log('Error body:', await res.text());
  }
}

testSse();
