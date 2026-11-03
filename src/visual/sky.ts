import { PALETTE } from "./buildings/palette";
import { renderMountainDefs, renderMountains } from "./mountains";
import {
	SKY_CELL as S,
	clamp,
	gridToPaths,
	mulberry32,
	strokeUse,
} from "./skyShared";

/* ------------------------------------------------------------------ */
/* Clouds: big, lobed, shaded cumulus + thin wisps                      */
/* ------------------------------------------------------------------ */

const CLOUD_TONES = 5; // 0 highlight, 1 light, 2 mid, 3 shadow, 4 deep shadow

interface Lobe {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
}

function genCumulus(seed: number, W: number, H: number): number[][] {
	const rnd = mulberry32(seed);
	const yb = H - 3; // flat base line
	let lobes: Lobe[] = [];
	const n = Math.max(4, Math.round(W / 11));
	for (let i = 0; i < n; i++) {
		const t = (i + 0.5) / n;
		const env = Math.pow(Math.sin(Math.PI * t), 0.8);
		const ry = H * (0.2 + 0.34 * env) * (0.8 + 0.4 * rnd());
		const rx = ry * (1.15 + 0.6 * rnd()) + W * 0.03;
		const cx = W * (0.07 + 0.86 * t) + (rnd() - 0.5) * W * 0.04;
		const cy = yb - ry * (0.5 + 0.3 * rnd());
		lobes.push({ cx, cy, rx, ry });
		if (env > 0.5) {
			const r2 = ry * (0.5 + 0.25 * rnd());
			lobes.push({
				cx: cx + (rnd() - 0.4) * rx * 0.8,
				cy: cy - ry * (0.55 + 0.2 * rnd()),
				rx: r2 * (1.1 + 0.4 * rnd()),
				ry: r2,
			});
		}
	}
	// Keep the whole cloud inside the grid: compress vertically if the top overflows.
	const minTop = Math.min(...lobes.map((l) => l.cy - l.ry));
	if (minTop < 0.5) {
		const k = (yb - 0.5) / (yb - minTop);
		lobes = lobes.map((l) => ({ ...l, cy: yb - (yb - l.cy) * k, ry: l.ry * k }));
	}

	const lobesByHeight = [...lobes].sort((a, b) => a.cy - b.cy);
	const mask: boolean[][] = Array.from({ length: H }, () => Array<boolean>(W).fill(false));
	const light: number[][] = Array.from({ length: H }, () => Array<number>(W).fill(-9));
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			const lift = 3.5 * Math.pow(1 - Math.sin((Math.PI * px) / W), 1.4);
			if (py > yb + 1 - lift) continue;
			for (const l of lobesByHeight) {
				const nx = (px - l.cx) / l.rx;
				const ny = (py - l.cy) / l.ry;
				if (nx * nx + ny * ny <= 1) {
					mask[y]![x] = true;
					light[y]![x] = -ny * 0.78 - nx * 0.28 + 0.4;
					break;
				}
			}
		}
	}
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (!mask[y]![x]) continue;
			const nb =
				(mask[y - 1]?.[x] ? 1 : 0) +
				(mask[y + 1]?.[x] ? 1 : 0) +
				(mask[y]![x - 1] ? 1 : 0) +
				(mask[y]![x + 1] ? 1 : 0);
			if (nb < 2) mask[y]![x] = false;
		}
	}

	const grid: number[][] = Array.from({ length: H }, () => Array<number>(W).fill(-1));
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (!mask[y]![x]) continue;
			let L = light[y]![x]!;
			L -= 0.4 * Math.max(0, (y + 0.5 - H * 0.4) / (H * 0.6));
			L += (x & 1) ^ (y & 1) ? 0.035 : -0.035;
			let tone = L > 0.78 ? 0 : L > 0.46 ? 1 : L > 0.14 ? 2 : L > -0.2 ? 3 : 4;
			if (!mask[y - 1]?.[x] && tone > 1) tone = 1;
			grid[y]![x] = tone;
		}
	}
	return grid;
}

function genWisp(seed: number, W: number, H: number): number[][] {
	const rnd = mulberry32(seed);
	const grid: number[][] = Array.from({ length: H }, () => Array<number>(W).fill(-1));
	for (let y = 0; y < H; y++) {
		const mid = 1 - Math.abs(y - (H - 1) / 2) / (H / 2 + 0.5);
		let x = Math.floor(rnd() * W * 0.2) + y * 2;
		while (x < W) {
			const len = Math.max(3, Math.floor((0.12 + 0.45 * rnd()) * W * (0.4 + 0.6 * mid)));
			const tone = y < H / 2 ? 0 : rnd() < 0.5 ? 1 : 2;
			for (let i = 0; i < len && x + i < W; i++) {
				const edge = Math.min(i, len - 1 - i);
				if (edge === 0 && rnd() < 0.5) continue;
				grid[y]![x + i] = tone;
			}
			x += len + 2 + Math.floor(rnd() * 9);
		}
	}
	return grid;
}

interface CloudSpec {
	seed: number;
	w: number;
	h: number;
	wisp?: boolean;
}

/** Slightly shorter cumulus so the upper sky band can hold them above mountains. */
const CLOUD_SPECS: CloudSpec[] = [
	{ seed: 11, w: 64, h: 20 },
	{ seed: 23, w: 52, h: 16 },
	{ seed: 37, w: 72, h: 18 },
	{ seed: 5, w: 40, h: 14 },
	{ seed: 7, w: 72, h: 5, wisp: true },
	{ seed: 19, w: 56, h: 4, wisp: true },
];

const cloudPaths: string[][] = CLOUD_SPECS.map((s) =>
	gridToPaths(s.wisp ? genWisp(s.seed, s.w, s.h) : genCumulus(s.seed, s.w, s.h), CLOUD_TONES, S, 0, 0),
);

const CLOUD_DAY = ["#ffffff", "#f1f6fd", "#d3e0f4", "#adc0e8", "#8ea3d6"];
const CLOUD_NIGHT = ["#bcc6f0", "#98a4d8", "#7581bb", "#59639c", "#454d85"];

function cloudAt(
	x: number,
	y: number,
	variant: number,
	cls: string,
	delay: number,
	opacity: number,
	day: boolean,
	flip = false,
): string {
	const spec = CLOUD_SPECS[variant]!;
	const pw = spec.w * S;
	const pal = day ? CLOUD_DAY : CLOUD_NIGHT;
	const delayStyle = delay ? ` style="animation-delay:${delay}s"` : "";
	const uses = pal
		.map((c, t) => (cloudPaths[variant]![t] ? strokeUse(`c${variant}t${t}`, c) : ""))
		.join("");
	const inner = flip ? `<g transform="translate(${pw},0) scale(-1,1)">${uses}</g>` : `<g>${uses}</g>`;
	return (
		`<g transform="translate(${x},${y})">` +
		`<g class="${cls}"${delayStyle} opacity="${opacity}">${inner}</g></g>`
	);
}

/**
 * Place a cloud so its bottom stays at or above `ceilingY` (upper sky only).
 * This keeps the mountain silhouette clear on the horizon.
 */
function placeCloud(
	x: number,
	y: number,
	variant: number,
	cls: string,
	delay: number,
	opacity: number,
	day: boolean,
	ceilingY: number,
	flip = false,
	avoid?: Zone,
): string {
	const ph = CLOUD_SPECS[variant]!.h * S;
	const topMax = Math.max(2, ceilingY - ph);
	const px = avoid ? dodgeZone(x, CLOUD_SPECS[variant]!.w * S, cls, avoid) : x;
	return cloudAt(px, clamp(y, 2, topMax), variant, cls, delay, opacity, day, flip);
}

/** Horizontal band kept clear of clouds (sun / moon incl. their drift). */
interface Zone {
	x0: number;
	x1: number;
}

/** Drift range of each cloud class, matching cloud-drift / cloud-drift-slow keyframes. */
const CLOUD_DRIFT: Record<string, [number, number]> = {
	cloud: [0, 40],
	"cloud-alt": [-32, 0],
};

/** Slide a cloud to whichever side of the zone is nearer so it never sweeps across it. */
function dodgeZone(x: number, w: number, cls: string, zone: Zone): number {
	const [dMin, dMax] = CLOUD_DRIFT[cls] ?? [0, 0];
	if (x + w + dMax <= zone.x0 || x + dMin >= zone.x1) return x;
	const left = zone.x0 - w - dMax;
	const right = zone.x1 - dMin;
	return Math.abs(left - x) <= Math.abs(right - x) ? left : right;
}

/** Hard ceiling for cloud bottoms: upper ~38% of the sky above ground. */
function cloudCeilingY(groundY: number): number {
	return Math.max(36, Math.floor(groundY * 0.38));
}

function clampSkyY(y: number, maxY: number): number {
	return Math.max(2, Math.min(y, maxY));
}

function birdAt(x: number, y: number, delay: number): string {
	return (
		`<g transform="translate(${x},${y})">` +
		`<g class="bird" style="animation-delay:${delay}s">` +
		`<rect x="0" y="2" width="3" height="2" fill="#1f2933"/>` +
		`<rect x="3" y="0" width="3" height="2" fill="#1f2933"/>` +
		`<rect x="6" y="2" width="3" height="2" fill="#1f2933"/>` +
		`</g></g>`
	);
}

function stars(width: number, count: number, maxY: number): string {
	const parts: string[] = [];
	const band = Math.max(24, maxY - 4);
	for (let i = 0; i < count; i++) {
		const x = 12 + ((i * 97) % Math.max(width - 24, 1));
		const y = 4 + ((i * 53) % band);
		const delay = (i % 5) * 0.35;
		parts.push(
			`<rect class="star" style="animation-delay:${delay}s" x="${x}" y="${y}" width="2" height="2" fill="#f4f0cf"/>`,
		);
	}
	return parts.join("");
}

function balloonAt(x: number, y: number, color: string, delay: number): string {
	return (
		`<g transform="translate(${x},${y})">` +
		`<g class="balloon" style="animation-delay:${delay}s">` +
		`<rect x="0" y="0" width="6" height="8" fill="${color}"/>` +
		`<rect x="2" y="8" width="2" height="10" fill="#888"/>` +
		`</g></g>`
	);
}

function balloons(width: number, peakY: number, maxY: number): string {
	const mid = Math.floor(width * 0.5);
	const y0 = clampSkyY(Math.min(peakY + 24, maxY * 0.35), maxY - 8);
	const specs: Array<[number, number, string, number]> = [
		[mid - 10, y0, "#d94f4f", 0],
		[mid + 18, clampSkyY(y0 + 6, maxY - 8), "#4a7fc0", 2.5],
		[mid - 28, clampSkyY(y0 + 10, maxY - 8), "#c9a24d", 5],
		[mid + 40, clampSkyY(y0 - 4, maxY - 8), "#e85d75", 7],
	];
	return specs.map(([x, y, c, d]) => balloonAt(x, y, c, d)).join("");
}

/**
 * Back clouds in the upper sky. Day: keep clear of the sun on the left.
 * Night: keep clear of the moon on the right (including its westward drift).
 */
function backClouds(width: number, groundY: number, day: boolean, avoid: Zone): string {
	const f = (r: number) => Math.floor(width * r);
	const ceiling = cloudCeilingY(groundY);
	return [
		placeCloud(f(0.02), 4, 0, "cloud", 0, 0.88, day, ceiling, false, avoid),
		placeCloud(f(0.3), 8, 2, "cloud-alt", 2, 0.86, day, ceiling, false, avoid),
		placeCloud(f(0.58), 2, 1, "cloud", 4, 0.88, day, ceiling, true, avoid),
		placeCloud(f(0.82), 10, 3, "cloud-alt", 1, 0.84, day, ceiling, false, avoid),
		placeCloud(f(0.08), 6, 4, "cloud-alt", 3, 0.72, day, ceiling, false, avoid),
		placeCloud(f(0.64), 12, 5, "cloud", 5, 0.7, day, ceiling, false, avoid),
	].join("");
}

/** Front layer: thin wisps only, high up — never big banks over rooftops. */
function frontClouds(width: number, groundY: number, day: boolean, avoid: Zone): string {
	const f = (r: number) => Math.floor(width * r);
	const ceiling = Math.min(cloudCeilingY(groundY), Math.floor(groundY * 0.28));
	return [
		placeCloud(f(0.18), 6, 4, "cloud", 1, 0.65, day, ceiling, false, avoid),
		placeCloud(f(0.55), 10, 5, "cloud-alt", 2.5, 0.62, day, ceiling, true, avoid),
	].join("");
}

/* ------------------------------------------------------------------ */
/* Sun & moon: same cell grid + 5-tone shading as the clouds            */
/* ------------------------------------------------------------------ */

type Grid = number[][];

const emptyGrid = (n: number): Grid => Array.from({ length: n }, () => Array<number>(n).fill(-1));

/** 0..4 body tones lit from the upper-left, with a light checker dither like the clouds. */
function shadeBody(nx: number, ny: number, x: number, y: number): number {
	const d2 = Math.min(1, nx * nx + ny * ny);
	let L = -nx * 0.4 - ny * 0.55 + 0.7 * (1 - d2) - 0.2;
	L += (x & 1) ^ (y & 1) ? 0.03 : -0.03;
	return L > 0.6 ? 0 : L > 0.2 ? 1 : L > -0.25 ? 2 : L > -0.6 ? 3 : 4;
}

/** Rounded pixel halo around `body` cells: solid ring, then an optional checker-dithered ring. */
function addHalo(grid: Grid, body: (x: number, y: number) => boolean, inner: number, outer = -1): void {
	const n = grid.length;
	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			if (grid[y]![x]! >= 0) continue;
			let near = 9;
			for (let dy = -3; dy <= 3; dy++) {
				for (let dx = -3; dx <= 3; dx++) {
					if (body(x + dx, y + dy)) near = Math.min(near, Math.hypot(dx, dy));
				}
			}
			if (near <= 1.5) grid[y]![x] = inner;
			else if (outer >= 0 && near <= 2.3 && ((x + y) & 1) === 0) grid[y]![x] = outer;
		}
	}
}

const SUN_N = 19;
const SUN_R = 4.6;
/** Tones: 0–4 disk, 5 ray, 6 ray tip, 7 halo. */
const SUN_COLORS = ["#fffbe0", "#ffe878", "#ffd23f", "#f7a92b", "#e2842a", "#ffc93c", "#ffe58a", "#fff1b0"];
const SUN_OPACITY = [1, 1, 1, 1, 1, 1, 1, 0.9];

function genSun(): Grid {
	const n = SUN_N;
	const c = (n - 1) / 2;
	const grid = emptyGrid(n);
	const inDisk = (x: number, y: number) => Math.hypot(x - c, y - c) <= SUN_R;

	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			if (!inDisk(x, y)) continue;
			grid[y]![x] = shadeBody((x - c) / SUN_R, (y - c) / SUN_R, x, y);
		}
	}
	addHalo(grid, inDisk, 7);

	// 16 rays: long on the axes, medium on diagonals, single-pixel nubs in between.
	const ray = (deg: number, from: number, to: number) => {
		const a = (deg * Math.PI) / 180;
		for (let t = from; t <= to; t++) {
			const x = Math.round(c + t * Math.cos(a));
			const y = Math.round(c + t * Math.sin(a));
			if (grid[y]?.[x] === undefined) continue;
			grid[y]![x] = t === to ? 6 : 5;
		}
	};
	for (let i = 0; i < 16; i++) {
		const deg = i * 22.5;
		if (i % 4 === 0) ray(deg, 7, 9);
		else if (i % 2 === 0) ray(deg, 7, 8);
		else ray(deg, 7, 7);
	}
	return grid;
}

const MOON_N = 15;
const MOON_R = 5.8;
/** Tones: 0–4 lit crescent, 5 crater, 6 halo, 7 dithered halo. */
const MOON_COLORS = ["#fffbe8", "#f4edc8", "#ddd2a2", "#b8ad80", "#958b66", "#c9be8e", "#2b3768", "#212a54"];
const MOON_OPACITY = [1, 1, 1, 1, 1, 1, 1, 1];

function genMoon(): Grid {
	const n = MOON_N;
	const c = (n - 1) / 2;
	const cutX = c + 3.2;
	const cutY = c - 2;
	const cutR = 4.6;
	const grid = emptyGrid(n);
	const inMoon = (x: number, y: number) =>
		Math.hypot(x - c, y - c) <= MOON_R && Math.hypot(x - cutX, y - cutY) > cutR;

	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			if (!inMoon(x, y)) continue;
			// Distance past the shadow edge: thin near the terminator, fullest along the outer rim.
			const s = Math.hypot(x - cutX, y - cutY) - cutR;
			let tone = shadeBody((x - c) / MOON_R, (y - c) / MOON_R, x, y);
			if (s < 0.9) tone = Math.max(tone, 3);
			else if (s < 1.7) tone = Math.max(tone, 2);
			grid[y]![x] = tone;
		}
	}
	for (const [x, y] of [
		[3, 8],
		[4, 10],
		[6, 12],
		[2, 6],
	] as const) {
		if (grid[y]![x]! >= 0 && grid[y]![x]! <= 2) grid[y]![x] = 5;
	}
	addHalo(grid, inMoon, 6, 7);
	return grid;
}

const sunPaths = gridToPaths(genSun(), SUN_COLORS.length, S, 0, 0);
const moonPaths = gridToPaths(genMoon(), MOON_COLORS.length, S, 0, 0);

function paintTones(paths: string[], colors: string[], opacity: number[], cls: (t: number) => string): string {
	return paths
		.map((d, t) => {
			if (!d) return "";
			const op = opacity[t]! < 1 ? ` opacity="${opacity[t]}"` : "";
			const c = cls(t);
			return `<path${c ? ` class="${c}"` : ""} d="${d}" fill="none" stroke="${colors[t]}" stroke-width="${S}"${op}/>`;
		})
		.join("");
}

function renderSun(celestialY: number): string {
	return (
		`<g transform="translate(10,${Math.max(2, celestialY - 8)})">` +
		`<g class="sun">` +
		paintTones(sunPaths, SUN_COLORS, SUN_OPACITY, (t) => (t === 6 ? "sun-glint" : "")) +
		`</g></g>`
	);
}

function renderMoon(moonX: number, celestialY: number): string {
	return (
		`<g transform="translate(${moonX},${Math.max(2, celestialY - 4)})">` +
		`<g class="moon">` +
		paintTones(moonPaths, MOON_COLORS, MOON_OPACITY, () => "") +
		`</g></g>`
	);
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/** SVG defs: sky gradients + cloud geometry (emitted once per document). */
export function renderSkyDefs(): string {
	let clouds = "";
	cloudPaths.forEach((paths, v) =>
		paths.forEach((d, t) => {
			if (d) clouds += `<path id="c${v}t${t}" d="${d}"/>`;
		}),
	);
	return `<defs>
  <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#5aa0de"/>
    <stop offset="42%" stop-color="#8ec4ef"/>
    <stop offset="72%" stop-color="#c9dff5"/>
    <stop offset="100%" stop-color="#f3c49a"/>
  </linearGradient>
  <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#070b18"/>
    <stop offset="40%" stop-color="#141c33"/>
    <stop offset="75%" stop-color="#2a1f45"/>
    <stop offset="100%" stop-color="#4a2f55"/>
  </linearGradient>
  ${clouds}
</defs>`;
}

export function renderSkyBackground(width: number, height: number): string {
	return (
		`<rect class="sky sky-day light-only" width="${width}" height="${height}" fill="url(#sky-day)"/>` +
		`<rect class="sky sky-night dark-only" width="${width}" height="${height}" fill="url(#sky-night)"/>`
	);
}

export interface SkyDecorOptions {
	width: number;
	theme: "auto" | "light" | "dark";
	/** Top Y of the tallest building. */
	peakY: number;
	/** Ground/grass top: mountains sit on this; clouds stay well above. */
	groundY: number;
	/** `back` behind buildings, `front` overlapping peaks, `all` for standalone previews. */
	layer?: "back" | "front" | "all";
}

function themed(theme: SkyDecorOptions["theme"], day: string, night: string): string {
	if (theme === "light") return `<g class="sky-layer">${day}</g>`;
	if (theme === "dark") return `<g class="sky-layer">${night}</g>`;
	return `<g class="light-only">${day}</g><g class="dark-only">${night}</g>`;
}

export function renderSkyDecor(options: SkyDecorOptions): string {
	const { width, theme, peakY, groundY, layer = "all" } = options;
	const py = Math.max(2, peakY);
	const maxY = Math.max(20, groundY - 28);
	const celestialY = clampSkyY(10, Math.min(18, Math.max(10, Math.floor(maxY * 0.08))));

	const moonX = Math.max(100, width - 72);
	// Sun/moon footprints widened by their drift keyframes (sun +22px, moon -36px).
	const sunZone: Zone = { x0: 4, x1: 10 + SUN_N * S + 26 };
	const moonZone: Zone = { x0: moonX - 40, x1: moonX + MOON_N * S + 4 };

	// Depth: mountains → clouds → celestial last so sun/moon are never veiled.
	const backDay =
		renderMountains(width, groundY, true) +
		backClouds(width, groundY, true, sunZone) +
		birdAt(130, clampSkyY(Math.min(py + 20, cloudCeilingY(groundY) - 4), maxY - 10), 0) +
		birdAt(Math.floor(width * 0.3), clampSkyY(Math.min(py + 14, cloudCeilingY(groundY)), maxY - 10), 3) +
		birdAt(Math.floor(width * 0.55), clampSkyY(Math.min(py + 8, cloudCeilingY(groundY)), maxY - 10), 6) +
		balloons(width, Math.min(py, cloudCeilingY(groundY)), maxY) +
		renderSun(celestialY);

	const backNight =
		stars(width, Math.max(16, Math.floor(width / 24)), cloudCeilingY(groundY)) +
		renderMountains(width, groundY, false) +
		backClouds(width, groundY, false, moonZone) +
		balloonAt(Math.floor(width * 0.5), clampSkyY(28, maxY - 8), "#7eb6ff", 1) +
		balloonAt(Math.floor(width * 0.58), clampSkyY(34, maxY - 8), "#c9a24d", 4) +
		renderMoon(moonX, celestialY);

	const frontDay = frontClouds(width, groundY, true, sunZone);
	const frontNight = frontClouds(width, groundY, false, moonZone);

	if (layer === "back") return renderMountainDefs(width, groundY) + themed(theme, backDay, backNight);
	if (layer === "front") return themed(theme, frontDay, frontNight);
	return renderMountainDefs(width, groundY) + themed(theme, backDay + frontDay, backNight + frontNight);
}
