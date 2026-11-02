import { defineSprite } from "./types";

/**
 * Tahap 6: menara landmark bertingkat mengecil (spire + tapering tiers).
 * Fixed width grid; each tier is centered with transparent padding.
 */
function makeLandmarkRows(): string[] {
	const W = 16;
	const rows: string[] = [];

	const pushCentered = (inner: string) => {
		const pad = Math.floor((W - inner.length) / 2);
		const line = ".".repeat(pad) + inner + ".".repeat(W - pad - inner.length);
		if (line.length !== W) {
			throw new Error(`Landmark row width ${line.length}, expected ${W}`);
		}
		rows.push(line);
	};

	// Needle / spire
	pushCentered("A");
	pushCentered("M");
	pushCentered("M");
	pushCentered("M");
	pushCentered("M");
	pushCentered("MMM");
	pushCentered("MMM");

	// Upper tapering tiers (glass + frame)
	const tiers: Array<{ width: number; height: number }> = [
		{ width: 4, height: 8 },
		{ width: 6, height: 10 },
		{ width: 8, height: 12 },
		{ width: 10, height: 12 },
		{ width: 12, height: 14 },
		{ width: 14, height: 10 },
	];

	for (const tier of tiers) {
		pushCentered("M".repeat(tier.width)); // roof cap of tier
		for (let i = 0; i < tier.height; i++) {
			let body = "";
			for (let j = 0; j < tier.width; j++) {
				const edge = j === 0 || j === tier.width - 1;
				const windowCell = !edge && j % 2 === 1 && i % 3 !== 2;
				body += edge ? "M" : windowCell ? "w" : "m";
			}
			pushCentered(body);
		}
	}

	// Broad base with entrance
	pushCentered("M".repeat(16));
	for (let i = 0; i < 6; i++) {
		let body = "";
		for (let j = 0; j < 16; j++) {
			const edge = j === 0 || j === 15;
			const door = i >= 4 && (j === 7 || j === 8);
			const windowCell = !edge && !door && j % 2 === 1 && i < 4;
			body += door ? "d" : edge ? "M" : windowCell ? "w" : "m";
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
