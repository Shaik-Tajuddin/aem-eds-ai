import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const spec = await callAemCloudMcp('lookup-api-spec', {
    code: `
      return recipes.search('componentDefinition');
    `
  });
  console.log(spec.content[0].text);
}

main().catch(console.error);
