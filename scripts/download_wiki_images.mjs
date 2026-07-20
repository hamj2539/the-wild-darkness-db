import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const imageFolder = {
  characters: 'classes',
  totems: 'totems',
  magic: 'items',
  foods: 'items',
  weapons: 'weapons',
  armor: 'armor',
  accessories: 'accessories',
  materials: 'items',
  monsters: 'monsters',
  bosses: 'bosses',
  maps: 'maps',
  buildings: 'ui',
  items: 'items'
};
const datasets = Object.keys(imageFolder);
const tasks = [];

for (const dataset of datasets) {
  const entries = JSON.parse(await fs.readFile(path.join(dataDir, `${dataset}.json`), 'utf8'));
  for (const entry of entries) tasks.push({ dataset, folder: imageFolder[dataset], id: entry.id, title: entry.name_en });
}

const attribution = [];
const missing = [];
const workers = 24;
let cursor = 0;

async function download(task) {
  const api = new URL('https://the-wild-darkness.fandom.com/api.php');
  api.search = new URLSearchParams({ action: 'query', titles: task.title, prop: 'pageimages', format: 'json', pithumbsize: '256' });
  const response = await fetch(api);
  if (!response.ok) throw new Error(`API ${response.status}`);
  const json = await response.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const source = page?.thumbnail?.source;
  if (!source) return missing.push({ ...task, reason: 'No page thumbnail' });
  const image = await fetch(source);
  if (!image.ok) return missing.push({ ...task, reason: `Image ${image.status}` });
  const contentType = image.headers.get('content-type') || '';
  const extension = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png';
  const output = path.join(root, 'images', task.folder, `${task.id}.${extension}`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(await image.arrayBuffer()));
  attribution.push({ id: task.id, dataset: task.dataset, title: task.title, file: path.relative(root, output).replaceAll('\\', '/'), source_page: `https://the-wild-darkness.fandom.com/wiki/${encodeURIComponent(task.title.replaceAll(' ', '_'))}`, source_image: source, license: 'CC-BY-SA (per The Wild Darkness Wiki footer unless otherwise noted)' });
}

async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor++];
    try { await download(task); }
    catch (error) { missing.push({ ...task, reason: error.message }); }
  }
}

await Promise.all(Array.from({ length: workers }, worker));
attribution.sort((a, b) => a.dataset.localeCompare(b.dataset) || a.id.localeCompare(b.id));
missing.sort((a, b) => a.dataset.localeCompare(b.dataset) || a.id.localeCompare(b.id));
await fs.writeFile(path.join(root, 'images', 'attribution.json'), `${JSON.stringify(attribution, null, 2)}\n`, 'utf8');
await fs.writeFile(path.join(root, 'images', 'missing.json'), `${JSON.stringify(missing, null, 2)}\n`, 'utf8');
console.log(`Downloaded ${attribution.length} image assets; ${missing.length} records had no downloadable thumbnail.`);
