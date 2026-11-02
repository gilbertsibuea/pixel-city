# Kota Pixel

Dynamic SVG API that renders a pixel-art city from a developer's **public** GitHub activity. One Markdown line — no Actions, no user tokens.

```markdown
![Kota Pixel](https://<API-DOMAIN>/v1/city/<GITHUB_USERNAME>.svg)
```

## Endpoint

```http
GET /v1/city/{username}.svg
```

| Query | Default | Notes |
|---|---|---|
| `limit` | `18` | Buildings shown (1–18) |
| `theme` | `auto` | `auto` \| `light` \| `dark` |

Response: `image/svg+xml` city art. Buildings map to public repos (by your commit contributions in the last 12 months). Window lights follow 30-day commits; streak ≥ 7 days enables smoke/flags; merged PRs (30d) add cars (max 3); stars add trees (max 6).

Data is public-only and may lag because of cache (metrics ~6h, SVG ~1h) and GitHub's image proxy.

## Local development

```bash
cp .dev.vars.example .dev.vars
# put a fine-grained GitHub PAT in .dev.vars

npm install
npm run dev
```

Open:

- `http://localhost:8787/preview` — gallery: tiap building + lingkungan
- `http://localhost:8787/v1/preview/building/hut.svg` — satu stage (hut, wood-house, stone-shop, midrise, skyscraper)
- `http://localhost:8787/v1/preview/environment.svg` — langit, jalan, pohon, mobil, efek, palette
- `http://localhost:8787/v1/preview/stages.svg` — semua stage dalam satu kota
- `http://localhost:8787/v1/city/octocat.svg` — kota dari data GitHub

```bash
npm test
```

## Deploy

1. Create a KV namespace and put its id in `wrangler.jsonc` (`CITY_CACHE`).
2. `npx wrangler secret put GITHUB_TOKEN`
3. `npm run deploy`

## Mapping (MVP)

| Commits (12m) | Building |
|---|---|
| 1–19 | Gubuk |
| 20–99 | Rumah kayu |
| 100–299 | Toko batu |
| 300–799 | Gedung bertingkat |
| 800+ | Pencakar langit |

Sprites live under `src/visual/buildings` (from `docs/building`).
