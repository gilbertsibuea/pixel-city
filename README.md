# Pixel Cityscape

Dynamic SVG API that renders a pixel-art city from a developer's **public** GitHub activity. One embed — no Actions, no user tokens.

```html
<img src="https://<API-DOMAIN>/v1/city/<GITHUB_USERNAME>.svg" width="100%" alt="Pixel Cityscape" />
```

The SVG is scaled for README readability (tight viewBox on the skyline, ~900px display width).

## Endpoint

```http
GET /v1/city/{username}.svg
```

| Query | Default | Notes |
|---|---|---|
| `limit` | `18` | Buildings shown (1–18) |
| `theme` | `auto` | `auto` \| `light` \| `dark` |

Response: `image/svg+xml` city art. **One building = one repository** (not your profile’s total contributions). Building level uses **your commit contributions per repo** over the last 12 months — GitHub’s green “contributions in the last year” number is usually higher because it includes other activity / different aggregates. Window lights follow 30-day commits; streak ≥ 7 days enables smoke/flags; merged PRs (30d) add cars; stars add trees.

Data is public-only and may lag because of cache (metrics ~6h, SVG ~1h) and GitHub's image proxy.

## Local development

```bash
cp .dev.vars.example .dev.vars
# put a fine-grained GitHub PAT in .dev.vars

npm install
npm run dev
```

Open:

- `http://localhost:8787/preview` — gallery: each building + environment
- `http://localhost:8787/v1/preview/building/hut.svg` — single stage (hut … landmark)
- `http://localhost:8787/v1/preview/environment.svg` — sky, road, trees, cars, effects, palette
- `http://localhost:8787/v1/preview/stages.svg` — all stages in one city
- `http://localhost:8787/v1/city/octocat.svg` — city from GitHub data

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
| 1–19 | Hut |
| 20–40 | House |
| 41–50 | Shop |
| 51–99 | Mid-rise |
| 100–199 | Skyscraper |
| 200+ | Landmark |

Sprites live under `src/visual/buildings` (from `docs/building`).
