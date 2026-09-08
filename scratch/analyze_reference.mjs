import fs from 'fs';

const html = fs.readFileSync('scratch/reference_plain.html', 'utf8');

// Basic regex extraction of text and components
const titles = [...html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gis)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
const paragraphs = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gis)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(p => p.length > 0);
const images = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gis)].map(m => m[1]);
const cmpTypes = [...html.matchAll(/data-cmp-data-layer="([^"]+)"/gis)].map(m => m[1]);

console.log('=== TITLES / HEADINGS ===');
console.log(titles);

console.log('=== PARAGRAPHS (First 10) ===');
console.log(paragraphs.slice(0, 10));

console.log('=== IMAGES ===');
console.log(images);

// Check for component markers or class names
const cmpClasses = [...html.matchAll(/class=["']([^"']*(?:cmp-|wknd-)[^"']*)["']/gis)].map(m => m[1]);
console.log('=== CMP / WKND CLASSES (Unique) ===');
console.log([...new Set(cmpClasses)].slice(0, 20));
