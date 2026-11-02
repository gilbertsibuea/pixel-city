# Kota Pixel

Dynamic SVG API that renders a pixel-art city from a developer's **public** GitHub activity. One Markdown line — no Actions, no user tokens.

```markdown
![Kota Pixel](https://<API-DOMAIN>/v1/city/<GITHUB_USERNAME>.svg)
```

SVG sudah di-scale agar enak dibaca di README (viewBox rapat ke skyline, lebar tampilan ~900px). Opsional:

```html
<img src="https://<API-DOMAIN>/v1/city/<GITHUB_USERNAME>.svg" width="100%" alt="Kota Pixel" />
```

## Endpoint

```http
GET /v1/city/{username}.svg
```

| Query | Default | Notes |
|---|---|---|
| `limit` | `18` | Buildings shown (1–18) |
| `theme` | `auto` | `auto` \| `light` \| `dark` |

Response: `image/svg+xml` city art. **Satu bangunan = satu repository** (bukan total contributions di profil). Level bangunan memakai **commit contributions kamu per repo** dalam 12 bulan terakhir — angka hijau “contributions in the last year” di GitHub biasanya lebih besar karena mencakup aktivitas lain / agregat berbeda. Window lights follow 30-day commits; streak ≥ 7 days enables smoke/flags; merged PRs (30d) add cars; stars add trees.

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
- `http://localhost:8787/v1/preview/building/hut.svg` — satu stage (hut … landmark)
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
| 1–19 | Gubuk (Hut) |
| 20–40 | Rumah kayu (House) |
| 41–50 | Toko batu (Shop) |
| 51–99 | Gedung bertingkat (Mid-rise) |
| 100–199 | Pencakar langit (Skyscraper) |
| 200+ | Menara landmark (Landmark) |

Sprites live under `src/visual/buildings` (from `docs/building`).
