import { defineSprite } from "./types";
import { assertRow, repeatRows } from "./tower";

/**
 * Tahap 4: gedung bertingkat beton. 14x28.
 * Parapet + cornice, five office floors (window pairs, white sills, slab band),
 * lobby with canopy, framed entrance and planters.
 */
function makeMidriseRows(): string[] {
	const W = 14;
	const floor = [
		"hcwwccwwccwwCG",
		"hcwwccwwccwwCG",
		"hcWWccWWccWWCG",
		"hCCCCCCCCCCCCG",
	];
	const rows = [
		"hhhhhhhhhhhhhG",
		"hCCCCCCCCCCCGG",
		...repeatRows(floor, 20),
		"GGGGGGGGGGGGGG",
		"hcwwwDddDwwwCG",
		"hcwwwDddDwwwCG",
		"hcWWWDddDWWWCG",
		"hvpcCDddDcvpCG",
		"GGGGGDddDGGGGG",
	];
	return rows.map((r) => assertRow("midrise", r, W));
}

export const midrise = defineSprite({
	id: "midrise",
	name: "Gedung bertingkat",
	rows: makeMidriseRows(),
	flag: true,
});
