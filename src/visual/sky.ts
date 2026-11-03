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
): string {
	const ph = CLOUD_SPECS[variant]!.h * S;
	const topMax = Math.max(2, ceilingY - ph);
	return cloudAt(x, clamp(y, 2, topMax), variant, cls, delay, opacity, day, flip);
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

/** Back clouds stay in the upper sky so mountains remain visible below. */
function backClouds(width: number, groundY: number, day: boolean): string {
	const f = (r: number) => Math.floor(width * r);
	const ceiling = cloudCeilingY(groundY);
	return [
		placeCloud(f(0.02), 4, 0, "cloud", 0, 0.88, day, ceiling),
		placeCloud(f(0.3), 8, 2, "cloud-alt", 2, 0.86, day, ceiling),
		placeCloud(f(0.58), 2, 1, "cloud", 4, 0.88, day, ceiling, true),
		placeCloud(f(0.82), 10, 3, "cloud-alt", 1, 0.84, day, ceiling),
		placeCloud(f(0.08), 6, 4, "cloud-alt", 3, 0.72, day, ceiling),
		placeCloud(f(0.64), 12, 5, "cloud", 5, 0.7, day, ceiling),
	].join("");
}

/** Front layer: thin wisps only, high up — never big banks over rooftops. */
function frontClouds(width: number, groundY: number, day: boolean): string {
	const f = (r: number) => Math.floor(width * r);
	const ceiling = Math.min(cloudCeilingY(groundY), Math.floor(groundY * 0.28));
	return [
		placeCloud(f(0.18), 6, 4, "cloud", 1, 0.65, day, ceiling),
		placeCloud(f(0.55), 10, 5, "cloud-alt", 2.5, 0.62, day, ceiling, true),
	].join("");
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

	const sun =
		`<g transform="translate(26,${celestialY})">` +
		`<g class="sun">` +
		`<circle cx="10" cy="10" r="10" fill="${PALETTE.y}"/>` +
		`<rect x="8" y="-8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="8" y="24" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="-8" y="8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="24" y="8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`</g></g>`;

	const moonX = Math.max(80, width - 56);
	const moon =
		`<g transform="translate(${moonX},${celestialY})">` +
		`<g class="moon">` +
		`<circle cx="10" cy="10" r="10" fill="${PALETTE.f}"/>` +
		`<circle cx="16" cy="6" r="8" fill="#0d1428"/>` +
		`</g></g>`;

	// Depth: mountains on the horizon, then upper-sky clouds (never burying peaks).
	const backDay =
		sun +
		renderMountains(width, groundY, true) +
		backClouds(width, groundY, true) +
		birdAt(40, clampSkyY(Math.min(py + 20, cloudCeilingY(groundY) - 4), maxY - 10), 0) +
		birdAt(Math.floor(width * 0.3), clampSkyY(Math.min(py + 14, cloudCeilingY(groundY)), maxY - 10), 3) +
		birdAt(Math.floor(width * 0.55), clampSkyY(Math.min(py + 8, cloudCeilingY(groundY)), maxY - 10), 6) +
		balloons(width, Math.min(py, cloudCeilingY(groundY)), maxY);

	const backNight =
		moon +
		stars(width, Math.max(16, Math.floor(width / 24)), cloudCeilingY(groundY)) +
		renderMountains(width, groundY, false) +
		backClouds(width, groundY, false) +
		balloonAt(Math.floor(width * 0.5), clampSkyY(28, maxY - 8), "#7eb6ff", 1) +
		balloonAt(Math.floor(width * 0.58), clampSkyY(34, maxY - 8), "#c9a24d", 4);

	const frontDay = frontClouds(width, groundY, true);
	const frontNight = frontClouds(width, groundY, false);

	if (layer === "back") return renderMountainDefs(width, groundY) + themed(theme, backDay, backNight);
	if (layer === "front") return themed(theme, frontDay, frontNight);
	return renderMountainDefs(width, groundY) + themed(theme, backDay + frontDay, backNight + frontNight);
}
