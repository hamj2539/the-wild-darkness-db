const datasets = ['characters', 'totems', 'magic', 'foods', 'recipes', 'weapons', 'armor', 'accessories', 'materials', 'monsters', 'bosses', 'maps', 'buildings', 'quests', 'items'];
const select = document.querySelector('#dataset');
const search = document.querySelector('#search');
const field = document.querySelector('#field');
const results = document.querySelector('#results');
const coverage = document.querySelector('#coverage');
const count = document.querySelector('#count');
const template = document.querySelector('#card-template');
const detailDialog = document.querySelector('#detail-dialog');
const closeDetail = document.querySelector('#close-detail');

for (const dataset of datasets) select.add(new Option(dataset, dataset));
let records = [];
const label = (key) => key.replaceAll('_', ' ');
const printable = (value) => Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value ? Object.entries(value).map(([key, item]) => `${key}: ${item ?? 'null'}`).join(', ') : String(value ?? 'null');
const displayName = (record) => record.name_th && record.name_en ? `${record.name_th} / ${record.name_en}` : record.name_en || record.name_th || record.id;
const imageFor = (record) => window.WILD_DARKNESS_IMAGES?.[`${select.value}:${record.id}`];

function setImage(element, image) {
  if (!image) { element.removeAttribute('src'); element.hidden = true; return; }
  element.src = `../${image.file}`;
  element.alt = image.title;
  element.hidden = false;
}

function showDetail(record) {
  const image = imageFor(record);
  setImage(detailDialog.querySelector('.record-image'), image);
  detailDialog.querySelector('h2').textContent = displayName(record);
  detailDialog.querySelector('.id').textContent = record.id;
  detailDialog.querySelector('.description').textContent = record.description || '';
  const details = detailDialog.querySelector('dl');
  details.replaceChildren();
  Object.entries(record).filter(([key]) => !['id', 'name_en', 'name_th', 'description', 'source', 'updated_at'].includes(key)).forEach(([key, value]) => {
    const term = document.createElement('dt'); term.textContent = label(key);
    const definition = document.createElement('dd'); definition.textContent = printable(value);
    details.append(term, definition);
  });
  detailDialog.querySelector('.meta').textContent = `Version ${record.version || 'null'} · Updated ${record.updated_at || 'null'}`;
  const sources = detailDialog.querySelector('.sources');
  sources.replaceChildren('Source: ');
  (record.source || []).forEach((url, index) => {
    const link = document.createElement('a'); link.href = url; link.textContent = `reference ${index + 1}`; link.target = '_blank'; link.rel = 'noreferrer';
    sources.append(link, document.createTextNode(' '));
  });
  detailDialog.showModal();
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = records.filter((record) => !field.value ? JSON.stringify(record).toLocaleLowerCase().includes(query) : String(record[field.value] ?? '').toLocaleLowerCase().includes(query));
  count.textContent = `${filtered.length} records in ${select.value}`;
  results.replaceChildren();
  if (!filtered.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = records.length ? 'No matching records.' : 'No verified records in this dataset yet.'; results.append(empty); return; }
  for (const record of filtered) {
    const card = template.content.cloneNode(true);
    setImage(card.querySelector('.record-image'), imageFor(record));
    card.querySelector('h2').textContent = displayName(record);
    card.querySelector('.id').textContent = record.id;
    card.querySelector('.card-summary').addEventListener('click', () => showDetail(record));
    results.append(card);
  }
}

async function load() {
  if (window.WILD_DARKNESS_DATA?.[select.value]) { records = window.WILD_DARKNESS_DATA[select.value]; render(); return; }
  try { records = await fetch(`../data/${select.value}.json`).then((response) => { if (!response.ok) throw new Error(response.status); return response.json(); }); render(); }
  catch { count.textContent = 'Offline data bundle is missing.'; }
}
function setFields() { const fields = [...new Set(records.flatMap((record) => Object.keys(record)))].filter((key) => !['id', 'name_en', 'name_th', 'description', 'source', 'updated_at'].includes(key)); field.replaceChildren(new Option('All fields', '')); fields.forEach((key) => field.add(new Option(label(key), key))); }
async function loadCoverage() { try { const records = window.WILD_DARKNESS_DATA?.coverage || await fetch('../data/coverage.json').then((response) => response.json()); coverage.replaceChildren(); records.forEach((record) => { const item = document.createElement('p'); item.textContent = `${record.dataset}: ${record.status}`; coverage.append(item); }); } catch { coverage.hidden = true; } }

closeDetail.addEventListener('click', () => detailDialog.close());
detailDialog.addEventListener('click', (event) => { if (event.target === detailDialog) detailDialog.close(); });
select.addEventListener('change', async () => { await load(); setFields(); });
search.addEventListener('input', render);
field.addEventListener('change', render);
load().then(() => { setFields(); loadCoverage(); });
