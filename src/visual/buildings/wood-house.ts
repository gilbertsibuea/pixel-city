import { defineSprite } from "./types";

/**
 * Tahap 2: rumah kayu dengan cerobong berasap. 14x9.
 * Staggered roof tiles, deep eave line, framed door and white window sills.
 */
export const woodHouse = defineSprite({
	id: "wood-house",
	name: "Rumah kayu",
	rows: [
		".....uo...UU..",
		"....uuoOoooU..",
		"..uuoOoooOooO.",
		".uuoooOoooOoOO",
		"UUUUUUUUUUUUUU",
		".iwwKKKKKKwwI.",
		".iwwkDddDkwwI.",
		".iWWkDddDkWWI.",
		".IIIIDddDIIII.",
	],
	smokeX: 10,
});
