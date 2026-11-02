/**
 * Generates a tower sprite grid: side walls in `frame`, windows (2 rows tall)
 * on every other column, ground-floor entrance door, optional antenna beacon.
 * Used by mid-rise and skyscraper so their proportions stay consistent.
 */
export function makeTowerRows(
	width: number,
	bodyHeight: number,
	wall: string,
	frame: string,
	antenna = false,
): string[] {
	const rows: string[] = [];
	if (antenna) {
		for (let i = 0; i < 4; i++) {
			const r = Array<string>(width).fill(".");
			r[width >> 1] = i === 0 ? "A" : frame;
			rows.push(r.join(""));
		}
	}
	rows.push(frame.repeat(width)); // roof
	const doorCol = Math.max(1, Math.floor(width / 2) - 1);
	for (let i = 0; i < bodyHeight; i++) {
		let r = "";
		const nearGround = i >= bodyHeight - 2;
		for (let j = 0; j < width; j++) {
			const edge = j === 0 || j === width - 1;
			if (nearGround && (j === doorCol || j === doorCol + 1)) {
				r += "d";
				continue;
			}
			const windowCell =
				j % 2 === 1 && (i % 4 === 1 || i % 4 === 2) && i < bodyHeight - 2;
			r += edge ? frame : windowCell ? "w" : wall;
		}
		rows.push(r);
	}
	rows.push(frame.repeat(width)); // base
	return rows;
}
