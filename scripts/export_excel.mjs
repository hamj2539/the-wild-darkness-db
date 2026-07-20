import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const outputDir = path.join(root, 'exports', 'excel');
const schemas = JSON.parse(await fs.readFile(path.join(dataDir, 'schemas.json'), 'utf8'));
const workbook = Workbook.create();
const summary = workbook.worksheets.add('Catalog');
summary.showGridLines = false;
summary.getRange('A1:D1').merge();
summary.getRange('A1').values = [['The Wild Darkness Database']];
summary.getRange('A2:D2').merge();
summary.getRange('A2').values = [['Source-first export - unknown game facts remain null until verified.']];
summary.getRange('A4:D4').values = [['Dataset', 'Records', 'Schema version', 'Update workflow']];
summary.getRange('A1:D1').format = { fill: '#1D2433', font: { bold: true, color: '#FFFFFF', size: 16 }, horizontalAlignment: 'center' };
summary.getRange('A2:D2').format = { font: { italic: true, color: '#4B5563' }, wrapText: true };
summary.getRange('A4:D4').format = { fill: '#D9EAD3', font: { bold: true }, horizontalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: '#94A3B8' } };

let row = 5;
for (const [dataset, fields] of Object.entries(schemas.datasets)) {
  const sheetName = dataset[0].toUpperCase() + dataset.slice(1);
  const sheet = workbook.worksheets.add(sheetName);
  sheet.showGridLines = false;
  const columns = [...schemas.common_required, ...fields];
  const entries = JSON.parse(await fs.readFile(path.join(dataDir, `${dataset}.json`), 'utf8'));
  sheet.getRangeByIndexes(0, 0, 1, columns.length).values = [columns];
  const rows = entries.map((entry) => columns.map((key) => {
    const value = entry[key];
    return value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : value;
  }));
  if (rows.length) sheet.getRangeByIndexes(1, 0, rows.length, columns.length).values = rows;
  const header = sheet.getRangeByIndexes(0, 0, 1, columns.length);
  header.format = { fill: '#1D2433', font: { bold: true, color: '#FFFFFF' }, wrapText: true, horizontalAlignment: 'center' };
  header.format.rowHeight = 32;
  sheet.freezePanes.freezeRows(1);
  sheet.getUsedRange().format.autofitColumns();
  sheet.getRangeByIndexes(0, 0, Math.max(2, rows.length + 1), columns.length).format.wrapText = true;
  summary.getRange(`A${row}:D${row}`).values = [[dataset, null, schemas.schema_version, 'Edit JSON -> validate -> regenerate']];
  summary.getRange(`B${row}`).formulas = [[`=COUNTA('${sheetName}'!A2:A1000)`]];
  row += 1;
}
summary.getRange(`A5:D${row - 1}`).format.borders = { preset: 'inside', style: 'thin', color: '#CBD5E1' };
summary.getRange(`A5:A${row - 1}`).format.font = { bold: true };
summary.getRange(`B5:B${row - 1}`).format.numberFormat = '#,##0';
summary.getRange(`A1:D${row - 1}`).format.autofitColumns();
summary.getRange('A1').format.columnWidth = 23;
summary.getRange('D1').format.columnWidth = 32;
summary.freezePanes.freezeRows(4);

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({ sheetName: 'Catalog', autoCrop: 'all', scale: 1, format: 'png' });
await fs.writeFile(path.join(outputDir, 'catalog-preview.png'), new Uint8Array(await preview.arrayBuffer()));
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 50 } });
if (errors.ndjson.includes('#')) throw new Error(`Formula error scan failed: ${errors.ndjson}`);
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(outputDir, 'the-wild-darkness-database.xlsx'));
console.log('Excel export created and formula scan passed.');
