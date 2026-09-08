import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  console.log('--- List Capabilities ---');
  const caps = await callAemCloudMcp('list-aem-capabilities', { aemUrl });
  console.log('Capabilities:', JSON.stringify(caps, null, 2));

  console.log('--- Lookup Recipe add-component-to-page ---');
  const spec = await callAemCloudMcp('lookup-api-spec', { recipe: 'add-component-to-page' });
  console.log('Spec:', JSON.stringify(spec, null, 2));
}

main().catch(console.error);
