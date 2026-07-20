const datasets = ['characters', 'totems', 'magic', 'foods', 'recipes', 'weapons', 'armor', 'accessories', 'materials', 'monsters', 'bosses', 'maps', 'buildings', 'quests', 'items'];
const select = document.querySelector('#dataset');
const search = document.querySelector('#search');
const field = document.querySelector('#field');
const results = document.querySelector('#results');
const coverage = document.querySelector('#coverage');
const count = document.querySelector('#count');
const template = document.querySelector('#card-template');

for (const dataset of datasets) select.add(new Option(dataset, dataset));
let records = [];
let coverageRecords = [];
const label = (key) => key.replaceAll('_', ' ');
const printable = (value) => Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value ? Object.entries(value).map(([k, v]) => `${k}: ${v ?? 'null'}`).join(', ') : String(value ?? 'null');

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = records.filter((record) => !field.value ? JSON.stringify(record).toLocaleLowerCase().includes(query) : String(record[field.value] ?? '').toLocaleLowerCase().includes(query));
  count.textContent = `${filtered.length} รายการใน ${select.value}`;
  results.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('p'); empty.className = 'empty';
    empty.textContent = records.length ? 'ไม่พบข้อมูลที่ตรงกับคำค้น' : 'ยังไม่มีข้อมูลที่ยืนยันแล้วในหมวดนี้';
    results.append(empty); return;
  }
  for (const record of filtered) {
    const card = template.content.cloneNode(true);
    const image = window.WILD_DARKNESS_IMAGES?.[`${select.value}:${record.id}`];
    if (image) { const element = card.querySelector('.record-image'); element.src = `../${image.file}`; element.alt = image.title; element.hidden = false; }
    card.querySelector('h2').textContent = record.name_th && record.name_en ? `${record.name_th} / ${record.name_en}` : record.name_en || record.name_th || record.id;
    card.querySelector('.id').textContent = record.id;
    card.querySelector('.description').textContent = record.description || '';
    const details = card.querySelector('dl');
    Object.entries(record).filter(([key]) => !['id','name_en','name_th','description','source','updated_at'].includes(key)).forEach(([key, value]) => {
      const term = document.createElement('dt'); term.textContent = label(key);
      const definition = document.createElement('dd'); definition.textContent = printable(value);
      details.append(term, definition);
    });
    card.querySelector('.meta').textContent = `Version ${record.version || 'null'} · Updated ${record.updated_at || 'null'}`;
    const sources = card.querySelector('.sources'); sources.textContent = 'Source: ';
    (record.source || []).forEach((url, index) => { const link = document.createElement('a'); link.href = url; link.textContent = `reference ${index + 1}`; link.target = '_blank'; link.rel = 'noreferrer'; sources.append(link, document.createTextNode(' ')); });
    results.append(card);
  }
}
async function load() {
  if (window.WILD_DARKNESS_DATA?.[select.value]) { records = window.WILD_DARKNESS_DATA[select.value]; render(); return; }
  try { records = await fetch(`../data/${select.value}.json`).then((response) => { if (!response.ok) throw new Error(response.status); return response.json(); }); render(); }
  catch { count.textContent = 'เปิดผ่าน static web server เพื่อโหลดข้อมูล'; results.innerHTML = '<p class="empty">ตัวอย่าง: <code>python -m http.server</code> จากโฟลเดอร์โครงการ แล้วเปิด /website/</p>'; }
}
function setFields() { const fields = [...new Set(records.flatMap((record) => Object.keys(record)))].filter((key) => !['id','name_en','name_th','description','source','updated_at'].includes(key)); field.replaceChildren(new Option('All fields', '')); fields.forEach((key) => field.add(new Option(label(key), key))); }
async function loadCoverage() { try { coverageRecords = window.WILD_DARKNESS_DATA?.coverage || await fetch('../data/coverage.json').then((response) => response.json()); coverage.replaceChildren(); coverageRecords.forEach((record) => { const item = document.createElement('p'); item.textContent = `${record.dataset}: ${record.status}`; coverage.append(item); }); } catch { coverage.hidden = true; } }
select.addEventListener('change', async () => { await load(); setFields(); }); search.addEventListener('input', render); field.addEventListener('change', render); load().then(() => { setFields(); loadCoverage(); });
