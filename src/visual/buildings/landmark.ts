import { defineSprite } from "./types";
import { glassAt } from "./tower";

/**
 * Tahap 6: menara bertingkat mengecil. 16x87 (tier table unchanged).
 * Needle with beacon, lit ledge + shadow lip per setback, curtain-wall tiers
 * with a continuous diagonal reflection, grand glass lobby.
 */
function makeLandmarkRows(): string[] {
	const W = 16;
	const rows: string[] = [];

	const pushCentered = (inner: string) => {
		const pad = Math.floor((W - inner.length) / 2);
		const line = ".".repeat(pad) + inner + ".".repeat(W - pad - inner.length);
		if (line.length !== W) throw new Error(`Landmark row width ${line.length}, expected ${W}`);
		rows.push(line);
	};

	// Needle / spire (solid width <= 3 so construction can detect it)
	pushCentered("A");
	for (let i = 0; i < 4; i++) pushCentered(i % 2 === 0 ? "M" : "N");
	pushCentered("lMN");
	pushCentered("lmN");

	const tiers: Array<{ width: number; height: number }> = [
		{ width: 4, height: 8 },
		{ width: 6, height: 10 },
		{ width: 8, height: 12 },
		{ width: 10, height: 12 },
		{ width: 12, height: 14 },
		{ width: 14, height: 10 },
	];

	for (const tier of tiers) {
		const w = tier.width;
		pushCentered("L" + "l".repeat(w - 2) + "N"); // lit setback ledge
		const pad = Math.floor((W - w) / 2);
		for (let i = 0; i < tier.height; i++) {
			const gRow = rows.length;
			const shadowLip = i === 0;
			const spandrel = i % 3 === 2;
			let body = "";
			for (let j = 0; j < w; j++) {
				let ch: string;
				if (j === 0) ch = "l";
				else if (j === w - 1) ch = "N";
				else if (j === w - 2 && w >= 6) ch = "M";
				else if (shadowLip) ch = "M";
				else if (j % 2 === 1 && !spandrel) ch = "w";
				else if (j % 2 === 1 && spandrel) ch = "M";
				else ch = glassAt(gRow, pad + j, 19);
				body += ch;
			}
			pushCentered(body);
		}
	}

	// Grand lobby
	pushCentered("L" + "l".repeat(14) + "N");
	for (let i = 0; i < 6; i++) {
		const gRow = rows.length;
		let body = "";
		for (let j = 0; j < 16; j++) {
			const doorZone = i >= 3;
			let ch: string;
			if (j === 0) ch = "l";
			else if (j === 15) ch = "N";
			else if (j === 14) ch = "M";
			else if (doorZone && (j === 7 || j === 8)) ch = "d";
			else if (doorZone && (j === 6 || j === 9)) ch = "D";
			else if (i === 2) ch = "a";
			else if (j % 2 === 1) ch = "w";
			else ch = doorZone ? "a" : glassAt(gRow, j, 19);
			body += ch;
		}
		pushCentered(body);
	}
	pushCentered("NNNNNNNddNNNNNNN");

	return rows;
}

/** Tahap 6: landmark 200+ commits. */
export const landmark = defineSprite({
	id: "landmark",
	name: "Menara landmark",
	rows: makeLandmarkRows(),
});
