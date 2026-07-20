import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const output = path.join(root, 'website', 'data.js');
const schemas = JSON.parse(await fs.readFile(path.join(dataDir, 'schemas.json'), 'utf8'));
const bundle = {};

for (const dataset of [...Object.keys(schemas.datasets), 'coverage']) {
  bundle[dataset] = JSON.parse(await fs.readFile(path.join(dataDir, `${dataset}.json`), 'utf8'));
}

const images = JSON.parse(await fs.readFile(path.join(root, 'images', 'attribution.json'), 'utf8'));
const imageIndex = Object.fromEntries(images.map((image) => [`${image.dataset}:${image.id}`, image]));

await fs.writeFile(output, `window.WILD_DARKNESS_DATA = ${JSON.stringify(bundle)};\nwindow.WILD_DARKNESS_IMAGES = ${JSON.stringify(imageIndex)};\n`, 'utf8');
console.log(`Built offline data bundle: ${path.relative(root, output)}`);
