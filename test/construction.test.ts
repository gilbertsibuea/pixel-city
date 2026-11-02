import { describe, expect, it } from "vitest";
import {
	BUILDING_STAGE_DEFS,
	constructionPhase,
	constructionStartCommit,
} from "../src/core/config";
import {
	BUILDING_BY_ID,
	BUILDINGS,
	CONSTRUCTION_TARGETS,
	makeConstructionRows,
} from "../src/visual";
import { defineSprite } from "../src/visual/buildings/types";

describe("constructionPhase boundaries", () => {
	it("matches expected first construction commits", () => {
		expect(constructionStartCommit(1, 20)).toBe(15);
		expect(constructionStartCommit(20, 41)).toBe(35);
		expect(constructionStartCommit(41, 51)).toBe(48);
		expect(constructionStartCommit(51, 100)).toBe(86);
		expect(constructionStartCommit(100, 200)).toBe(170);
	});

	it("hut → wood-house", () => {
		expect(constructionPhase(14)).toBeNull();
		expect(constructionPhase(15)).toEqual({ target: "wood-house", phase: 0 });
		expect(constructionPhase(19)?.target).toBe("wood-house");
		expect(constructionPhase(20)).toBeNull();
	});

	it("wood-house → stone-shop", () => {
		expect(constructionPhase(34)).toBeNull();
		expect(constructionPhase(35)).toEqual({ target: "stone-shop", phase: 0 });
	});

	it("stone-shop → midrise", () => {
		expect(constructionPhase(47)).toBeNull();
		expect(constructionPhase(48)).toEqual({ target: "midrise", phase: 0 });
	});

	it("midrise → skyscraper", () => {
		expect(constructionPhase(85)).toBeNull();
		expect(constructionPhase(86)).toEqual({ target: "skyscraper", phase: 0 });
	});

	it("skyscraper → landmark (burj)", () => {
		expect(constructionPhase(169)).toBeNull();
		expect(constructionPhase(170)).toEqual({ target: "landmark", phase: 0 });
		expect(constructionPhase(199)?.phase).toBe(2);
		expect(constructionPhase(200)).toBeNull();
	});

	it("landmark has no further construction", () => {
		expect(constructionPhase(500)).toBeNull();
	});

	it("phase bands use integer progress", () => {
		// hut span 19: phase0 [70,80), phase1 [80,90), phase2 [90,100)
		expect(constructionPhase(15)?.phase).toBe(0);
		expect(constructionPhase(17)?.phase).toBe(1);
		expect(constructionPhase(19)?.phase).toBe(2);
	});

	it("stage defs are the single source of thresholds", () => {
		expect(BUILDING_STAGE_DEFS.map((s) => [s.id, s.min])).toEqual([
			["hut", 1],
			["wood-house", 20],
			["stone-shop", 41],
			["midrise", 51],
			["skyscraper", 100],
			["landmark", 200],
		]);
	});
});

describe("construction sprites", () => {
	it("keeps equal row widths and finished width", () => {
		for (const id of CONSTRUCTION_TARGETS) {
			const finished = BUILDING_BY_ID[id];
			for (const phase of [0, 1, 2] as const) {
				const rows = makeConstructionRows(finished, phase);
				expect(rows.length).toBeGreaterThan(0);
				const width = rows[0]!.length;
				expect(width).toBe(finished.width);
				for (const row of rows) expect(row.length).toBe(width);
				// defineSprite-valid
				defineSprite({
					id,
					name: `${id}-c${phase}`,
					rows,
				});
				const craneExtra = rows.length - finished.height;
				expect(craneExtra).toBeGreaterThanOrEqual(0);
				expect(craneExtra).toBeLessThanOrEqual(6);
			}
		}
	});

	it("finished building sprites still have equal row widths", () => {
		for (const b of BUILDINGS) {
			for (const row of b.rows) expect(row.length).toBe(b.width);
		}
	});
});
