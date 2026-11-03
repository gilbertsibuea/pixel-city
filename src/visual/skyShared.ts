/** Shared pixel-sky helpers (clouds + mountains). */

export const SKY_CELL = 4;

export function mulberry32(seed: number): () => number {
	let a = seed | 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function lattice(i: number, seed: number): number {
	let h = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 1D value noise in [0,1]. */
export function noise(x: number, seed: number): number {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return lattice(i, seed) * (1 - u) + lattice(i + 1, seed) * u;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Turns a grid of tone indices (-1 = empty) into one SVG path `d` per tone.
 * Each run is a horizontal stroke line (fill="none"), chained with relative moves.
 */
export function gridToPaths(
	grid: number[][],
	toneCount: number,
	cell: number,
	originX: number,
	originY: number,
): string[] {
	const out: string[] = Array<string>(toneCount).fill("");
	for (let y = 0; y < grid.length; y++) {
		const row = grid[y]!;
		const cy = originY + y * cell + cell / 2;
		const last: number[] = Array<number>(toneCount).fill(-1);
		for (let x = 0; x < row.length; ) {
			const t = row[x]!;
			if (t < 0) {
				x++;
				continue;
			}
			let n = 1;
			while (row[x + n] === t) n++;
			if (last[t]! < 0) out[t] += `M${originX + x * cell} ${cy}h${n * cell}`;
			else out[t] += `m${(x - last[t]!) * cell} 0h${n * cell}`;
			last[t] = x + n;
			x += n;
		}
	}
	return out;
}

/** <use> that paints a stroke-encoded path. */
export function strokeUse(id: string, color: string, cell = SKY_CELL): string {
	return `<use href="#${id}" fill="none" stroke="${color}" stroke-width="${cell}"/>`;
}
