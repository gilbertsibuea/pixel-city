import { defineSprite } from "./types";

/**
 * Tahap 6: menara bertingkat mengecil. 16x87 (unchanged size and tier table).
 * Retouch: lit ledge per tier, sunlit left edge, sills under windows,
 * subtle glass streaks, lit mast pixel.
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

	// Needle / spire
	pushCentered("A");
	for (let i = 0; i < 4; i++) pushCentered("M");
	pushCentered("lMM");
	pushCentered("lmM");

	const tiers: Array<{ width: number; height: number }> = [
		{ width: 4, height: 8 },
		{ width: 6, height: 10 },
		{ width: 8, height: 12 },
		{ width: 10, height: 12 },
		{ width: 12, height: 14 },
		{ width: 14, height: 10 },
	];

	for (const tier of tiers) {
		pushCentered("l".repeat(tier.width - 1) + "M"); // lit ledge
		for (let i = 0; i < tier.height; i++) {
			let body = "";
			for (let j = 0; j < tier.width; j++) {
				let ch: string;
				if (j === 0) ch = "l";
				else if (j === tier.width - 1) ch = "M";
				else if (j % 2 === 1 && i % 3 !== 2) ch = "w";
				else if (j % 2 === 1 && i % 3 === 2) ch = "M"; // sill
				else if ((i + j * 2) % 11 === 0 && tier.width >= 8) ch = "l"; // glass streak
				else ch = "m";
				body += ch;
			}
			pushCentered(body);
		}
	}

	// Broad base with entrance
	pushCentered("l".repeat(15) + "M");
	for (let i = 0; i < 6; i++) {
		let body = "";
		for (let j = 0; j < 16; j++) {
			const door = i >= 4 && (j === 7 || j === 8);
			let ch: string;
			if (door) ch = "d";
			else if (j === 0) ch = "l";
			else if (j === 15) ch = "M";
			else if (j % 2 === 1 && i < 4) ch = "w";
			else ch = "m";
			body += ch;
		}
		pushCentered(body);
	}
	pushCentered("M".repeat(16));

	return rows;
}

/** Tahap 6: landmark 200+ commits. */
export const landmark = defineSprite({
	id: "landmark",
	name: "Menara landmark",
	rows: makeLandmarkRows(),
});
