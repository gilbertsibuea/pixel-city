export interface TowerStyle {
	/** Char for the sunlit left edge and roof ledge (default: same as frame = old look). */
	edgeLight?: string;
	/** Char for sparse diagonal light streaks on the wall (glass reflection). */
	streak?: string;
}

/**
 * Tower sprite grid. SAME dimensions as before:
 *   height = (antenna ? 4 : 0) + 1 + bodyHeight + 1
 *
 * Retouch:
 *  - roof ledge: lit on the left, frame on the right
 *  - left edge lit (edgeLight), right edge frame  -> one consistent light source
 *  - window sills: frame char under every window pair (reads as floor slabs)
 *  - optional diagonal streaks on the wall (glass reflection)
 */
export function makeTowerRows(
	width: number,
	bodyHeight: number,
	wall: string,
	frame: string,
	antenna = false,
	style: TowerStyle = {},
): string[] {
	const edgeLight = style.edgeLight ?? frame;
	const streak = style.streak;
	const rows: string[] = [];

	if (antenna) {
		for (let i = 0; i < 4; i++) {
			const r = Array<string>(width).fill(".");
			r[width >> 1] = i === 0 ? "A" : frame;
			rows.push(r.join(""));
		}
	}

	rows.push(edgeLight.repeat(width - 1) + frame); // roof ledge

	const doorL = (width >> 1) - 1;
	const doorR = width >> 1;

	for (let i = 0; i < bodyHeight; i++) {
		const lastTwo = i >= bodyHeight - 2;
		const aboveDoorZone = i < bodyHeight - 2;
		let r = "";
		for (let j = 0; j < width; j++) {
			let ch: string;
			if (j === 0) ch = edgeLight;
			else if (j === width - 1) ch = frame;
			else if (lastTwo && (j === doorL || j === doorR)) ch = "d";
			else if (j % 2 === 1 && (i % 4 === 1 || i % 4 === 2) && aboveDoorZone) ch = "w";
			else if (j % 2 === 1 && i % 4 === 3 && aboveDoorZone) ch = frame; // sill
			else if (streak && (i + j * 2) % 11 === 0) ch = streak;
			else ch = wall;
			r += ch;
		}
		rows.push(r);
	}

	rows.push(frame.repeat(width)); // base
	return rows;
}
