import { defineSprite } from "./types";
import { makeTowerRows } from "./tower";

/** Tahap 4: gedung bertingkat beton. 14x28 (unchanged size). */
export const midrise = defineSprite({
	id: "midrise",
	name: "Gedung bertingkat",
	rows: makeTowerRows(14, 26, "c", "C", false, { edgeLight: "h" }),
	flag: true,
});
