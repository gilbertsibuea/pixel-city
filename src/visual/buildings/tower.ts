/**
 * Shared helpers for the tall sprites (mid-rise, skyscraper, landmark).
 * Light comes from the upper-left: lit left edge, deep outline on the right.
 */

/**
 * Diagonal sky reflection across a glass facade (only replaces body `m` cells).
 * Returns the glass char for (row, col): `L` glint core, `l` soft band, else `m`.
 */
export function glassAt(row: number, col: number, period = 23): string {
	const k = (((row + col * 2) % period) + period) % period;
	if (k === 0) return "L";
	if (k <= 2) return "l";
	return "m";
}

export function assertRow(id: string, row: string, width: number): string {
	if (row.length !== width) throw new Error(`${id} row "${row}" has width ${row.length}, expected ${width}`);
	return row;
}

/** Repeat a floor pattern (array of rows) until `count` rows are produced. */
export function repeatRows(pattern: readonly string[], count: number): string[] {
	const out: string[] = [];
	for (let i = 0; i < count; i++) out.push(pattern[i % pattern.length]!);
	return out;
}
