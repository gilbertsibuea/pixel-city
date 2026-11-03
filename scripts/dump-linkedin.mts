import { writeFileSync } from "node:fs";
import {
	BUILDING_BY_ID,
	BUILDINGS,
	CONSTRUCTION_TARGETS,
	PALETTE,
	makeConstruction,
	planBuilders,
	type BuildingId,
} from "../src/visual/index.ts";

const S = 5;
const NAMES: Record<BuildingId, { en: string; id: string; range: string }> = {
	hut: { en: "Hut", id: "Gubuk", range: "1–19" },
	"wood-house": { en: "House", id: "Rumah kayu", range: "20–40" },
	"stone-shop": { en: "Shop", id: "Toko batu", range: "41–50" },
	midrise: { en: "Mid-rise", id: "Gedung", range: "51–99" },
	skyscraper: { en: "Skyscraper", id: "Pencakar langit", range: "100–199" },
	landmark: { en: "Landmark", id: "Menara landmark", range: "200+" },
};

const rows = BUILDINGS.map((b) => {
	const id = b.id as BuildingId;
	const finished = BUILDING_BY_ID[id];
	const canBuild = (CONSTRUCTION_TARGETS as readonly string[]).includes(id);
	const variants = canBuild
		? ([null, 0, 1, 2] as const).map((phase) => {
				if (phase === null) {
					return { kind: "finished", rows: finished.rows, builders: [], hook: null };
				}
				const meta = makeConstruction(finished, phase);
				const builders = planBuilders({
					target: id,
					seed: `linkedin-png/${id}/${phase}`,
					originX: 0,
					groundY: meta.height * S,
					spriteWidthPx: meta.width * S,
					scale: S,
					scaffoldRows: meta.scaffoldRows,
					spriteTopY: 0,
				});
				return {
					kind: `phase-${phase}`,
					rows: meta.rows,
					builders,
					hook: meta.craneHook ?? null,
				};
			})
		: [
				{ kind: "finished", rows: finished.rows, builders: [], hook: null },
				{ kind: "empty", rows: [], builders: [], hook: null },
				{ kind: "empty", rows: [], builders: [], hook: null },
				{ kind: "empty", rows: [], builders: [], hook: null },
			];
	return { id, name: NAMES[id], variants };
});

const out = process.argv[2] ?? "public/linkedin-dump.json";
writeFileSync(out, JSON.stringify({ palette: PALETTE, scale: S, rows, colLabels: ["Finished", "Build · 70%", "Build · 80%", "Build · 90%"] }));
console.log("wrote", out);
