import { writeFileSync } from "node:fs";
import {
	BUILDING_BY_ID,
	BUILDERS_PER_TARGET,
	CONSTRUCTION_TARGETS,
	PALETTE,
	makeConstruction,
	planBuilders,
} from "../src/visual/index.ts";

const SCALE = 8;
const cells = [];
for (const id of CONSTRUCTION_TARGETS) {
	const finished = BUILDING_BY_ID[id];
	const variants = [
		{ label: "finished", rows: finished.rows as string[], builders: [] as unknown[], hook: null },
		...( [0, 1, 2] as const).map((phase) => {
			const meta = makeConstruction(finished, phase);
			const groundY = meta.height * SCALE;
			const builders = planBuilders({
				target: id,
				seed: `preview/${id}/${phase}`,
				originX: 0,
				groundY,
				spriteWidthPx: meta.width * SCALE,
				scale: SCALE,
				scaffoldRows: meta.scaffoldRows,
				spriteTopY: 0,
			});
			return {
				label: `phase-${phase}`,
				rows: meta.rows,
				builders,
				hook: meta.craneHook ?? null,
			};
		}),
	];
	cells.push({ id, width: finished.width, variants });
}

const out = process.argv[2] ?? "public/construction-dump.json";
writeFileSync(
	out,
	JSON.stringify({ palette: PALETTE, scale: SCALE, cells, buildersPer: BUILDERS_PER_TARGET }),
);
console.log("wrote", out);
