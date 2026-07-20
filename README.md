# The Wild Darkness Database

A source-first, patchable game database for The Wild Darkness. The repository is intentionally initialized with **no unverified game facts**. Add an entry only when it has a traceable source URL, or use `null` for an unconfirmed field.

## Quick start

```powershell
node scripts/validate.mjs
node scripts/export_csv.mjs
node scripts/export_excel.mjs
python scripts/export_pdf.py
```

Open `website/index.html` in a static web server. The site reads directly from `data/*.json`, so new validated entries become searchable without a frontend build step.

## Data contract

- UTF-8 JSON, 2-space indentation, stable English `snake_case` IDs and keys.
- Every record includes the common fields specified in `docs/data-contract.md`.
- `source` is an array of source URLs. Do not use an empty source list on a populated record.
- Unknown facts are `null`; never infer a value from related items.
- Update `data/changelog.json` in the same change as the data it describes.

## Workflow

1. Copy an object from `data/templates.json` into the relevant dataset.
2. Record a verifiable URL in `source` and the game version in `version`.
3. Set unconfirmed fields to `null`.
4. Run validation and regenerate exports.

## Generated artifacts

- CSV: `exports/csv/`
- Excel: `exports/excel/`
- PDF: `exports/pdf/`

The generated artifacts are ignored by Git because they are reproducible from the JSON data.
