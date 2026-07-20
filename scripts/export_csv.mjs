import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const outputDir = path.join(root, 'exports', 'csv');
const schemas = JSON.parse(await fs.readFile(path.join(dataDir, 'schemas.json'), 'utf8'));
const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const flatten = (value) => value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : value;

await fs.mkdir(outputDir, { recursive: true });
for (const [dataset, fields] of Object.entries(schemas.datasets)) {
  const columns = [...schemas.common_required, ...fields];
  const entries = JSON.parse(await fs.readFile(path.join(dataDir, `${dataset}.json`), 'utf8'));
  const lines = [columns.map(escape).join(',')];
  for (const entry of entries) lines.push(columns.map((column) => escape(flatten(entry[column]))).join(','));
  await fs.writeFile(path.join(outputDir, `${dataset}.csv`), `${lines.join('\n')}\n`, 'utf8');
}
console.log(`Exported ${Object.keys(schemas.datasets).length} CSV files to exports/csv.`);
