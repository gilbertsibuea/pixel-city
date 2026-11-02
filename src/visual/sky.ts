import { PALETTE } from "./buildings/palette";

const S = 4;

/**
 * Outer <g transform> sets world position; inner animated class only uses
 * relative CSS transforms so attribute translate is not overwritten.
 */
function cloudAt(
	x: number,
	y: number,
	scale = 1,
	cls = "cloud",
	delay = 0,
	opacity = 0.92,
): string {
	const w = Math.max(S * 4, Math.round(S * 6 * scale));
	const delayStyle = delay ? ` style="animation-delay:${delay}s"` : "";
	return (
		`<g transform="translate(${x},${y})">` +
		`<g class="${cls}"${delayStyle} opacity="${opacity}">` +
		`<rect x="0" y="${S}" width="${w}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S}" y="0" width="${Math.max(S, w - S * 2)}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S * 2}" y="${-S}" width="${Math.max(S, w - S * 4)}" height="${S}" fill="${PALETTE.q}" opacity="0.85"/>` +
		`</g></g>`
	);
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
	const y0 = clampSkyY(peakY + 24, maxY - 8);
	const specs: Array<[number, number, string, number]> = [
		[mid - 10, y0, "#d94f4f", 0],
		[mid + 18, clampSkyY(y0 + 6, maxY - 8), "#4a7fc0", 2.5],
		[mid - 28, clampSkyY(y0 + 10, maxY - 8), "#c9a24d", 5],
		[mid + 40, clampSkyY(y0 - 4, maxY - 8), "#e85d75", 7],
	];
	return specs.map(([x, y, c, d]) => balloonAt(x, y, c, d)).join("");
}

/** Clouds behind towers — kept strictly above the ground line. */
function backClouds(width: number, peakY: number, maxY: number): string {
	return [
		cloudAt(18, clampSkyY(peakY - 6, maxY), 1.0, "cloud", 0, 0.88),
		cloudAt(Math.floor(width * 0.3), clampSkyY(peakY - 10, maxY), 1.25, "cloud-alt", 2, 0.85),
		cloudAt(Math.floor(width * 0.58), clampSkyY(peakY - 4, maxY), 0.95, "cloud", 4, 0.9),
		cloudAt(Math.floor(width * 0.82), clampSkyY(peakY - 8, maxY), 1.1, "cloud-alt", 1, 0.86),
		cloudAt(40, clampSkyY(peakY + 14, maxY), 1.15, "cloud-alt", 3, 0.8),
		cloudAt(Math.floor(width * 0.45), clampSkyY(peakY + 18, maxY), 1.0, "cloud", 5, 0.82),
	].join("");
}

/**
 * Front clouds (over peaks). On short skylines, stay in the upper sky only —
 * never spill onto grass/road.
 */
function frontClouds(width: number, peakY: number, maxY: number): string {
	const skyDepth = maxY - peakY;
	if (skyDepth < 36) {
		// Shallow sky: a couple of soft clouds near the top, not deep offsets.
		return [
			cloudAt(Math.floor(width * 0.2), clampSkyY(8, maxY), 1.0, "cloud", 1, 0.75),
			cloudAt(Math.floor(width * 0.55), clampSkyY(14, maxY), 1.15, "cloud-alt", 2.5, 0.72),
			cloudAt(Math.floor(width * 0.8), clampSkyY(10, maxY), 0.9, "cloud", 4, 0.7),
		].join("");
	}

	const softMax = Math.min(maxY, peakY + Math.floor(skyDepth * 0.55));
	return [
		cloudAt(8, clampSkyY(peakY + 8, softMax), 1.05, "cloud", 1.2, 0.78),
		cloudAt(Math.floor(width * 0.22), clampSkyY(peakY + 16, softMax), 1.2, "cloud-alt", 2.8, 0.8),
		cloudAt(Math.floor(width * 0.48), clampSkyY(peakY + 6, softMax), 0.9, "cloud", 0.6, 0.75),
		cloudAt(Math.floor(width * 0.7), clampSkyY(peakY + 20, softMax), 1.3, "cloud-alt", 4.2, 0.82),
		cloudAt(Math.floor(width * 0.88), clampSkyY(peakY + 12, softMax), 0.85, "cloud", 3.1, 0.77),
	].join("");
}

/** SVG defs for morning/night sky gradients. */
export function renderSkyDefs(): string {
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
	/** Ground/grass top — clouds must stay above this. */
	groundY: number;
	/** `back` behind buildings, `front` overlapping peaks, `all` for standalone previews. */
	layer?: "back" | "front" | "all";
}

function wrapTheme(theme: SkyDecorOptions["theme"], day: string, night: string): string {
	if (theme === "light") return day.replace(/class="light-only"/g, 'class="sky-layer"');
	if (theme === "dark") return night.replace(/class="dark-only"/g, 'class="sky-layer"');
	return day + night;
}

export function renderSkyDecor(options: SkyDecorOptions): string {
	const { width, theme, peakY, groundY, layer = "all" } = options;
	const py = Math.max(2, peakY);
	/** Leave room above grass so clouds never sit on the road. */
	const maxY = Math.max(20, groundY - 28);

	/** Always near the top of the sky — never tied to short building peaks. */
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

	const backDay =
		`<g class="light-only">` +
		sun +
		backClouds(width, py, maxY) +
		birdAt(40, clampSkyY(py + 20, maxY - 10), 0) +
		birdAt(Math.floor(width * 0.3), clampSkyY(py + 14, maxY - 10), 3) +
		birdAt(Math.floor(width * 0.55), clampSkyY(py + 8, maxY - 10), 6) +
		balloons(width, py, maxY) +
		`</g>`;

	const backNight =
		`<g class="dark-only">` +
		moon +
		stars(width, Math.max(16, Math.floor(width / 24)), maxY) +
		backClouds(width, py, maxY) +
		balloonAt(Math.floor(width * 0.5), clampSkyY(py + 28, maxY - 8), "#7eb6ff", 1) +
		balloonAt(Math.floor(width * 0.58), clampSkyY(py + 34, maxY - 8), "#c9a24d", 4) +
		`</g>`;

	const frontDay = `<g class="light-only">${frontClouds(width, py, maxY)}</g>`;
	const frontNight = `<g class="dark-only">${frontClouds(width, py, maxY)}</g>`;

	if (layer === "back") return wrapTheme(theme, backDay, backNight);
	if (layer === "front") return wrapTheme(theme, frontDay, frontNight);
	return wrapTheme(theme, backDay + frontDay, backNight + frontNight);
}
