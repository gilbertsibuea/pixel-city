import { defineSprite } from "./types";

/** Tahap 2: rumah kayu dengan cerobong berasap. 14x9 (unchanged size). */
export const woodHouse = defineSprite({
	id: "wood-house",
	name: "Rumah kayu",
	rows: [
		".....uuoo.oO..",
		"...uuoooooOO..",
		".uuooooooooOO.",
		"oOOOOOOOOOOOOO",
		".ikkkkkkkkkkK.",
		".iwwkkkkkkwwK.",
		".iwwkkddkkwwK.",
		".ikkkkddkkkkK.",
		".KKKKKKKKKKKB.",
	],
	smokeX: 10,
});
