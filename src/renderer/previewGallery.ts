import { BUILDING_STAGES, parseTheme, type ThemeMode } from "../core/config";
import {
	BUILDINGS,
	BUILDING_BY_ID,
	CITY_ANIMATIONS_CSS,
	COMMON_LANGUAGE_LOGO_IDS,
	PALETTE,
	renderLanguageLogoCentered,
	renderLanguageLogoSvg,
	type BuildingId,
	type BuildingSprite,
} from "../visual";
import { escapeCssColor, escapeXml } from "./escape";
import { hashString } from "./hash";
import { renderStagesPreviewSvg } from "./previewStages";

const PREVIEW_LANG: Partial<Record<BuildingId, string>> = {
	midrise: "TypeScript",
	skyscraper: "Rust",
	landmark: "Go",
};

const SCALE = 4;
const STAGE_LABEL: Record<BuildingId, string> = {
	hut: "1–19 commits",
	"wood-house": "20–40 commits",
	"stone-shop": "41–50 commits",
	midrise: "51–99 commits",
	skyscraper: "100–199 commits",
	landmark: "200+ commits",
};

const BUILDING_IDS = new Set(BUILDINGS.map((b) => b.id));

export function isBuildingId(value: string): value is BuildingId {
	return BUILDING_IDS.has(value as BuildingId);
}

function sheetCss(theme: ThemeMode): string {
	const light = `.bg{fill:#eef3f8}.card{fill:#ffffff}.lbl{fill:#1f2933}.muted{fill:#5b6b7c}.border{stroke:#c9d4e0;fill:none}`;
	const dark = `.bg{fill:#121821}.card{fill:#1a2233}.lbl{fill:#e8eef6}.muted{fill:#9aa8b8}.border{stroke:#334155;fill:none}`;
	if (theme === "light") return light;
	if (theme === "dark") return dark;
	return `${light}
@media (prefers-color-scheme: dark){${dark}}`;
}

function renderGridSprite(
	sprite: BuildingSprite,
	originX: number,
	originY: number,
	opts: { litRatio: number; languageColor: string; smoke: boolean; flag: boolean; seed: string },
): string {
	const parts: string[] = [];
	const windows: Array<{ x: number; y: number }> = [];

	for (let row = 0; row < sprite.rows.length; row++) {
		const line = sprite.rows[row]!;
		for (let col = 0; col < line.length; col++) {
			const ch = line[col]!;
			if (ch === ".") continue;
			const x = originX + col * SCALE;
			const y = originY + row * SCALE;
			if (ch === "w") {
				windows.push({ x, y });
				continue;
			}
			if (ch === "A") {
				parts.push(
					`<rect class="blink" x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="#ffd84a"/>`,
				);
				continue;
			}
			const color = PALETTE[ch];
			if (!color) continue;
			parts.push(
				`<rect x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="${color}"/>`,
			);
		}
	}

	const litCount = Math.round(windows.length * opts.litRatio);
	const order = windows
		.map((cell, i) => ({ cell, rank: hashString(`${opts.seed}:${i}`) }))
		.sort((a, b) => a.rank - b.rank);
	const lit = escapeCssColor(opts.languageColor);
	for (let i = 0; i < order.length; i++) {
		const { x, y } = order[i]!.cell;
		const on = i < litCount;
		parts.push(
			`<rect class="${on ? "win on" : "win"}" x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="${on ? lit : PALETTE.w}"/>`,
		);
	}

	if (opts.smoke && sprite.smokeX !== undefined) {
		const sx = originX + sprite.smokeX * SCALE;
		const sy = originY - 2 * SCALE;
		parts.push(
			`<g class="smoke"><rect x="${sx}" y="${sy}" width="${SCALE}" height="${SCALE}" fill="#c8c8c8"/><rect x="${sx + SCALE}" y="${sy - SCALE}" width="${SCALE}" height="${SCALE}" fill="#d8d8d8"/></g>`,
		);
	}

	if (opts.flag && sprite.flag) {
		const fx = originX + Math.floor(sprite.width / 2) * SCALE;
		const fy = originY - SCALE;
		parts.push(
			`<rect x="${fx}" y="${fy}" width="${SCALE}" height="${SCALE * 4}" fill="#7a5434"/><rect class="flag" x="${fx + SCALE}" y="${fy}" width="${SCALE * 3}" height="${SCALE * 2}" fill="#d94f4f"/>`,
		);
	}

	return parts.join("");
}

export function renderBuildingPreviewSvg(
	id: BuildingId,
	themeRaw: string | null,
): string {
	const theme = parseTheme(themeRaw);
	const sprite = BUILDING_BY_ID[id];
	const pad = 24;
	const metaH = 72;
	const width = Math.max(280, sprite.width * SCALE + pad * 2);
	const height = sprite.height * SCALE + pad * 2 + metaH + 16;
	const ox = Math.floor((width - sprite.width * SCALE) / 2);
	const oy = pad + 8;

	const features = [
		`grid ${sprite.width}×${sprite.height}`,
		sprite.smokeX !== undefined ? "asap cerobong" : null,
		sprite.flag ? "bendera" : null,
		sprite.rows.some((r) => r.includes("A")) ? "antena blink" : null,
		`jendela: ${sprite.rows.join("").split("w").length - 1}`,
	]
		.filter(Boolean)
		.join(" · ");

	const minCommits = BUILDING_STAGES.find((s) => s.id === id)?.min ?? 1;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<title>Preview — ${escapeXml(sprite.name)}</title>
<desc>Building stage ${escapeXml(id)} (${escapeXml(STAGE_LABEL[id])})</desc>
<style>
${sheetCss(theme)}
${CITY_ANIMATIONS_CSS}
text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
</style>
<rect class="bg" width="${width}" height="${height}"/>
<rect class="card" x="8" y="8" width="${width - 16}" height="${height - 16}" rx="0"/>
<rect class="border" x="8.5" y="8.5" width="${width - 17}" height="${height - 17}"/>
${renderGridSprite(sprite, ox, oy, {
	litRatio: 0.7,
	languageColor: "#3178c6",
	smoke: true,
	flag: true,
	seed: `preview/${id}`,
})}
${renderLanguageLogoCentered(
	PREVIEW_LANG[id] ?? null,
	ox + (sprite.width * SCALE) / 2,
	oy +
		sprite.height *
			SCALE *
			(id === "landmark" ? 0.3 : id === "skyscraper" ? 0.16 : 0.14),
	2,
)}
<text class="lbl" x="${pad}" y="${height - metaH + 8}" font-size="14">${escapeXml(sprite.name)}</text>
<text class="muted" x="${pad}" y="${height - metaH + 28}" font-size="11">id: ${escapeXml(id)} · ${escapeXml(STAGE_LABEL[id])}</text>
<text class="muted" x="${pad}" y="${height - metaH + 46}" font-size="10">min commits: ${minCommits}</text>
<text class="muted" x="${pad}" y="${height - metaH + 62}" font-size="10">${escapeXml(features)}</text>
</svg>`;
}

function panel(
	x: number,
	y: number,
	w: number,
	h: number,
	title: string,
	body: string,
): string {
	return (
		`<g transform="translate(${x},${y})">` +
		`<rect class="card" width="${w}" height="${h}"/>` +
		`<rect class="border" x="0.5" y="0.5" width="${w - 1}" height="${h - 1}"/>` +
		`<text class="lbl" x="10" y="18" font-size="11">${escapeXml(title)}</text>` +
		body +
		`</g>`
	);
}

export function renderEnvironmentPreviewSvg(themeRaw: string | null): string {
	const theme = parseTheme(themeRaw);
	const width = 820;
	const height = 720;
	const S = 3;

	const skyDay =
		`<rect x="12" y="28" width="200" height="90" fill="#87b8e8"/>` +
		`<g class="sun"><circle cx="40" cy="52" r="10" fill="${PALETTE.y}"/><rect x="38" y="34" width="4" height="4" fill="${PALETTE.y}"/></g>` +
		`<g class="cloud"><rect x="70" y="44" width="${S * 6}" height="${S * 2}" fill="${PALETTE.q}"/><rect x="76" y="40" width="${S * 4}" height="${S * 2}" fill="${PALETTE.q}"/></g>` +
		`<g class="cloud-alt"><rect x="130" y="58" width="${S * 5}" height="${S * 2}" fill="${PALETTE.q}"/></g>` +
		`<g class="bird"><rect x="50" y="78" width="3" height="2" fill="#1f2933"/><rect x="53" y="76" width="3" height="2" fill="#1f2933"/><rect x="56" y="78" width="3" height="2" fill="#1f2933"/></g>` +
		`<g class="balloon"><rect x="170" y="40" width="6" height="8" fill="#d94f4f"/><rect x="172" y="48" width="2" height="8" fill="#888"/></g>`;

	const skyNight =
		`<rect x="12" y="28" width="200" height="90" fill="#1a2233"/>` +
		`<circle cx="170" cy="48" r="10" fill="${PALETTE.f}"/>` +
		`<rect class="star" x="40" y="42" width="2" height="2" fill="#fff"/>` +
		`<rect class="star" style="animation-delay:.4s" x="60" y="55" width="2" height="2" fill="#fff"/>` +
		`<rect class="star" style="animation-delay:.8s" x="90" y="40" width="2" height="2" fill="#fff"/>` +
		`<rect class="star" style="animation-delay:1.2s" x="110" y="62" width="2" height="2" fill="#fff"/>` +
		`<rect class="star" x="130" y="36" width="2" height="2" fill="#fff"/>` +
		`<g class="cloud"><rect x="40" y="70" width="${S * 6}" height="${S * 2}" fill="#9aa8b8" opacity="0.5"/></g>`;

	const groundRoad =
		`<rect x="12" y="40" width="220" height="28" fill="#5a8f45"/>` +
		`<rect x="12" y="68" width="220" height="20" fill="#4a4a52"/>` +
		`<rect x="24" y="76" width="12" height="3" fill="#d4d4d8"/>` +
		`<rect x="52" y="76" width="12" height="3" fill="#d4d4d8"/>` +
		`<rect x="80" y="76" width="12" height="3" fill="#d4d4d8"/>` +
		`<text class="muted" x="12" y="34" font-size="10">rumput + aspal + marka</text>`;

	const flora =
		`<g transform="translate(20,24)">` +
		`<rect x="8" y="48" width="${S}" height="${S * 4}" fill="${PALETTE.b}"/>` +
		`<g class="tree-top"><rect x="2" y="30" width="${S * 3}" height="${S * 3}" fill="${PALETTE.g}"/></g>` +
		`<rect x="40" y="54" width="${S * 4}" height="${S}" fill="${PALETTE.g}"/><rect x="43" y="51" width="${S * 2}" height="${S}" fill="#3d6e30"/>` +
		`<rect x="70" y="50" width="${S}" height="${S}" fill="#e85d75"/><rect x="70" y="53" width="2" height="${S}" fill="${PALETTE.g}"/>` +
		`</g>` +
		`<text class="muted" x="12" y="110" font-size="10">pohon + semak + bunga (stars)</text>`;

	const traffic =
		`<g transform="translate(16,40)">` +
		`<rect width="${S * 5}" height="${S * 2}" fill="${PALETTE.e}"/><rect x="${S}" y="${-S}" width="${S * 3}" height="${S}" fill="#dce6f0"/>` +
		`</g>` +
		`<g transform="translate(50,38)">` +
		`<rect y="${-S}" width="${S * 9}" height="${S * 3}" fill="#e6a817"/>` +
		`<rect x="${S}" y="${-S * 2}" width="${S * 2}" height="${S}" fill="#dce6f0"/>` +
		`</g>` +
		`<g class="vehicle" transform="translate(0,70)"><rect y="0" width="${S * 5}" height="${S * 2}" fill="#4a7fc0"/></g>` +
		`<text class="muted" x="12" y="118" font-size="10">mobil + bus (merged PR)</text>`;

	const peds =
		[0, 1, 2, 3, 4]
			.map((i) => {
				const x = 20 + i * 18;
				const shirt = ["#d94f4f", "#4a7fc0", "#c9a24d", "#7a5434", "#5d6b82"][i];
				return (
					`<g transform="translate(${x},40)">` +
					`<rect x="3" y="0" width="3" height="3" fill="#f1c27d"/>` +
					`<rect x="3" y="3" width="3" height="6" fill="${shirt}"/>` +
					`<rect x="3" y="9" width="3" height="6" fill="#2a2a32"/>` +
					`</g>`
				);
			})
			.join("") +
		`<text class="muted" x="12" y="110" font-size="10">1→5 orang per stage gedung</text>`;

	const fx =
		`<g class="smoke" transform="translate(24,50)"><rect width="${S}" height="${S}" fill="#c8c8c8"/><rect x="${S}" y="${-S}" width="${S}" height="${S}" fill="#d8d8d8"/></g>` +
		`<g transform="translate(70,40)"><rect width="${S}" height="${S * 4}" fill="#7a5434"/><rect class="flag" x="${S}" width="${S * 3}" height="${S * 2}" fill="#d94f4f"/></g>` +
		`<rect class="blink" x="130" y="48" width="${S}" height="${S}" fill="#ffd84a"/>` +
		`<text class="muted" x="12" y="110" font-size="10">streak ≥ 7 hari / antena</text>`;

	const logos = COMMON_LANGUAGE_LOGO_IDS.slice(0, 12)
		.map((id, i) => {
			const x = 14 + (i % 6) * 36;
			const y = 34 + Math.floor(i / 6) * 40;
			return (
				`<g transform="translate(${x},${y})">${renderLanguageLogoSvg(id, 0, 0, 2)}` +
				`<text class="muted" y="20" font-size="8">${escapeXml(id.slice(0, 6))}</text></g>`
			);
		})
		.join("");

	const paletteKeys = Object.keys(PALETTE);
	const swatches = paletteKeys
		.map((key, i) => {
			const col = i % 8;
			const row = Math.floor(i / 8);
			const x = 12 + col * 34;
			const y = 34 + row * 36;
			return (
				`<g transform="translate(${x},${y})">` +
				`<rect width="22" height="22" fill="${PALETTE[key]}"/>` +
				`<text class="muted" x="0" y="32" font-size="9">${escapeXml(key)}</text>` +
				`</g>`
			);
		})
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<title>Preview — Lingkungan Kota Pixel</title>
<desc>Sky, flora, traffic, pedestrians, logos, palette</desc>
<style>
${sheetCss(theme)}
${CITY_ANIMATIONS_CSS}
text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
</style>
<rect class="bg" width="${width}" height="${height}"/>
<text class="lbl" x="16" y="28" font-size="16">Lingkungan &amp; elemen kota</text>
<text class="muted" x="16" y="46" font-size="11">Asset yang bisa ditambah/diubah di renderer &amp; palette</text>
${panel(16, 60, 230, 140, "Langit siang", skyDay)}
${panel(258, 60, 230, 140, "Langit malam", skyNight)}
${panel(500, 60, 250, 140, "Tanah &amp; jalan", groundRoad)}
${panel(16, 216, 230, 140, "Flora", flora)}
${panel(258, 216, 230, 140, "Lalu lintas", traffic)}
${panel(500, 216, 250, 140, "Pejalan kaki", peds)}
${panel(16, 372, 230, 140, "Efek streak", fx)}
${panel(258, 372, 492, 140, "Logo bahasa umum (opsional di gedung)", logos)}
${panel(16, 528, 734, 170, "Palette (src/visual/buildings/palette.ts)", swatches)}
</svg>`;
}

export function renderPreviewIndexHtml(origin: string): string {
	const themeQ = "";
	const buildings = BUILDINGS.map((b) => {
		const href = `${origin}/v1/preview/building/${b.id}.svg${themeQ}`;
		return `
      <article class="card">
        <h3>${escapeXml(b.name)}</h3>
        <p class="meta"><code>${escapeXml(b.id)}</code> · ${escapeXml(STAGE_LABEL[b.id])} · ${b.width}×${b.height}</p>
        <a href="${href}" target="_blank" rel="noopener">
          <img src="${href}" alt="${escapeXml(b.name)}" loading="lazy"/>
        </a>
        <p class="hint">file: <code>src/visual/buildings/${escapeXml(b.id)}.ts</code></p>
      </article>`;
	}).join("\n");

	return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Kota Pixel — Preview Gallery</title>
  <style>
    :root {
      --bg: #eef3f8;
      --ink: #1f2933;
      --muted: #5b6b7c;
      --card: #fff;
      --line: #c9d4e0;
      --accent: #2f6fed;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #121821;
        --ink: #e8eef6;
        --muted: #9aa8b8;
        --card: #1a2233;
        --line: #334155;
        --accent: #7eb0ff;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.45;
    }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 18px 64px; }
    h1 { font-size: 1.5rem; margin: 0 0 6px; }
    h2 { font-size: 1.1rem; margin: 36px 0 12px; }
    p.lead { color: var(--muted); margin: 0 0 20px; max-width: 60ch; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; }
    .links a {
      color: var(--accent);
      text-decoration: none;
      border: 1px solid var(--line);
      background: var(--card);
      padding: 8px 12px;
    }
    .links a:hover { border-color: var(--accent); }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      padding: 12px;
    }
    .card h3 { margin: 0 0 4px; font-size: 1rem; }
    .meta, .hint { color: var(--muted); font-size: 0.75rem; margin: 0 0 10px; }
    .hint { margin: 10px 0 0; }
    .card img {
      display: block;
      width: 100%;
      height: auto;
      background: #87b8e8;
      image-rendering: pixelated;
    }
    .wide img {
      width: 100%;
      max-height: none;
      background: transparent;
      border: 1px solid var(--line);
    }
    code { font-size: 0.85em; }
  </style>
</head>
<body>
  <main>
    <h1>Kota Pixel — Preview Gallery</h1>
    <p class="lead">Lihat tiap bangunan dan elemen lingkungan sebelum menambah asset baru. Ubah sprite di <code>src/visual/buildings/</code>, palette di <code>palette.ts</code>, efek kota di <code>src/renderer/render.ts</code>.</p>
    <div class="links">
      <a href="/v1/preview/stages.svg">Semua stage (satu SVG)</a>
      <a href="/v1/preview/environment.svg">Lingkungan</a>
      <a href="/v1/preview/linkedin.svg?theme=light">LinkedIn sheet (light)</a>
      <a href="/v1/preview/linkedin.svg?theme=dark">LinkedIn sheet (dark)</a>
      <a href="/v1/preview/stages.svg?theme=dark">Stages gelap</a>
      <a href="/v1/preview/environment.svg?theme=dark">Lingkungan gelap</a>
    </div>

    <h2>Bangunan / stage</h2>
    <div class="grid">
      ${buildings}
    </div>

    <h2>Lingkungan</h2>
    <div class="wide card">
      <h3>Langit, alam, jalan, mobil, efek, palette</h3>
      <p class="meta">Endpoint: <code>/v1/preview/environment.svg</code></p>
      <a href="/v1/preview/environment.svg" target="_blank" rel="noopener">
        <img src="/v1/preview/environment.svg" alt="Environment preview"/>
      </a>
    </div>

    <h2>Kota lengkap (semua stage)</h2>
    <div class="wide card">
      <h3>Komposisi kota</h3>
      <p class="meta">Endpoint: <code>/v1/preview/stages.svg</code></p>
      <a href="/v1/preview/stages.svg" target="_blank" rel="noopener">
        <img src="/v1/preview/stages.svg" alt="All stages city preview"/>
      </a>
    </div>
  </main>
</body>
</html>`;
}

export { renderStagesPreviewSvg };
