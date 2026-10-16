# Ibb Maps repository: data audit and collection status

**Audit date:** 2026-10-16
**Repository:** [h776117073-eng/Maps](https://github.com/h776117073-eng/Maps)
**Branch inspected:** `main`
**Source inventory:** `src/data/ibbData.ts`, `src/components/RealGoogleMap.tsx`, `src/components/VisualInspection.tsx`, `src/App.tsx`

## Result

This was a repository/code audit, **not a completed visual scan of Google Maps**. The live AI Studio page URL was not present in the repository, and the connected personal browser session was unavailable. A complete citywide scan is therefore not claimed.

The current application embeds **71 static seed records** across 10 categories:

| Category ID | Records |
| --- | ---: |
| `health` | 9 |
| `education` | 9 |
| `landmarks` | 9 |
| `markets` | 8 |
| `restaurants` | 7 |
| `hotels` | 5 |
| `government` | 8 |
| `banking` | 7 |
| `transport` | 5 |
| `religious` | 4 |
| **Total** | **71** |

## Quality findings

- Unique record IDs: **71/71**.
- Duplicate names after basic Arabic normalization: **0**.
- Exact duplicate coordinate pairs: **0**.
- Empty core fields (name/address/phone/hours/latitude/longitude): `{"name":0,"address":0,"phone":0,"hours":0,"lat":0,"lng":0}`.
- Entries marked `verified: true` in application source: **71/71**.
- Entries with blank or explicitly unavailable phone value: **8**.

**Important:** the `verified: true` flag is only a field set in source code. Records have no per-business independent evidence URL or verification timestamp. It is not sufficient proof that an establishment exists or that its phone, address, hours, rating, services, or coordinates are correct. The exported files therefore mark every record `NOT_INDEPENDENTLY_VERIFIED`.

## What the map components do

- `RealGoogleMap.tsx` renders the existing `places` array as map markers; the default view is zoom level 14. A Google Places search/collection workflow was not found in this component.
- `App.tsx` initializes the map from the same static `IBB_PLACES` array and exports that in-memory list.
- `VisualInspection.tsx` contains preset observation points and an inspection-style interface; its source does not implement a real citywide Google Maps listing crawler. Selecting a preset moves the map to that preset.
- Repository metadata has no homepage and GitHub Pages is disabled. No live map URL was discovered in the repo, so the actual deployed map could not be visually traversed in this run.

## Google Maps data-use boundary

Google Maps Platform's terms prohibit scraping/exporting Maps content for use outside the service, including bulk extraction and copying business names or addresses. Manually zooming and clicking the UI does not make bulk export of Google Maps listings an appropriate method for a separate downloadable business directory. Official terms: https://cloud.google.com/maps-platform/terms?hl=en-EN

## Recommended path to a dependable citywide dataset

1. Use a source whose licence permits download and redistribution (for example, OpenStreetMap data under ODbL, with required attribution/licence notices), plus official public-sector lists and direct business-owner submissions.
2. Store per-record provenance: source URL or source ID, retrieval date, confidence, and a separate `verified_at` value. Do not automatically mark entries verified.
3. Deduplicate by name/address/coordinates and flag uncertain matches for review. Validate contact details and opening hours independently.
4. Use Google Maps for interactive navigation/visual reference within its terms, not as the source of a bulk exported dataset.
5. **Credential hygiene:** a Google Maps browser key is embedded in source-controlled files. Restrict it to intended website referrers and APIs in Google Cloud; rotate it if it was not intended to be public. Keep server-side secrets out of Git.

## Files in this audit

- `ibb_seed_inventory.csv` — spreadsheet-friendly export of the 71 records already embedded in the repository.
- `ibb_seed_inventory.json` — JSON export with explicit verification caveats.
- These files are inventory/export files only, **not** a complete or independently verified list of businesses in Ibb.
