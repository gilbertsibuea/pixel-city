import { defineSprite } from "./types";

/**
 * Tahap 1: gubuk jerami. 12x8.
 * Thatch strands (j/r/R) with a shaggy fringe, wood posts, shuttered window.
 */
export const hut = defineSprite({
	id: "hut",
	name: "Gubuk",
	rows: [
		"....jjjR....",
		"..jjrjrrRR..",
		".jjrrjrRrRR.",
		"jjrRrrjrRrRJ",
		"JRJJRJJRJJRJ",
		".ikDwwDkDDI.",
		".ikkWWkkddI.",
		".IIIIIIIddI.",
	],
});
