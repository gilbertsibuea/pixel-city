import { PALETTE } from "./buildings/palette";

const S = 3;

/**
 * Outer <g transform> sets world position; inner animated class only uses
 * relative CSS transforms so attribute translate is not overwritten.
 */
function cloudAt(x: number, y: number, scale = 1, cls = "cloud", delay = 0): string {
	const w = Math.max(S * 4, Math.round(S * 6 * scale));
	const delayStyle = delay ? ` style="animation-delay:${delay}s"` : "";
	return (
		`<g transform="translate(${x},${y})">` +
		`<g class="${cls}"${delayStyle} opacity="0.92">` +
		`<rect x="0" y="${S}" width="${w}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S}" y="0" width="${Math.max(S, w - S * 2)}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S * 2}" y="${-S}" width="${Math.max(S, w - S * 4)}" height="${S}" fill="${PALETTE.q}" opacity="0.85"/>` +
		`</g></g>`
	);
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

function stars(width: number, count: number): string {
	const parts: string[] = [];
	for (let i = 0; i < count; i++) {
		const x = 12 + ((i * 97) % Math.max(width - 24, 1));
		const y = 8 + ((i * 53) % 40);
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

function balloons(width: number): string {
	const mid = Math.floor(width * 0.5);
	const specs: Array<[number, number, string, number]> = [
		[mid - 10, 42, "#d94f4f", 0],
		[mid + 18, 48, "#4a7fc0", 2.5],
		[mid - 28, 54, "#c9a24d", 5],
		[mid + 40, 38, "#e85d75", 7],
	];
	return specs.map(([x, y, c, d]) => balloonAt(x, y, c, d)).join("");
}

function dayCloudField(width: number): string {
	const row1 = [
		cloudAt(24, 6, 1.0, "cloud", 0),
		cloudAt(Math.floor(width * 0.28), 4, 1.3, "cloud-alt", 2),
		cloudAt(Math.floor(width * 0.55), 8, 0.9, "cloud", 4),
		cloudAt(Math.floor(width * 0.78), 5, 1.1, "cloud-alt", 1),
	];
	const row2 = [
		cloudAt(50, 22, 1.15, "cloud-alt", 3),
		cloudAt(Math.floor(width * 0.4), 26, 1.0, "cloud", 5),
		cloudAt(Math.floor(width * 0.68), 20, 1.25, "cloud-alt", 0.5),
	];
	const row3 = [
		cloudAt(16, 38, 0.85, "cloud", 6),
		cloudAt(Math.floor(width * 0.22), 42, 1.05, "cloud-alt", 2.5),
		cloudAt(Math.floor(width * 0.48), 36, 0.95, "cloud", 1.5),
		cloudAt(Math.floor(width * 0.72), 40, 1.2, "cloud-alt", 4.5),
		cloudAt(Math.floor(width * 0.88), 34, 0.8, "cloud", 3.5),
	];
	return [...row1, ...row2, ...row3].join("");
}

function nightCloudField(width: number): string {
	return [
		cloudAt(40, 10, 1.1, "cloud", 0),
		cloudAt(Math.floor(width * 0.35), 18, 1.0, "cloud-alt", 2),
		cloudAt(Math.floor(width * 0.6), 8, 1.2, "cloud", 4),
		cloudAt(Math.floor(width * 0.15), 32, 0.9, "cloud-alt", 1),
		cloudAt(Math.floor(width * 0.5), 36, 1.15, "cloud", 3),
		cloudAt(Math.floor(width * 0.8), 28, 1.0, "cloud-alt", 5),
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

export function renderSkyDecor(options: {
	width: number;
	theme: "auto" | "light" | "dark";
}): string {
	const { width, theme } = options;

	const sun =
		`<g transform="translate(26,12)">` +
		`<g class="sun">` +
		`<circle cx="10" cy="10" r="10" fill="${PALETTE.y}"/>` +
		`<rect x="8" y="-8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="8" y="24" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="-8" y="8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="24" y="8" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`</g></g>`;

	// Start near the right; CSS drifts westward (to the left).
	const moonX = Math.max(80, width - 56);
	const moon =
		`<g transform="translate(${moonX},14)">` +
		`<g class="moon">` +
		`<circle cx="10" cy="10" r="10" fill="${PALETTE.f}"/>` +
		`<circle cx="16" cy="6" r="8" fill="#0d1428"/>` +
		`</g></g>`;

	const daySky =
		`<g class="light-only">` +
		sun +
		dayCloudField(width) +
		birdAt(40, 30, 0) +
		birdAt(Math.floor(width * 0.3), 24, 3) +
		birdAt(Math.floor(width * 0.55), 16, 6) +
		balloons(width) +
		`</g>`;

	const nightSky =
		`<g class="dark-only">` +
		moon +
		stars(width, Math.max(16, Math.floor(width / 24))) +
		nightCloudField(width) +
		balloonAt(Math.floor(width * 0.5), 44, "#7eb6ff", 1) +
		balloonAt(Math.floor(width * 0.58), 50, "#c9a24d", 4) +
		`</g>`;

	if (theme === "light") {
		return daySky.replace(/class="light-only"/g, 'class="sky-layer"');
	}
	if (theme === "dark") {
		return nightSky.replace(/class="dark-only"/g, 'class="sky-layer"');
	}
	return daySky + nightSky;
}
