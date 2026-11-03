import { defineSprite } from "./types";

/**
 * Tahap 3: toko batu dengan kanopi. 16x10.
 * Tiled roof, stone courses with mortar flecks, striped awning,
 * display window, framed door and a planter.
 */
export const stoneShop = defineSprite({
	id: "stone-shop",
	name: "Toko batu",
	rows: [
		"..uuooOoooOooO..",
		".uooOoooOoooOoU.",
		".sssssssssssssS.",
		".swwtttwwtttwwS.",
		".swwtTtwwtTtwwS.",
		".sWWtTtWWtTtWWS.",
		".uWoWoWoWoWoWoU.",
		".sBwwwBBDddDBBS.",
		".stwwwttDddDvpS.",
		".SSWWWSSDddDSSS.",
	],
});
