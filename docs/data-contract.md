# Data contract

All datasets are UTF-8 JSON arrays. Every entity must include:

```json
{
  "id": "stable_english_id",
  "name_en": "",
  "name_th": "",
  "description": "",
  "version": "",
  "source": ["https://example.com/verified-source"],
  "updated_at": "2026-07-20"
}
```

`updated_at` is an ISO date (`YYYY-MM-DD`). All non-common fields for a dataset are defined in `data/schemas.json`. A field whose value is not confirmed must be `null`. Arrays can be empty only where the source proves that none apply, or when a record is not yet publishable. IDs never change after publication.

## Source policy

Prefer official patch notes or in-game evidence. Community references are permitted only when they are specific, publicly reachable, and independently reviewable. Store direct URLs, not search-result pages. When a patch changes a fact, preserve the old entry in the changelog and update `version` and `updated_at`.
