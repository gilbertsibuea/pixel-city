import { PALETTE } from "./buildings/palette";

/** Pixel size. Keep equal to the building pixel size so vehicles match the scene. */
const S = 3;

/**
 * Sprite legend (vehicles face RIGHT; `rev` is handled by your CSS class):
 *   b body (given color)   B body shade (auto, darker)   g glass
 *   w tire                 h hubcap                      l headlight
 *   t taillight            . transparent
 */
const CAR = [
	"..bbbb...",
	".bggbggb.",
	"tbbbbbbbl",
	"bwwbbbwwb",
	".ww...ww.",
];

const BUS = [
	".bbbbbbbbbbbbb.",
	"bggbggbggbggggb",
	"BBBBBBBBBBBBBBB",
	"bbbbbbbbbbbbbbb",
	"tbbbbbbbbbbbbbl",
	"bbwhwbbbbbwhwbb",
	"..www.....www..",
];

const GLASS = "#cfe6f7";
const HUB = "#9aa3ad";
const HEADLIGHT = "#fff3b0";
const TAILLIGHT = "#d9342b";

/** Darken a #rrggbb color by `amount` (0..1). */
function shade(hex: string, amount = 0.25): string {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return hex;
	const n = parseInt(m[1]!, 16);
	const c = (v: number) =>
		Math.max(0, Math.min(255, Math.round(v * (1 - amount)))).toString(16).padStart(2, "0");
	return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/**
 * Draws a sprite so its bottom edge sits on the ground line `groundY`.
 * Horizontal runs of the same color are merged to keep the SVG small.
 */
function drawSprite(rows: string[], fills: Record<string, string>, groundY: number): string {
	const top = groundY - rows.length * S;
	let out = "";
	rows.forEach((row, j) => {
		for (let i = 0; i < row.length; ) {
			const ch = row[i]!;
			const fill = fills[ch];
			if (!fill) {
				i++;
				continue;
			}
			let n = 1;
			while (row[i + n] === ch) n++;
			out += `<rect x="${i * S}" y="${top + j * S}" width="${n * S}" height="${S}" fill="${fill}"/>`;
			i += n;
		}
	});
	return out;
}

/** `y` keeps the old meaning: the ground line is y + 3*S (bottom of the wheels). */
export function renderCar(y: number, color: string, delaySec: number, rev = false): string {
	const cls = rev ? "vehicle rev" : "vehicle";
	const fills = {
		b: color,
		g: GLASS,
		w: PALETTE.n!,
		l: HEADLIGHT,
		t: TAILLIGHT,
	};
	return (
		`<g class="${cls}" style="animation-delay:${delaySec}s">` +
		drawSprite(CAR, fills, y + S * 3) +
		`</g>`
	);
}

export function renderBus(y: number, delaySec: number, rev = false): string {
	const cls = rev ? "vehicle rev" : "vehicle";
	const body = "#e6a817";
	const fills = {
		b: body,
		B: shade(body, 0.3),
		g: GLASS,
		w: PALETTE.n!,
		h: HUB,
		l: HEADLIGHT,
		t: TAILLIGHT,
	};
	return (
		`<g class="${cls}" style="animation-delay:${delaySec}s">` +
		drawSprite(BUS, fills, y + S * 3) +
		`</g>`
	);
}