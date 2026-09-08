import fs from 'fs';

async function main() {
  const refTree = JSON.parse(fs.readFileSync('scratch/ref_content_tree.json', 'utf8'));
  const destTree = JSON.parse(fs.readFileSync('scratch/dest_content_tree.json', 'utf8'));

  console.log('=============================================');
  console.log('1. PAGE PROPERTIES COMPARISON');
  console.log('=============================================');
  console.log('Reference properties:');
  console.log('  title:', refTree.properties?.['jcr:title']);
  console.log('  description:', refTree.properties?.['jcr:description']);
  console.log('  tags:', refTree.properties?.['cq:tags']);
  console.log('  template:', refTree.properties?.['cq:template']);
  console.log('  componentType:', refTree.componentType);

  console.log('\nDestination properties:');
  console.log('  title:', destTree.properties?.['jcr:title']);
  console.log('  description:', destTree.properties?.['jcr:description']);
  console.log('  tags:', destTree.properties?.['cq:tags']);
  console.log('  template:', destTree.properties?.['cq:template']);
  console.log('  componentType:', destTree.componentType);

  console.log('\n=============================================');
  console.log('2. JCR COMPONENT STRUCTURE COMPARISON');
  console.log('=============================================');

  function summarizeNode(node, indent = '') {
    const lines = [];
    const id = node.id || '(no-id)';
    const type = node.componentType || '(no-type)';
    const props = node.properties || {};
    const relevantProps = [];
    if (props['jcr:title']) relevantProps.push(`title="${props['jcr:title']}"`);
    if (props['title']) relevantProps.push(`title="${props['title']}" (${props['titleType'] || ''})`);
    if (props['text']) relevantProps.push(`text="${props['text'].replace(/\n/g, ' ').slice(0, 60)}..."`);
    if (props['name']) relevantProps.push(`name="${props['name']}"`);
    if (props['model']) relevantProps.push(`model="${props['model']}"`);
    if (props['fragmentVariationPath']) relevantProps.push(`xfPath="${props['fragmentVariationPath']}"`);
    if (props['image']) relevantProps.push(`image="${props['image']}"`);

    lines.push(`${indent}• [${id}] ${type} ${relevantProps.join(' ')}`);
    for (const child of node.items || []) {
      lines.push(...summarizeNode(child, indent + '    '));
    }
    return lines;
  }

  console.log('Reference JCR Tree:');
  console.log(summarizeNode(refTree).join('\n'));

  console.log('\nDestination JCR Tree:');
  console.log(summarizeNode(destTree).join('\n'));

  console.log('\n=============================================');
  console.log('3. XF CONTENT DEEP DIVE (CONTRIBUTORS)');
  console.log('=============================================');
  // Check HTML of reference page around contributors
  const refHtml = fs.readFileSync('scratch/ref_page.html', 'utf8');
  const destHtml = fs.readFileSync('scratch/dest_page.html', 'utf8');

  console.log('Reference HTML length:', refHtml.length);
  console.log('Destination HTML length:', destHtml.length);
}

main().catch(console.error);
