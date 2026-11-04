/**
 * Extract individual Pixel Cityscape sprites as SVG (+ optional PNG via Chrome).
 *
 *   npx tsx scripts/extract-sprites.mts
 *   npx tsx scripts/extract-sprites.mts --png
 *
 * Output (gitignored):
 *   extracted/svg/{category}/{name}.svg
 *   extracted/png/{category}/{name}.png
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
	BUILDINGS,
	PALETTE,
	makeConstruction,
	renderBuilder,
	renderCraneHook,
	renderCar,
	renderBus,
	renderTree,
	renderBush,
	renderFlower,
	renderLanguageLogoSvg,
	COMMON_LANGUAGE_LOGO_IDS,
	type BuilderVariant,
} from "../src/visual/index.ts";

const OUT_ROOT = "extracted";
const OUT_SVG = join(OUT_ROOT, "svg");
const OUT_PNG = join(OUT_ROOT, "png");
const S = 8; // pixel scale for building grids
const PNG = process.argv.includes("--png");
const BG = "#9cc7ee";

type Tile = { category: string; name: string; w: number; h: number; body: string; bg?: string };

function ensure(dir: string) {
	mkdirSync(dir, { recursive: true });
}

function drawGrid(
	rows: string[],
	ox: number,
	oy: number,
	scale: number,
	opts: { litWindows?: boolean; winColor?: string } = {},
): string {
	const lit = opts.litWindows ?? true;
	const winOn = opts.winColor ?? "#ffd27a";
	const winOff = PALETTE.w ?? "#8fb4d6";
	let out = "";
	rows.forEach((row, r) => {
		for (let c = 0; c < row.length; ) {
			const ch = row[c]!;
			if (ch === ".") {
				c++;
				continue;
			}
			let fill: string | undefined;
			if (ch === "w") fill = lit && (r * 7 + c * 3) % 3 === 0 ? winOn : winOff;
			else if (ch === "A") fill = "#ffd84a";
			else fill = PALETTE[ch];
			if (!fill) {
				c++;
				continue;
			}
			let n = 1;
			while (c + n < row.length && row[c + n] === ch) n++;
			// windows aren't run-merged when lit pattern differs — keep simple run of same ch
			out += `<rect x="${ox + c * scale}" y="${oy + r * scale}" width="${n * scale}" height="${scale}" fill="${fill}"/>`;
			c += n;
		}
	});
	return out;
}

function svgDoc(w: number, h: number, body: string, bg = BG): string {
	return (
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">` +
		`<rect width="100%" height="100%" fill="${bg}"/>` +
		body +
		`</svg>\n`
	);
}

function flagSvg(ox: number, oy: number, scale: number): string {
	return (
		`<rect x="${ox}" y="${oy}" width="${scale}" height="${scale * 4}" fill="#7a5434"/>` +
		`<rect x="${ox + scale}" y="${oy}" width="${scale * 3}" height="${scale * 2}" fill="#d94f4f"/>`
	);
}

function smokeSvg(ox: number, oy: number, scale: number): string {
	return (
		`<rect x="${ox}" y="${oy}" width="${scale}" height="${scale}" fill="#c8c8c8" opacity="0.9"/>` +
		`<rect x="${ox + scale}" y="${oy - scale}" width="${scale}" height="${scale}" fill="#d8d8d8" opacity="0.85"/>` +
		`<rect x="${ox + scale * 2}" y="${oy - scale * 2}" width="${scale}" height="${scale}" fill="#e0e0e0" opacity="0.7"/>`
	);
}

function windowPair(ox: number, oy: number, scale: number, on: boolean, color: string): string {
	const fill = on ? color : (PALETTE.w ?? "#8fb4d6");
	return (
		`<rect x="${ox}" y="${oy}" width="${scale}" height="${scale}" fill="${fill}"/>` +
		`<rect x="${ox + scale + 2}" y="${oy}" width="${scale}" height="${scale}" fill="${on ? color : (PALETTE.w ?? "#8fb4d6")}"/>`
	);
}

function craneTower(scale: number): { w: number; h: number; body: string } {
	const mastH = 14;
	const jib = 8;
	const col = 10;
	const w = (col + jib + 2) * scale;
	const h = (mastH + 3) * scale;
	let body = "";
	// foot plate
	for (let c = col - 1; c <= col + 1; c++) {
		body += `<rect x="${c * scale}" y="${(mastH - 1) * scale}" width="${scale}" height="${scale}" fill="${PALETTE.X}"/>`;
		body += `<rect x="${c * scale}" y="${mastH * scale}" width="${scale}" height="${scale}" fill="${PALETTE.X}"/>`;
	}
	// mast
	for (let r = 0; r < mastH; r++) {
		body += `<rect x="${col * scale}" y="${r * scale}" width="${scale}" height="${scale}" fill="${PALETTE.X}"/>`;
	}
	// beacon
	body += `<rect x="${col * scale}" y="0" width="${scale}" height="${scale}" fill="#ffd84a"/>`;
	// jib left
	for (let j = 1; j <= jib; j++) {
		body += `<rect x="${(col - j) * scale}" y="${scale}" width="${scale}" height="${scale}" fill="${PALETTE.Q}"/>`;
	}
	// hook under mid-jib
	body += renderCraneHook(0, 0, col - Math.floor(jib / 2), 1, scale);
	return { w, h: h + scale, body };
}

function scaffoldSample(scale: number): { w: number; h: number; body: string } {
	const cols = 10;
	const rows = 8;
	const w = cols * scale;
	const h = rows * scale;
	let body = "";
	// steel posts
	for (const c of [1, cols - 2]) {
		for (let r = 0; r < rows; r++) {
			body += `<rect x="${c * scale}" y="${r * scale}" width="${scale}" height="${scale}" fill="${PALETTE.Q}"/>`;
		}
	}
	// plank rows
	for (const r of [2, 5]) {
		for (let c = 1; c < cols - 1; c++) {
			body += `<rect x="${c * scale}" y="${r * scale}" width="${scale}" height="${scale}" fill="${PALETTE.P}"/>`;
		}
	}
	return { w, h, body };
}

function collectTiles(): Tile[] {
	const tiles: Tile[] = [];

	// --- Buildings (finished) ---
	for (const b of BUILDINGS) {
		const pad = S;
		const w = b.width * S + pad * 2;
		const h = b.height * S + pad * 2 + (b.flag ? S * 4 : 0) + (b.smokeX !== undefined ? S * 3 : 0);
		const top = pad + (b.flag ? S * 4 : 0) + (b.smokeX !== undefined ? S * 2 : 0);
		let body = drawGrid(b.rows, pad, top, S, { litWindows: true, winColor: "#ffd27a" });
		if (b.flag) {
			body += flagSvg(pad + Math.floor(b.width / 2) * S, top - S * 4, S);
		}
		if (b.smokeX !== undefined) {
			body += smokeSvg(pad + b.smokeX * S, top - S * 2, S);
		}
		tiles.push({ category: "buildings", name: b.id, w, h, body });
	}

	// --- Construction samples (one phase per target that supports it) ---
	for (const id of ["wood-house", "stone-shop", "midrise", "skyscraper", "landmark"] as const) {
		const finished = BUILDINGS.find((b) => b.id === id)!;
		for (const phase of [0, 1, 2] as const) {
			const meta = makeConstruction(finished, phase);
			const pad = S;
			const w = meta.width * S + pad * 2;
			const h = meta.height * S + pad * 2;
			let body = drawGrid(meta.rows, pad, pad, S, { litWindows: false });
			if (meta.craneHook) {
				body += renderCraneHook(pad, pad, meta.craneHook.col, meta.craneHook.row, S);
			}
			tiles.push({
				category: "construction",
				name: `${id}-phase${phase}`,
				w,
				h,
				body,
			});
		}
	}

	// --- Crane / scaffold / builders ---
	{
		const c = craneTower(S);
		tiles.push({ category: "effects", name: "crane", w: c.w, h: c.h, body: c.body });
	}
	{
		const s = scaffoldSample(S);
		tiles.push({ category: "effects", name: "scaffolding", w: s.w, h: s.h, body: s.body });
	}
	for (const variant of ["hammer", "carry", "scaffold", "weld"] as BuilderVariant[]) {
		const gy = 40;
		const body = renderBuilder({
			id: variant,
			x: 16,
			groundY: gy,
			delaySec: 0,
			variant,
			walkPx: 8,
		});
		tiles.push({ category: "effects", name: `builder-${variant}`, w: 64, h: 48, body });
	}

	// --- Flag / smoke / window lights ---
	tiles.push({
		category: "effects",
		name: "flag",
		w: S * 6,
		h: S * 6,
		body: flagSvg(S, S, S),
	});
	tiles.push({
		category: "effects",
		name: "smoke",
		w: S * 6,
		h: S * 6,
		body: smokeSvg(S, S * 4, S),
	});
	tiles.push({
		category: "effects",
		name: "window-off",
		w: S * 5,
		h: S * 3,
		body: windowPair(S, S, S, false, "#3178c6"),
	});
	tiles.push({
		category: "effects",
		name: "window-on-typescript",
		w: S * 5,
		h: S * 3,
		body: windowPair(S, S, S, true, "#3178c6"),
	});
	tiles.push({
		category: "effects",
		name: "window-on-python",
		w: S * 5,
		h: S * 3,
		body: windowPair(S, S, S, true, "#3572A5"),
	});
	tiles.push({
		category: "effects",
		name: "window-on-rust",
		w: S * 5,
		h: S * 3,
		body: windowPair(S, S, S, true, "#dea584"),
	});
	tiles.push({
		category: "effects",
		name: "beacon",
		w: S * 3,
		h: S * 3,
		body: `<rect x="${S}" y="${S}" width="${S}" height="${S}" fill="#ffd84a"/>`,
	});

	// --- Vehicles ---
	{
		const ground = 40;
		const body = renderCar(ground - 12, "#d94f4f", 0, false);
		tiles.push({ category: "vehicles", name: "car", w: 56, h: 48, body });
	}
	{
		const ground = 48;
		const body = renderBus(ground - 12, 0, false);
		tiles.push({ category: "vehicles", name: "bus", w: 80, h: 56, body });
	}
	{
		const ground = 40;
		const body = renderCar(ground - 12, "#4a7fc0", 0, true);
		tiles.push({ category: "vehicles", name: "car-rev", w: 56, h: 48, body });
	}

	// --- Flora ---
	for (let v = 0; v < 3; v++) {
		const gy = 64;
		const body = renderTree(16, gy, v);
		tiles.push({ category: "flora", name: `tree-${v}`, w: 56, h: 72, body });
	}
	tiles.push({
		category: "flora",
		name: "bush",
		w: 40,
		h: 32,
		body: renderBush(8, 28, 0),
	});
	tiles.push({
		category: "flora",
		name: "flower",
		w: 32,
		h: 32,
		body: renderFlower(8, 28, 0),
	});

	return tiles;
}

function collectTilesFixed(): Tile[] {
	const tiles = collectTiles();

	tiles.push({
		category: "effects",
		name: "pedestrian",
		w: 32,
		h: 40,
		body:
			`<rect x="12" y="8" width="8" height="8" fill="#f1c27d"/>` +
			`<rect x="12" y="16" width="8" height="16" fill="#d94f4f"/>` +
			`<rect x="12" y="32" width="8" height="8" fill="#2a2a32"/>`,
	});

	// Language logos
	const logoIds = [
		"TypeScript",
		"JavaScript",
		"Python",
		"Go",
		"Rust",
		"Java",
		"C++",
		"Ruby",
		"PHP",
		"Swift",
		"Kotlin",
		"HTML",
		"CSS",
		"Vue",
		"Dart",
		"Shell",
	];
	for (const name of logoIds) {
		const pixel = 6;
		const logo = renderLanguageLogoSvg(name, 8, 8, pixel);
		if (!logo) continue;
		tiles.push({
			category: "logos",
			name: name.toLowerCase().replace(/\+/g, "plus").replace(/#/g, "sharp"),
			w: 80,
			h: 80,
			body: logo,
			bg: "#1a2233",
		});
	}

	// Metrics legend strip (text + icons) for LinkedIn docs
	const legendItems: Array<{ key: string; label: string; body: string }> = [
		{
			key: "metric-window-lights",
			label: "Window lights ← commits 30d",
			body: windowPair(16, 24, 10, true, "#3178c6"),
		},
		{
			key: "metric-smoke-flag",
			label: "Smoke + flag ← streak ≥7d",
			body: smokeSvg(12, 40, 8) + flagSvg(48, 12, 8),
		},
		{
			key: "metric-car",
			label: "Cars ← merged PRs 30d",
			body: renderCar(28, "#d94f4f", 0, false),
		},
		{
			key: "metric-tree",
			label: "Trees ← stars",
			body: renderTree(16, 56, 0),
		},
	];
	for (const item of legendItems) {
		tiles.push({
			category: "metrics",
			name: item.key,
			w: 120,
			h: 72,
			body: item.body,
		});
	}

	void COMMON_LANGUAGE_LOGO_IDS;
	return tiles;
}

function writeTile(tile: Tile): { svgPath: string; pngPath: string; w: number; h: number } {
	const svgDir = join(OUT_SVG, tile.category);
	const pngDir = join(OUT_PNG, tile.category);
	ensure(svgDir);
	ensure(pngDir);
	const svgPath = join(svgDir, `${tile.name}.svg`);
	const pngPath = join(pngDir, `${tile.name}.png`);
	writeFileSync(svgPath, svgDoc(tile.w, tile.h, tile.body, tile.bg ?? BG));
	return { svgPath, pngPath, w: tile.w, h: tile.h };
}

function rasterizePng(svgPath: string, pngPath: string, w: number, h: number): void {
	const absSvg = `file://${join(process.cwd(), svgPath)}`;
	const chrome =
		spawnSync("which", ["google-chrome"], { encoding: "utf8" }).stdout.trim() ||
		"google-chrome";
	const r = spawnSync(
		chrome,
		[
			"--headless=new",
			"--disable-gpu",
			"--no-sandbox",
			"--hide-scrollbars",
			`--window-size=${Math.max(w, 32)},${Math.max(h, 32)}`,
			`--screenshot=${join(process.cwd(), pngPath)}`,
			absSvg,
		],
		{ encoding: "utf8" },
	);
	if (r.status !== 0) {
		console.warn("png fail", svgPath, r.stderr?.slice(0, 200));
	}
}

const tiles = collectTilesFixed();
ensure(OUT_ROOT);
ensure(OUT_SVG);
ensure(OUT_PNG);
const written: Array<{ svgPath: string; pngPath: string; w: number; h: number }> = [];
for (const tile of tiles) {
	written.push(writeTile(tile));
}
console.log(`wrote ${written.length} SVGs → ${OUT_SVG}/{category}/`);

if (PNG) {
	for (const item of written) rasterizePng(item.svgPath, item.pngPath, item.w, item.h);
	console.log(`rasterized ${written.length} PNGs → ${OUT_PNG}/{category}/`);
}

// Index
const cats = [...new Set(tiles.map((t) => t.category))];
const index = cats
	.map((cat) => {
		const names = tiles.filter((t) => t.category === cat).map((t) => t.name);
		return `## ${cat}\n${names.map((n) => `- svg/${cat}/${n}.svg\n- png/${cat}/${n}.png`).join("\n")}`;
	})
	.join("\n\n");
writeFileSync(
	join(OUT_ROOT, "INDEX.md"),
	`# Sprite extract (gitignored)\n\n\`\`\`\nextracted/\n  svg/{category}/\n  png/{category}/\n\`\`\`\n\n${index}\n`,
);
console.log("index →", join(OUT_ROOT, "INDEX.md"));
