import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const images = [
  ['classes', 'adventurer', 'Adventurer'],
  ['foods', 'bread', 'Bread'],
  ['items', 'backpack', 'Backpack'],
  ['bosses', 'woken_machine', 'Woken Machine'],
  ['monsters', 'ground_snake', 'Ground Snake'],
  ['weapons', 'stone_knife', 'Stone Knife']
];
const attribution = [];

for (const [folder, id, title] of images) {
  const api = new URL('https://the-wild-darkness.fandom.com/api.php');
  api.search = new URLSearchParams({ action: 'query', titles: title, prop: 'pageimages', format: 'json', pithumbsize: '256' });
  const response = await fetch(api);
  if (!response.ok) throw new Error(`API request failed for ${title}: ${response.status}`);
  const json = await response.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const source = page?.thumbnail?.source;
  if (!source) throw new Error(`No thumbnail found for ${title}`);
  const image = await fetch(source);
  if (!image.ok) throw new Error(`Image request failed for ${title}: ${image.status}`);
  const output = path.join(root, 'images', folder, `${id}.png`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, Buffer.from(await image.arrayBuffer()));
  attribution.push({ id, title, file: path.relative(root, output).replaceAll('\\', '/'), source_page: `https://the-wild-darkness.fandom.com/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`, source_image: source, license: 'CC-BY-SA (per The Wild Darkness Wiki footer unless otherwise noted)' });
}

await fs.writeFile(path.join(root, 'images', 'attribution.json'), `${JSON.stringify(attribution, null, 2)}\n`, 'utf8');
console.log(`Downloaded ${attribution.length} wiki image assets.`);
