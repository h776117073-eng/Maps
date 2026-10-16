# OpenStreetMap importer for Ibb, Yemen

This importer builds a separate, attributable dataset from OpenStreetMap (OSM), using Overpass API. It does **not** extract Google Maps data and does not merge its output with the 71 existing app seed records.

## Output files

- \`data/openstreetmap_ibb_places.csv\` — spreadsheet-friendly records, including original OSM tags.
- \`data/openstreetmap_ibb_places.geojson\` — map-ready point features with tags and OSM object links.
- \`data/openstreetmap_ibb_metadata.json\` — run time, endpoint, approximate bounding box, counts, query, attribution and licence.

## Run from a local checkout

Requires Python 3.10+ and network access.

\`\`\`bash
python3 scripts/import_osm_ibb.py
\`\`\`

The default rectangle is approximate: south \`13.94\`, west \`44.12\`, north \`14.03\`, east \`44.22\`. It may include outskirts and does not prove complete coverage of the official city boundary. You can override it with environment variables \`IBB_SOUTH\`, \`IBB_WEST\`, \`IBB_NORTH\`, and \`IBB_EAST\`.

The script requests mapped shopping, amenity, office, tourism, leisure, healthcare, craft, historic, public transport, station, government, emergency, club, place, named building and address-bearing objects. It retries several public Overpass instances if the first one is unavailable. Respect public service rate limits; run only when needed.

## GitHub Actions

The workflow \`.github/workflows/import-osm-ibb.yml\` can run on push to its own code or via **Actions → Import Ibb OSM dataset → Run workflow**. A successful run commits only the generated OSM files. It requires Actions to be enabled and the repository Actions token to have Contents write permission.

## Coverage and data quality

OSM is community-mapped: completeness varies street by street. The importer deduplicates by OSM object type and ID, not by business name; duplicate businesses with separate OSM objects may still exist. It does not claim all Ibb establishments have been mapped, nor that contact data is current. Validate high-priority entries with the business or an authoritative source.

## Licence and attribution

Data retrieved from OpenStreetMap is distributed under the Open Database License (ODbL). Attribution must remain visible when publicly redistributing or presenting the dataset:

**© OpenStreetMap contributors — https://www.openstreetmap.org/copyright**

Check the ODbL requirements before combining this data with external databases or distributing a derived database.
