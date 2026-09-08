import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const spec = await callAemCloudMcp('lookup-api-spec', {
    code: `
      return recipes.get('add-component-to-page');
    `
  });
  console.log(spec.content[0].text);
}

main().catch(console.error);
