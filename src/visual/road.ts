/**
 * Highway-style road band: textured asphalt, edge lines, dashed lane marks,
 * W-beam guardrail with posts and reflectors, and green guide signs.
 * Everything is themed through CSS classes (see roadCss / roadThemeCss).
 */

export const ROAD_H = 16;

/* ------------------------------------------------------------------ */
/* Theme CSS                                                           */
/* ------------------------------------------------------------------ */

type Theme = "light" | "dark";

const COLORS: Record<Theme, Record<string, string>> = {
	light: {
		road: "#4a4a52",
		"road-shoulder": "#3b3b43", // shadow under the guardrail
		"road-edge": "#e4e4ea",
		"road-line": "#e4e4ea",
		"road-curb": "#35353d",
		"road-spk-d": "#3f3f47",
		"road-spk-l": "#5a5a63",
		"road-wear": "#43434a",
		"road-joint": "#3a3a42",
		"rail-hi": "#dfe2e8",
		"rail-groove": "#7b8190",
		"rail-lo": "#b5bac6",
		"rail-post": "#5d6270",
		"rail-seam": "#8a90a0",
		"rail-ref": "#f2b134",
		"sign-board": "#1d8a57",
		"sign-board-lo": "#156c44",
		"sign-hi": "#3aa873",
		"sign-frame": "#eef4ec",
		"sign-text": "#f6faf4",
		"sign-post": "#6b7080",
	},
	dark: {
		road: "#2a2a32",
		"road-shoulder": "#1f1f26",
		"road-edge": "#8a8a96",
		"road-line": "#6a6a72",
		"road-curb": "#1c1c22",
		"road-spk-d": "#222229",
		"road-spk-l": "#34343c",
		"road-wear": "#24242b",
		"road-joint": "#1d1d23",
		"rail-hi": "#9aa0b4",
		"rail-groove": "#4a4f60",
		"rail-lo": "#7d8399",
		"rail-post": "#3a3e4c",
		"rail-seam": "#4a4f60",
		"rail-ref": "#ffd166",
		"sign-board": "#14684a",
		"sign-board-lo": "#0f5139",
		"sign-hi": "#228a64",
		"sign-frame": "#b9c9bf",
		"sign-text": "#e5efe6",
		"sign-post": "#454a5a",
	},
};

function rules(theme: Theme): string {
	return Object.entries(COLORS[theme])
		.map(([cls, fill]) => `.${cls} { fill: ${fill}; }`)
		.join("\n");
}

/** CSS fills for the road, rails and signs (light + auto dark). */
export function roadCss(): string {
	return `\n${rules("light")}\n@media (prefers-color-scheme: dark) {\n${rules("dark")}\n}\n`;
}

/** Theme-forced CSS (city theme locked to light or dark). */
export function roadThemeCss(theme: Theme): string {
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
/* Road surface                                                        */
/* ------------------------------------------------------------------ */

function roadSurface(width: number, y: number, h: number): string {
	const lane0 = y + 4;
	const lane1 = y + h - 4;
	const mid = y + Math.floor(h / 2) - 1;
	const rnd = mulberry32(77);

	let out = r("road", 0, y, width, h);
	out += r("road-shoulder", 0, y, width, 2);
	out += r("road-edge", 0, y + 2, width, 2);
	out += r("road-edge", 0, lane1, width, 2);
	out += r("road-curb", 0, y + h - 2, width, 2);

	// Concrete expansion joints, like a toll road.
	for (let x = 96; x < width; x += 96) out += r("road-joint", x, lane0, 2, lane1 - lane0);

	// Worn tire tracks (1px strips) in both lanes.
	const wear: string[] = [];
	for (const wy of [lane0 + 1, mid + 3]) {
		for (let x = Math.floor(rnd() * 30); x < width; x += 12 + Math.floor(rnd() * 28)) {
			const len = 20 + Math.floor(rnd() * 50);
			wear.push(`M${x} ${wy}h${len}v1h-${len}z`);
			x += len;
		}
	}
	out += `<path class="road-wear" d="${wear.join("")}"/>`;

	// Asphalt speckles (2x2), darker and lighter grains.
	const dark: string[] = [];
	const light: string[] = [];
	const rows = Math.max(1, Math.floor((lane1 - lane0) / 2));
	for (let i = 0; i < Math.floor(width / 8); i++) {
		const sx = Math.floor((rnd() * width) / 2) * 2;
		const sy = lane0 + Math.floor(rnd() * rows) * 2;
		(rnd() < 0.7 ? dark : light).push(`M${sx} ${sy}h2v2h-2z`);
	}
	out += `<path class="road-spk-d" d="${dark.join("")}"/>`;
	out += `<path class="road-spk-l" d="${light.join("")}"/>`;

	// Dashed centre line.
	const dashes: string[] = [];
	for (let x = 8; x < width; x += 24) dashes.push(`M${x} ${mid}h12v2h-12z`);
	out += `<path class="road-line" d="${dashes.join("")}"/>`;
	return out;
}

/* ------------------------------------------------------------------ */
/* Guardrail (W-beam)                                                  */
/* ------------------------------------------------------------------ */

/** Rail sits just above the road's top edge; posts reach into the shoulder. */
export function renderGuardrail(width: number, roadY: number): string {
	const top = roadY - 8;
	let out = "";
	const posts: string[] = [];
	for (let x = 6; x < width; x += 16) posts.push(`M${x} ${roadY - 3}h2v4h-2z`);
	out += `<path class="rail-post" d="${posts.join("")}"/>`;
	out += r("rail-hi", 0, top, width, 2);
	out += r("rail-groove", 0, top + 2, width, 1);
	out += r("rail-lo", 0, top + 3, width, 2);
	const seams: string[] = [];
	for (let x = 10; x < width; x += 64) seams.push(`M${x} ${top}h1v5h-1z`);
	out += `<path class="rail-seam" d="${seams.join("")}"/>`;
	const refs: string[] = [];
	for (let x = 14; x < width; x += 48) refs.push(`M${x} ${top}h3v2h-3z`);
	out += `<path class="rail-ref" d="${refs.join("")}"/>`;
	return out;
}

/* ------------------------------------------------------------------ */
/* Green guide sign with a tiny 3x5 pixel font                         */
/* ------------------------------------------------------------------ */

/** 3 columns x 5 rows, row-major, '1' = filled. */
const FONT: Record<string, string> = {
	A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
	E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
	I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
	M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
	Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
	U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
	Y: "101101010010010", Z: "111001010100111",
	"0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110",
	"4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010",
	"8": "111101111101111", "9": "111101111001110",
	"-": "000000111000000", ".": "000000000000010", ">": "100110111110100", "<": "001011111011001",
	" ": "000000000000000",
};

function textPath(line: string, x: number, y: number, cell: number): string {
	let d = "";
	let cx = x;
	for (const ch of line.toUpperCase()) {
		const g = FONT[ch] ?? FONT[" "]!;
		for (let row = 0; row < 5; row++) {
			for (let col = 0; col < 3; ) {
				if (g[row * 3 + col] !== "1") {
					col++;
					continue;
				}
				let n = 1;
				while (col + n < 3 && g[row * 3 + col + n] === "1") n++;
				d += `M${cx + col * cell} ${y + row * cell}h${n * cell}v${cell}h-${n * cell}z`;
				col += n;
			}
		}
		cx += 4 * cell;
	}
	return d;
}

/** Keep signs inside the grass strip so they never rise into building facades. */
const SIGN_MAX_ABOVE_ROAD = 20;

export interface RoadSign {
	/** Left edge of the board. */
	x: number;
	lines: string[];
	/** Pixel size of the font (default 1 — stays roadside-scale). */
	cell?: number;
}

/** Roadside guide sign standing on the grass, behind buildings in paint order. */
export function renderRoadSign(sign: RoadSign, roadY: number): string {
	const cell = sign.cell ?? 1;
	const lines = sign.lines.length ? sign.lines : [""];
	const textW = Math.max(...lines.map((l) => Math.max(1, l.length) * 4 * cell - cell));
	const lineH = 5 * cell;
	const gap = cell;
	const padX = 3;
	const padY = 2;
	let bw = textW + padX * 2;
	let bh = padY * 2 + lines.length * lineH + Math.max(0, lines.length - 1) * gap;
	const postH = 5;
	// Shrink board if it would poke above the grass band.
	const maxBh = Math.max(lineH + padY * 2, SIGN_MAX_ABOVE_ROAD - postH - 2);
	if (bh > maxBh) {
		bh = maxBh;
	}
	const bx = Math.round(sign.x);
	const by = roadY - 2 - postH - bh;

	const postW = 1;
	let out =
		r("sign-post", bx + 3, by + bh, postW, postH) +
		r("sign-post", bx + bw - 4, by + bh, postW, postH);
	out += r("sign-board", bx, by, bw, bh);
	out += r("sign-board-lo", bx, by + Math.round(bh * 0.6), bw, bh - Math.round(bh * 0.6));
	out += r("sign-hi", bx, by, bw, 1);
	out += r("sign-frame", bx + 2, by + 1, bw - 4, 1);
	out += r("sign-frame", bx + 2, by + bh - 2, bw - 4, 1);
	out += r("sign-frame", bx + 1, by + 2, 1, bh - 4);
	out += r("sign-frame", bx + bw - 2, by + 2, 1, bh - 4);

	let d = "";
	const maxLines = Math.max(1, Math.floor((bh - padY * 2 + gap) / (lineH + gap)));
	lines.slice(0, maxLines).forEach((line, i) => {
		const lw = Math.max(1, line.length) * 4 * cell - cell;
		d += textPath(line, bx + Math.round((bw - lw) / 2), by + padY + i * (lineH + gap), cell);
	});
	out += `<path class="sign-text" d="${d}"/>`;
	return out;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface RoadOptions {
	/** Toll-road style guardrail along the top edge (default true). */
	guardrail?: boolean;
	/** Guide signs. Default: one sign at ~20% of the width. Pass [] for none. */
	signs?: RoadSign[];
}

/**
 * Draw order: signs (behind) -> road surface -> guardrail (front).
 * Draw vehicles after this call so they pass in front of the road.
 */
export function renderRoad(
	width: number,
	roadY: number,
	height = ROAD_H,
	options: RoadOptions = {},
): string {
	// Small single-line default; pass signs: [] to hide, or custom RoadSign[].
	const signs =
		options.signs ?? [{ x: Math.max(8, Math.round(width * 0.12)), lines: ["CITY >"], cell: 1 }];
	return (
		signs.map((s) => renderRoadSign(s, roadY)).join("") +
		roadSurface(width, roadY, height) +
		(options.guardrail === false ? "" : renderGuardrail(width, roadY))
	);
}
