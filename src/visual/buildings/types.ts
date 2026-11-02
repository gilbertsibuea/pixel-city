/**
 * Sprite grid legend (one character = one pixel):
 *   '.'  transparent
 *   'w'  window  -> rendered as individual <rect class="win|win on"> (lit by commit activity)
 *   'A'  beacon  -> rendered as <rect class="blink"> (antenna light)
 *   'd'  door    -> entrance (pedestrians walk toward this)
 *   any other key of PALETTE -> solid color
 */
export type BuildingId =
	| "hut"
	| "wood-house"
	| "stone-shop"
	| "midrise"
	| "skyscraper"
	| "landmark";

export interface BuildingSprite {
	id: BuildingId;
	/** Display name (Bahasa Indonesia), used in legends and aria labels. */
	name: string;
	rows: string[];
	width: number;
	height: number;
	/** Chimney smoke: x offset (in pixels) from the sprite's left edge. */
	smokeX?: number;
	/** Rooftop flag that waves. */
	flag?: boolean;
	/** Door center column (pixel grid), used for pedestrian enter animations. */
	doorX: number;
}

function detectDoorX(rows: string[]): number | undefined {
	for (let r = rows.length - 1; r >= 0; r--) {
		const row = rows[r]!;
		const start = row.indexOf("d");
		if (start < 0) continue;
		let end = start;
		while (end < row.length && row[end] === "d") end++;
		return (start + end - 1) / 2;
	}
	return undefined;
}

/** Builds a sprite and verifies that every row has the same width. */
export function defineSprite(
	s: Omit<BuildingSprite, "width" | "height" | "doorX"> & { doorX?: number },
): BuildingSprite {
	const width = s.rows[0]!.length;
	s.rows.forEach((r, i) => {
		if (r.length !== width) {
			throw new Error(`Sprite "${s.id}" row ${i} has width ${r.length}, expected ${width}`);
		}
	});
	const doorX = s.doorX ?? detectDoorX(s.rows) ?? width / 2;
	return { ...s, width, height: s.rows.length, doorX };
}
