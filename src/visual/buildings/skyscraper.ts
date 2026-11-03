import { defineSprite } from "./types";
import { makeTowerRows } from "./tower";

/** Tahap 5: pencakar langit kaca. 12x46 (unchanged size). */
export const skyscraper = defineSprite({
	id: "skyscraper",
	name: "Pencakar langit",
	rows: makeTowerRows(12, 40, "m", "M", true, { edgeLight: "l", streak: "l" }),
});
