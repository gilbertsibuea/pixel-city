/**
 * Grass strip under the buildings.
 * Light from the left (same as building sprites): highlight band on top/left,
 * cooler shadow toward the road edge, plus deterministic tufts & soil patches.
 */

export const GROUND_H = 24;

/* ------------------------------------------------------------------ */
/* Theme CSS                                                           */
/* ------------------------------------------------------------------ */

type Theme = "light" | "dark";

const COLORS: Record<Theme, Record<string, string>> = {
	light: {
		ground: "#5a8f45",
		"ground-hi": "#7aad5c", // sunlit blades / top lip
		"ground-mid": "#4f8140",
		"ground-lo": "#3f6a34", // toward road
		"ground-deep": "#345a2c",
		"ground-lit": "#8fbf6a", // left-side catch light
		"ground-soil": "#6b5438", // bare patches near curb
		"ground-soil-lo": "#53402c",
		"ground-tuft": "#6fa050",
		"ground-tuft-hi": "#9ccc6e",
		"ground-flower": "#e8c35a",
	},
	dark: {
		ground: "#2f4a2a",
		"ground-hi": "#3d6136",
		"ground-mid": "#284024",
		"ground-lo": "#1f331c",
		"ground-deep": "#182816",
		"ground-lit": "#4a7340",
		"ground-soil": "#3a3228",
		"ground-soil-lo": "#2a241c",
		"ground-tuft": "#3a5a32",
		"ground-tuft-hi": "#5a8050",
		"ground-flower": "#a8893a",
	},
};

function rules(theme: Theme): string {
	return Object.entries(COLORS[theme])
		.map(([cls, fill]) => `.${cls} { fill: ${fill}; }`)
		.join("\n");
}

/** CSS fills for the grass band (light + auto dark). */
export function groundCss(): string {
	return `\n${rules("light")}\n@media (prefers-color-scheme: dark) {\n${rules("dark")}\n}\n`;
}

/** Theme-forced ground CSS (city theme locked to light or dark). */
export function groundThemeCss(theme: Theme): string {
	return `\n${rules(theme)}\n`;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
	let a = seed | 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const r = (cls: string, x: number, y: number, w: number, h: number) =>
	`<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

/* ------------------------------------------------------------------ */
/* Surface                                                             */
/* ------------------------------------------------------------------ */

function grassSurface(width: number, y: number, h: number): string {
	const rnd = mulberry32((width * 17) ^ 0x6d11);
	const top = y;
	const mid = y + Math.floor(h * 0.45);
	const low = y + h - 5;
	const bottom = y + h;

	let out = r("ground", 0, top, width, h);
	// Horizontal bands: sunlit crest → mid turf → cooler shadow near the road.
	out += r("ground-hi", 0, top, width, 3);
	out += r("ground-mid", 0, mid, width, low - mid);
	out += r("ground-lo", 0, low, width, bottom - low - 2);
	out += r("ground-deep", 0, bottom - 2, width, 2);

	// Soft left catch-light (matches building sun direction).
	out += r("ground-lit", 0, top + 2, 3, h - 4);

	// Bare soil patches near the curb (deterministic).
	const soils: string[] = [];
	const soilsLo: string[] = [];
	for (let x = 10 + Math.floor(rnd() * 20); x < width - 8; x += 28 + Math.floor(rnd() * 40)) {
		const w = 4 + Math.floor(rnd() * 8);
		const sy = low + Math.floor(rnd() * 2);
		soils.push(`M${x} ${sy}h${w}v2h-${w}z`);
		if (rnd() < 0.45) soilsLo.push(`M${x + 1} ${sy + 1}h${Math.max(2, w - 2)}v1h-${Math.max(2, w - 2)}z`);
		x += w;
	}
	if (soils.length) out += `<path class="ground-soil" d="${soils.join("")}"/>`;
	if (soilsLo.length) out += `<path class="ground-soil-lo" d="${soilsLo.join("")}"/>`;

	// Speckle texture across the mid band.
	const dark: string[] = [];
	const light: string[] = [];
	for (let i = 0; i < Math.floor(width / 6); i++) {
		const sx = Math.floor((rnd() * width) / 2) * 2;
		const sy = top + 4 + Math.floor(rnd() * Math.max(1, low - top - 6));
		(rnd() < 0.55 ? dark : light).push(`M${sx} ${sy}h2v1h-2z`);
	}
	out += `<path class="ground-deep" d="${dark.join("")}"/>`;
	out += `<path class="ground-hi" d="${light.join("")}"/>`;

	return out;
}

/** Tiny blade clusters along the building edge of the grass. */
function grassTufts(width: number, y: number): string {
	const rnd = mulberry32((width * 31) ^ 0x51ce);
	const blades: string[] = [];
	const tips: string[] = [];
	const flowers: string[] = [];

	for (let x = 4 + Math.floor(rnd() * 8); x < width - 4; x += 7 + Math.floor(rnd() * 11)) {
		const h = 2 + Math.floor(rnd() * 3);
		const base = y;
		// Short blades peek above the strip (≤3px); buildings paint later and cover overlaps.
		const top = base - Math.min(3, h);
		blades.push(`M${x} ${top}h1v${base - top + 1}h-1z`);
		if (rnd() < 0.5) blades.push(`M${x + 1} ${top + 1}h1v${base - top}h-1z`);
		if (rnd() < 0.35) tips.push(`M${x} ${top}h1v1h-1z`);
		// Occasional tiny flower dot
		if (rnd() < 0.12) flowers.push(`M${x + (rnd() < 0.5 ? 0 : 1)} ${top}h1v1h-1z`);
		x += 1;
	}

	let out = "";
	if (blades.length) out += `<path class="ground-tuft" d="${blades.join("")}"/>`;
	if (tips.length) out += `<path class="ground-tuft-hi" d="${tips.join("")}"/>`;
	if (flowers.length) out += `<path class="ground-flower" d="${flowers.join("")}"/>`;
	return out;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function renderGround(width: number, groundY: number, height = GROUND_H): string {
	return (
		`<g class="ground-layer">` +
		grassSurface(width, groundY, height) +
		grassTufts(width, groundY) +
		`</g>`
	);
}
