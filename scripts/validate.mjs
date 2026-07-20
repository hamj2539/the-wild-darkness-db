import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const schemas = JSON.parse(await fs.readFile(path.join(dataDir, 'schemas.json'), 'utf8'));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const errors = [];

for (const [dataset, fields] of Object.entries(schemas.datasets)) {
  const file = path.join(dataDir, `${dataset}.json`);
  const entries = JSON.parse(await fs.readFile(file, 'utf8'));
  if (!Array.isArray(entries)) errors.push(`${dataset}: root must be an array`);
  const ids = new Set();
  for (const [index, entry] of entries.entries()) {
    const label = `${dataset}[${index}]`;
    for (const key of [...schemas.common_required, ...fields]) {
      if (!(key in entry)) errors.push(`${label}: missing '${key}'`);
    }
    if (!idPattern.test(entry.id ?? '')) errors.push(`${label}: id must be stable snake_case English`);
    if (ids.has(entry.id)) errors.push(`${label}: duplicate id '${entry.id}'`);
    ids.add(entry.id);
    if (!datePattern.test(entry.updated_at ?? '')) errors.push(`${label}: updated_at must be YYYY-MM-DD`);
    if (!Array.isArray(entry.source) || entry.source.length === 0) errors.push(`${label}: populated records require at least one source URL`);
    if (Array.isArray(entry.source) && entry.source.some((url) => typeof url !== 'string' || !/^https?:\/\//.test(url))) errors.push(`${label}: source entries must be http(s) URLs`);
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Validation passed: all datasets conform to the source-first contract.');
}
