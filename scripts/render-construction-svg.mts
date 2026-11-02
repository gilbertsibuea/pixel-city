import { writeFileSync } from "node:fs";
import {
	BUILDING_BY_ID,
	CONSTRUCTION_TARGETS,
	PALETTE,
	builderAnimationsCss,
	makeConstruction,
	planBuilders,
	renderBuilder,
	renderCraneHook,
} from "../src/visual/index.ts";

const S = 8;
const GAP = 16;
const LABEL = 14;

let maxCellW = 0;
let maxCellH = 0;
const grid = CONSTRUCTION_TARGETS.map((id) => {
	const finished = BUILDING_BY_ID[id];
	const variants = ([null, 0, 1, 2] as const).map((phase) => {
		if (phase === null) return { label: "finished", rows: finished.rows, meta: null };
		const meta = makeConstruction(finished, phase);
		return { label: `phase ${phase}`, rows: meta.rows, meta };
	});
	for (const v of variants) {
		maxCellW = Math.max(maxCellW, v.rows[0]!.length * S);
		maxCellH = Math.max(maxCellH, v.rows.length * S);
	}
	return { id, variants };
});

const cellW = maxCellW + GAP;
const cellH = maxCellH + LABEL + GAP;
const W = GAP + 4 * cellW;
const H = GAP + grid.length * cellH;

function drawRows(rows: string[], ox: number, oy: number): string {
	let out = "";
	rows.forEach((row, r) => {
		[...row].forEach((ch, c) => {
			if (ch === ".") return;
			const fill = ch === "A" ? "#ffd84a" : PALETTE[ch];
			if (!fill) return;
			out += `<rect x="${ox + c * S}" y="${oy + r * S}" width="${S}" height="${S}" fill="${fill}"/>`;
		});
	});
	return out;
}

let body = "";
grid.forEach((cell, ri) => {
	cell.variants.forEach((v, ci) => {
		const ox = GAP + ci * cellW;
		const oy = GAP + ri * cellH + LABEL;
		body += `<text x="${ox}" y="${oy - 4}" fill="#e8eef6" font-size="11">${cell.id} · ${v.label}</text>`;
		body += drawRows(v.rows, ox, oy);
		if (v.meta?.craneHook) {
			body += renderCraneHook(ox, oy, v.meta.craneHook.col, v.meta.craneHook.row, S);
		}
		if (v.meta) {
			const builders = planBuilders({
				target: cell.id,
				seed: `sheet/${cell.id}/${v.label}`,
				originX: ox,
				groundY: oy + v.rows.length * S,
				spriteWidthPx: v.rows[0]!.length * S,
				scale: S,
				scaffoldRows: v.meta.scaffoldRows,
				spriteTopY: oy,
			});
			for (const b of builders) body += renderBuilder(b);
		}
	});
});

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}${builderAnimationsCss()}</style>
<rect width="100%" height="100%" fill="#121821"/>
${body}
</svg>
`;

writeFileSync("public/construction-sheet.svg", svg);
console.log("wrote public/construction-sheet.svg", W, H);
