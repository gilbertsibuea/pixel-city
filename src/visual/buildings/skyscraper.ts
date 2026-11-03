import { defineSprite } from "./types";
import { assertRow, glassAt } from "./tower";

/**
 * Tahap 5: pencakar langit kaca. 12x46.
 * Antenna with beacon, stepped crown, curtain wall (window bands + spandrels)
 * with a diagonal sky reflection, glass lobby at street level.
 */
function makeSkyscraperRows(): string[] {
	const W = 12;
	const BODY = 34;
	const rows = [
		"......A.....",
		"......M.....",
		"......M.....",
		".....lMN....",
		"...LlmmmN...",
		".LlllmmmmmN.",
		"LlllllmmmmMN",
	];
	for (let i = 0; i < BODY; i++) {
		const spandrel = i % 3 === 2;
		let r = "";
		for (let j = 0; j < W; j++) {
			if (j === 0) r += "l";
			else if (j === W - 1) r += "N";
			else if (j === W - 2) r += "M";
			else if (spandrel) r += glassAt(i, j) === "m" ? "M" : "m";
			else if (j % 3 !== 0) r += "w";
			else r += glassAt(i, j);
		}
		rows.push(r);
	}
	rows.push(
		"NNNNNNNNNNNN",
		"lawwDddDwwMN",
		"lawwDddDwwMN",
		"laaaDddDaaMN",
		"NNNNDddDNNNN",
	);
	return rows.map((r) => assertRow("skyscraper", r, W));
}

export const skyscraper = defineSprite({
	id: "skyscraper",
	name: "Pencakar langit",
	rows: makeSkyscraperRows(),
});
