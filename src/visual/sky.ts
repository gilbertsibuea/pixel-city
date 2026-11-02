import { PALETTE } from "./buildings/palette";

const S = 3;

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
		`<g transform="translate(${x},${Math.max(0, y)})">` +
		`<g class="${cls}"${delayStyle} opacity="${opacity}">` +
		`<rect x="0" y="${S}" width="${w}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S}" y="0" width="${Math.max(S, w - S * 2)}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S * 2}" y="${-S}" width="${Math.max(S, w - S * 4)}" height="${S}" fill="${PALETTE.q}" opacity="0.85"/>` +
		`</g></g>`
	);
}

function birdAt(x: number, y: number, delay: number): string {
	return (
		`<g transform="translate(${x},${Math.max(0, y)})">` +
		`<g class="bird" style="animation-delay:${delay}s">` +
		`<rect x="0" y="2" width="3" height="2" fill="#1f2933"/>` +
		`<rect x="3" y="0" width="3" height="2" fill="#1f2933"/>` +
		`<rect x="6" y="2" width="3" height="2" fill="#1f2933"/>` +
		`</g></g>`
	);
}

function stars(width: number, count: number, peakY: number): string {
	const parts: string[] = [];
	const band = Math.max(36, peakY + 48);
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
		`<g transform="translate(${x},${Math.max(0, y)})">` +
		`<g class="balloon" style="animation-delay:${delay}s">` +
		`<rect x="0" y="0" width="6" height="8" fill="${color}"/>` +
		`<rect x="2" y="8" width="2" height="10" fill="#888"/>` +
		`</g></g>`
	);
}

function balloons(width: number, peakY: number): string {
	const mid = Math.floor(width * 0.5);
	const y0 = peakY + 28;
	const specs: Array<[number, number, string, number]> = [
		[mid - 10, y0, "#d94f4f", 0],
		[mid + 18, y0 + 6, "#4a7fc0", 2.5],
		[mid - 28, y0 + 12, "#c9a24d", 5],
		[mid + 40, y0 - 4, "#e85d75", 7],
	];
	return specs.map(([x, y, c, d]) => balloonAt(x, y, c, d)).join("");
}

/** Clouds behind towers — sit around / above the peak. */
function backClouds(width: number, peakY: number): string {
	return [
		cloudAt(18, peakY - 6, 1.0, "cloud", 0, 0.88),
		cloudAt(Math.floor(width * 0.3), peakY - 10, 1.25, "cloud-alt", 2, 0.85),
		cloudAt(Math.floor(width * 0.58), peakY - 4, 0.95, "cloud", 4, 0.9),
		cloudAt(Math.floor(width * 0.82), peakY - 8, 1.1, "cloud-alt", 1, 0.86),
		cloudAt(40, peakY + 14, 1.15, "cloud-alt", 3, 0.8),
		cloudAt(Math.floor(width * 0.45), peakY + 18, 1.0, "cloud", 5, 0.82),
	].join("");
}

/**
 * Clouds drawn in front of towers so the tip reads as piercing the cloud deck.
 * Anchored to peakY — not lifted away from the building.
 */
function frontClouds(width: number, peakY: number): string {
	return [
		cloudAt(8, peakY + 8, 1.05, "cloud", 1.2, 0.78),
		cloudAt(Math.floor(width * 0.22), peakY + 22, 1.2, "cloud-alt", 2.8, 0.8),
		cloudAt(Math.floor(width * 0.48), peakY + 6, 0.9, "cloud", 0.6, 0.75),
		cloudAt(Math.floor(width * 0.7), peakY + 26, 1.3, "cloud-alt", 4.2, 0.82),
		cloudAt(Math.floor(width * 0.88), peakY + 12, 0.85, "cloud", 3.1, 0.77),
		cloudAt(Math.floor(width * 0.35), peakY + 38, 1.1, "cloud", 5.5, 0.7),
		cloudAt(Math.floor(width * 0.62), peakY + 44, 1.0, "cloud-alt", 1.8, 0.72),
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
	/** Top Y of the tallest building — clouds wrap this instead of floating far above. */
	peakY: number;
	/** `back` behind buildings, `front` overlapping peaks, `all` for standalone previews. */
	layer?: "back" | "front" | "all";
}

function wrapTheme(theme: SkyDecorOptions["theme"], day: string, night: string): string {
	if (theme === "light") return day.replace(/class="light-only"/g, 'class="sky-layer"');
	if (theme === "dark") return night.replace(/class="dark-only"/g, 'class="sky-layer"');
	return day + night;
}

export function renderSkyDecor(options: SkyDecorOptions): string {
	const { width, theme, peakY, layer = "all" } = options;
	const py = Math.max(2, peakY);

	const sun =
		`<g transform="translate(26,${Math.max(2, py - 4)})">` +
		`<g class="sun">` +
		`<circle cx="10" cy="10" r="10" fill="${PALETTE.y}"/>` +
		`<rect x="8" y="-8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="8" y="24" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="-8" y="8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="24" y="8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`</g></g>`;

	const moonX = Math.max(80, width - 56);
	const moon =
		`<g transform="translate(${moonX},${Math.max(2, py - 2)})">` +
		`<g class="moon">` +
		`<circle cx="10" cy="10" r="10" fill="${PALETTE.f}"/>` +
		`<circle cx="16" cy="6" r="8" fill="#0d1428"/>` +
		`</g></g>`;

	const backDay =
		`<g class="light-only">` +
		sun +
		backClouds(width, py) +
		birdAt(40, py + 20, 0) +
		birdAt(Math.floor(width * 0.3), py + 14, 3) +
		birdAt(Math.floor(width * 0.55), py + 8, 6) +
		balloons(width, py) +
		`</g>`;

	const backNight =
		`<g class="dark-only">` +
		moon +
		stars(width, Math.max(16, Math.floor(width / 24)), py) +
		backClouds(width, py) +
		balloonAt(Math.floor(width * 0.5), py + 30, "#7eb6ff", 1) +
		balloonAt(Math.floor(width * 0.58), py + 36, "#c9a24d", 4) +
		`</g>`;

	const frontDay = `<g class="light-only">${frontClouds(width, py)}</g>`;
	const frontNight = `<g class="dark-only">${frontClouds(width, py)}</g>`;

	if (layer === "back") return wrapTheme(theme, backDay, backNight);
	if (layer === "front") return wrapTheme(theme, frontDay, frontNight);
	return wrapTheme(theme, backDay + frontDay, backNight + frontNight);
}
