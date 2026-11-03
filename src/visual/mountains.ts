import {
	SKY_CELL as S,
	clamp,
	gridToPaths,
	mulberry32,
	noise,
	strokeUse,
} from "./skyShared";

/* Mountains: 3 parallax layers (snowy far range, blue mid, green hills) */

interface Peak {
	cp: number;
	hp: number;
	sl: number;
	sr: number;
}

function genRange(
	cols: number,
	rows: number,
	seed: number,
	spacing: number,
	snow: boolean,
): number[][] {
	const rnd = mulberry32(seed);
	const peaks: Peak[] = [];
	const n = Math.max(2, Math.round(cols / spacing));
	for (let i = 0; i < n; i++) {
		peaks.push({
			cp: Math.round(((i + 0.5) * cols) / n + (rnd() - 0.5) * spacing * 0.5),
			hp: Math.round(rows * (0.6 + 0.4 * rnd())),
			sl: 0.85 + 0.5 * rnd(),
			sr: 0.85 + 0.5 * rnd(),
		});
	}
	const h: number[] = [];
	const own: number[] = [];
	for (let c = 0; c < cols; c++) {
		let best = rows * 0.18 + noise(c * 0.07, seed) * rows * 0.16;
		let owner = -1;
		peaks.forEach((p, i) => {
			const d = c - p.cp;
			const v = p.hp - Math.abs(d) * (d < 0 ? p.sl : p.sr) + (noise(c * 0.4, seed + 3) - 0.5) * 2.2;
			if (v > best) {
				best = v;
				owner = i;
			}
		});
		h.push(clamp(Math.round(best), 1, rows));
		own.push(owner);
	}

	const grid: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(-1));
	for (let c = 0; c < cols; c++) {
		const pk = own[c]! >= 0 ? peaks[own[c]!]! : null;
		for (let hg = 0; hg < h[c]!; hg++) {
			const cp = pk ? pk.cp : c;
			const hp = pk ? pk.hp : h[c]!;
			const dPeak = Math.max(0, hp - 1 - hg);
			let lit: boolean;
			if (pk) {
				const term = cp + 0.28 * dPeak + (noise(dPeak * 0.5, seed + 9) - 0.5) * 3;
				lit = c < term;
			} else {
				lit = noise(c * 0.15, seed + 5) > 0.5;
			}
			const side = pk ? (c < cp ? pk.sl : pk.sr) : 1;
			const u = Math.abs(c - cp) * side - dPeak;
			const nn = noise(u * 0.16, seed + 17);
			let tone: number;
			if (snow && pk && hg >= hp * 0.66 + (noise(c * 0.5, seed + 23) - 0.5) * 3) {
				tone = lit ? 5 : 6;
			} else if (lit) {
				tone = nn > 0.64 ? 2 : nn < 0.2 ? 1 : 0;
			} else {
				tone = nn > 0.66 ? 4 : 3;
			}
			grid[rows - 1 - hg]![c] = tone;
		}
	}
	return grid;
}

function genHills(cols: number, rows: number, seed: number): number[][] {
	const grid: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(-1));
	for (let c = 0; c < cols; c++) {
		const hh = clamp(
			Math.round(rows * (0.45 + 0.45 * noise(c * 0.045, seed)) + (noise(c * 0.2, seed + 1) - 0.5) * 1.5),
			1,
			rows,
		);
		for (let hg = 0; hg < hh; hg++) {
			const top = hg === hh - 1;
			const patch = noise(c * 0.3 + hg * 0.5, seed + 7) > 0.68;
			grid[rows - 1 - hg]![c] = top ? 1 : patch ? 2 : 0;
		}
	}
	return grid;
}

const FAR_DAY = ["#c3d3f2", "#d9e4f8", "#b2c3e8", "#8fa3d3", "#7d91c4", "#ffffff", "#cdd9f4"];
const MID_DAY = ["#8bb6d4", "#9fc6df", "#7aa6c9", "#5f87b8", "#5478aa"];
const NEAR_DAY = ["#4f8a6a", "#6aa47a", "#427a5c"];
const FAR_NIGHT = ["#565c99", "#6a70ad", "#4a4f8a", "#363a72", "#2d3163", "#dbe2ff", "#8f9bd6"];
const MID_NIGHT = ["#3b4880", "#46548e", "#33406f", "#2a3360", "#232b52"];
const NEAR_NIGHT = ["#1f3a4a", "#2e5560", "#193240"];

/** Geometry once in <defs>; day/night only swap fills via <use>. */
export function renderMountainDefs(width: number, groundY: number): string {
	const cols = Math.ceil(width / S) + 1;
	const farRows = clamp(Math.round((groundY * 0.55) / S), 14, 60);
	const midRows = clamp(Math.round((groundY * 0.36) / S), 10, 40);
	const nearRows = clamp(Math.round((groundY * 0.12) / S), 4, 14);
	const layers: Array<[string, number[][], number]> = [
		["mf", genRange(cols, farRows, 101, 46, true), 7],
		["mm", genRange(cols, midRows, 202, 34, false), 5],
		["mn", genHills(cols, nearRows, 303), 3],
	];
	let defs = "<defs>";
	for (const [id, grid, tones] of layers) {
		const rows = grid.length;
		const paths = gridToPaths(grid, tones, S, 0, groundY - rows * S);
		paths.forEach((d, t) => {
			if (d) defs += `<path id="${id}${t}" d="${d}"/>`;
		});
	}
	return defs + "</defs>";
}

export function renderMountains(width: number, groundY: number, day: boolean): string {
	const uses = (id: string, pal: string[]) => pal.map((c, t) => strokeUse(`${id}${t}`, c)).join("");
	const haze = (color: string, y: number, ops: number[]) =>
		ops
			.map(
				(o, i) =>
					`<rect x="0" y="${y + i * S * 2}" width="${width}" height="${S * 2}" fill="${color}" opacity="${o}"/>`,
			)
			.join("");
	const hazeColor = day ? "#f3c49a" : "#4a2f55";
	return (
		uses("mf", day ? FAR_DAY : FAR_NIGHT) +
		haze(hazeColor, groundY - S * 6, [0.12, 0.2, 0.3]) +
		uses("mm", day ? MID_DAY : MID_NIGHT) +
		haze(hazeColor, groundY - S * 4, [0.1, 0.18]) +
		uses("mn", day ? NEAR_DAY : NEAR_NIGHT)
	);
}
