import type { ConstructionPhase } from "../core/config";
import type { BuildingId, BuildingSprite } from "./buildings/types";
import { BUILDING_BY_ID } from "./buildings/index";

/** Built facade height as percent of finished sprite (phase 0/1/2). */
const BUILT_PCT: readonly [number, number, number] = [35, 60, 85];

/** Max crane mast rows stacked above the finished silhouette. */
export const MAX_CRANE_MAST = 6;

export interface ConstructionMeta {
	rows: string[];
	width: number;
	height: number;
	doorX: number;
	/** Hook hangs from this cell (in construction row coords). */
	craneHook?: { col: number; row: number };
	/** Row indices that have scaffold planks (for builders). */
	scaffoldRows: number[];
	/** Extra rows prepended for the crane (0..MAX_CRANE_MAST). */
	craneRows: number;
}

function builtHeight(h: number, phase: ConstructionPhase): number {
	return Math.max(1, Math.round((h * BUILT_PCT[phase]) / 100));
}

function cloneRows(rows: readonly string[]): string[] {
	return rows.map((r) => r);
}

function setCell(rows: string[], r: number, c: number, ch: string): void {
	const row = rows[r]!;
	if (c < 0 || c >= row.length) return;
	rows[r] = row.slice(0, c) + ch + row.slice(c + 1);
}

function cell(rows: readonly string[], r: number, c: number): string {
	if (r < 0 || r >= rows.length) return ".";
	return rows[r]![c] ?? ".";
}

/** Leftmost / rightmost solid column in a row (or -1). */
function solidBounds(row: string): { left: number; right: number } | null {
	let left = -1;
	let right = -1;
	for (let i = 0; i < row.length; i++) {
		if (row[i] !== ".") {
			if (left < 0) left = i;
			right = i;
		}
	}
	if (left < 0) return null;
	return { left, right };
}

function isRoofChar(ch: string): boolean {
	return ch === "r" || ch === "R" || ch === "o" || ch === "O" || ch === "u" || ch === "U";
}

function isAwningRow(row: string): boolean {
	let o = 0;
	for (const ch of row) if (ch === "o" || ch === "O") o++;
	return o >= row.length / 3;
}

/** Skeleton inside silhouette: posts + beams. */
function fillSkeleton(
	out: string[],
	finished: readonly string[],
	fromRow: number,
	toRow: number,
	beamEvery: number,
	postChar: string,
	beamChar: string,
): void {
	const w = finished[0]!.length;
	for (let r = fromRow; r < toRow; r++) {
		const src = finished[r]!;
		const bounds = solidBounds(src);
		if (!bounds) {
			out[r] = ".".repeat(w);
			continue;
		}
		const { left, right } = bounds;
		const isBeam = (r - fromRow) % beamEvery === 0;
		let line = "";
		for (let c = 0; c < w; c++) {
			if (src[c] === ".") {
				line += ".";
				continue;
			}
			const isPost = c === left || c === right || (c - left) % 3 === 0;
			if (isPost) line += postChar;
			else if (isBeam) line += beamChar;
			else line += ".";
		}
		out[r] = line;
	}
}

/** Copy finished facade into built band; windows stay as `w` (unlit when litRatio=0). */
function fillBuilt(
	out: string[],
	finished: readonly string[],
	fromRow: number,
	toRow: number,
	opts: { dropBeacon?: boolean; dropRoof?: boolean; dropAwning?: boolean } = {},
): void {
	for (let r = fromRow; r < toRow; r++) {
		const src = finished[r]!;
		if (opts.dropAwning && isAwningRow(src)) {
			out[r] = src.replace(/[oOuUW]/g, ".");
			continue;
		}
		let line = "";
		for (let c = 0; c < src.length; c++) {
			const ch = src[c]!;
			if (ch === ".") {
				line += ".";
				continue;
			}
			if (opts.dropBeacon && ch === "A") {
				line += "M";
				continue;
			}
			if (opts.dropRoof && isRoofChar(ch)) {
				line += ".";
				continue;
			}
			line += ch;
		}
		out[r] = line;
	}
}

/**
 * Scaffold poles + plank runs over the built band.
 * Planks only mark a thin board row (do not erase windows/doors wholesale);
 * poles sit on the outer columns.
 */
function applyScaffold(out: string[], fromRow: number, toRow: number): number[] {
	const w = out[0]!.length;
	const plankRows: number[] = [];
	const poleCols = [Math.max(0, 1), Math.max(1, w - 2)];

	for (let r = fromRow; r < toRow; r++) {
		const bounds = solidBounds(out[r]!);
		if (!bounds) continue;
		const isPlank = (r - fromRow) % 5 === 3;
		if (isPlank) {
			plankRows.push(r);
			for (let c = bounds.left; c <= bounds.right; c++) {
				const ch = out[r]![c]!;
				// Keep doors/windows readable; plank only on solid wall cells.
				if (ch === "." || ch === "w" || ch === "d" || ch === "A") continue;
				setCell(out, r, c, "P");
			}
		}
		for (const pc of poleCols) {
			if (pc < bounds.left || pc > bounds.right) continue;
			const ch = cell(out, r, pc);
			if (ch === "." || ch === "w" || ch === "d") continue;
			setCell(out, r, pc, "P");
		}
	}
	return plankRows;
}

interface CraneSpec {
	mastRows: number;
	jibLen: number;
	beacon: boolean;
	/** Column of mast inside building width. */
	mastCol: number;
}

function craneFor(id: BuildingId, width: number, phase: ConstructionPhase): CraneSpec | null {
	if (id === "wood-house" || id === "stone-shop" || id === "hut") return null;
	const mastCol = Math.min(width - 2, Math.max(2, width - 3));
	if (id === "midrise") {
		return { mastRows: 3 + phase, jibLen: 3 + phase, beacon: false, mastCol };
	}
	if (id === "skyscraper") {
		return { mastRows: 4 + Math.min(phase, 2), jibLen: 4 + phase, beacon: true, mastCol };
	}
	// landmark
	return { mastRows: MAX_CRANE_MAST, jibLen: 5, beacon: true, mastCol: Math.min(width - 1, width - 2) };
}

function prependCrane(
	body: string[],
	spec: CraneSpec,
): { rows: string[]; hook: { col: number; row: number }; craneRows: number } {
	const w = body[0]!.length;
	const mast = Math.min(MAX_CRANE_MAST, spec.mastRows);
	const pad: string[] = [];
	const mastCol = Math.min(w - 1, Math.max(0, spec.mastCol));

	for (let i = 0; i < mast; i++) {
		const cells = Array.from({ length: w }, () => ".");
		if (i === 0 && spec.beacon) {
			cells[mastCol] = "A";
		} else {
			cells[mastCol] = "X";
		}
		// Jib near the top of the mast
		if (i === 1) {
			const dir = mastCol > w / 2 ? -1 : 1;
			for (let j = 1; j <= spec.jibLen; j++) {
				const c = mastCol + dir * j;
				if (c < 0 || c >= w) break;
				cells[c] = "Q";
			}
		}
		pad.push(cells.join(""));
	}

	const jibRow = 1;
	const dir = mastCol > w / 2 ? -1 : 1;
	const hookCol = Math.max(0, Math.min(w - 1, mastCol + dir * Math.max(1, Math.floor(spec.jibLen / 2))));
	return {
		rows: [...pad, ...body],
		hook: { col: hookCol, row: jibRow },
		craneRows: pad.length,
	};
}

function genericConstruction(finished: BuildingSprite, phase: ConstructionPhase): ConstructionMeta {
	const h = finished.height;
	const w = finished.width;
	const builtH = builtHeight(h, phase);
	const builtFrom = h - builtH;
	const out = cloneRows(finished.rows);

	fillSkeleton(out, finished.rows, 0, builtFrom, 4, "Q", "Q");
	fillBuilt(out, finished.rows, builtFrom, h, { dropBeacon: true });
	const scaffoldRows = applyScaffold(out, builtFrom, h);

	const crane = craneFor(finished.id, w, phase);
	if (!crane) {
		return {
			rows: out,
			width: w,
			height: h,
			doorX: finished.doorX,
			scaffoldRows,
			craneRows: 0,
		};
	}
	const withCrane = prependCrane(out, crane);
	const shiftedScaffold = scaffoldRows.map((r) => r + withCrane.craneRows);
	return {
		rows: withCrane.rows,
		width: w,
		height: withCrane.rows.length,
		doorX: finished.doorX,
		craneHook: withCrane.hook,
		scaffoldRows: shiftedScaffold,
		craneRows: withCrane.craneRows,
	};
}

/** Timber frame house: rafters early, roof tiles only in phase 2. */
function woodHouseConstruction(finished: BuildingSprite, phase: ConstructionPhase): ConstructionMeta {
	const h = finished.height;
	const w = finished.width;
	const builtH = builtHeight(h, phase);
	const builtFrom = h - builtH;
	const out = Array.from({ length: h }, () => ".".repeat(w));

	// Unbuilt: timber posts + open rafters
	fillSkeleton(out, finished.rows, 0, builtFrom, 3, "k", "K");
	for (let r = 0; r < Math.min(builtFrom, 4); r++) {
		const bounds = solidBounds(finished.rows[r]!);
		if (!bounds) continue;
		// Rafter slopes
		setCell(out, r, bounds.left + r, "k");
		setCell(out, r, bounds.right - r, "k");
	}

	// Phase 2 includes the finished roof; earlier phases keep timber rafters only.
	if (phase === 2) {
		let roofH = builtH;
		for (let r = 0; r < h; r++) {
			if (finished.rows[r]!.split("").some(isRoofChar)) roofH = Math.max(roofH, h - r);
		}
		const roofFrom = h - roofH;
		fillBuilt(out, finished.rows, roofFrom, h, {});
	} else {
		fillBuilt(out, finished.rows, builtFrom, h, { dropRoof: true });
		for (let r = 0; r < h; r++) {
			if (!finished.rows[r]!.split("").some(isRoofChar)) continue;
			const bounds = solidBounds(finished.rows[r]!);
			if (!bounds) continue;
			const arr = Array.from({ length: w }, () => ".");
			arr[bounds.left] = "k";
			arr[bounds.right] = "k";
			if (phase >= 1) {
				for (let c = bounds.left; c <= bounds.right; c++) arr[c] = c % 2 === 0 ? "k" : ".";
			}
			out[r] = arr.join("");
		}
	}

	const scaffoldRows = applyScaffold(out, builtFrom, h);
	return {
		rows: out,
		width: w,
		height: h,
		doorX: finished.doorX,
		scaffoldRows,
		craneRows: 0,
	};
}

/** Stone courses bottom-up; awning/roof only in phase 2. */
function stoneShopConstruction(finished: BuildingSprite, phase: ConstructionPhase): ConstructionMeta {
	const h = finished.height;
	const w = finished.width;
	let builtH = builtHeight(h, phase);
	// Phase 2: force roof + awning rows into the built band.
	if (phase === 2) {
		for (let r = 0; r < h; r++) {
			const row = finished.rows[r]!;
			if (isAwningRow(row) || row.split("").some(isRoofChar)) {
				builtH = Math.max(builtH, h - r);
			}
		}
	}
	const builtFrom = h - builtH;
	const out = Array.from({ length: h }, () => ".".repeat(w));

	fillSkeleton(out, finished.rows, 0, builtFrom, 5, "T", "t");
	fillBuilt(out, finished.rows, builtFrom, h, { dropAwning: phase < 2, dropRoof: phase < 2 });

	// Emphasize horizontal stone courses on built band
	for (let r = builtFrom; r < h; r++) {
		if ((h - 1 - r) % 2 === 1) {
			const src = out[r]!;
			let line = "";
			for (let c = 0; c < w; c++) {
				const ch = src[c]!;
				if (ch === "t") line += "T";
				else line += ch;
			}
			out[r] = line;
		}
	}

	const scaffoldRows = applyScaffold(out, builtFrom, h);
	return {
		rows: out,
		width: w,
		height: h,
		doorX: finished.doorX,
		scaffoldRows,
		craneRows: 0,
	};
}

/** Concrete slabs + rebar stubs on the top of the built band. */
function midriseConstruction(finished: BuildingSprite, phase: ConstructionPhase): ConstructionMeta {
	const base = genericConstruction(finished, phase);
	const bodyStart = base.craneRows;
	const hBody = finished.height;
	const builtH = builtHeight(hBody, phase);
	const builtFrom = bodyStart + (hBody - builtH);
	const topBuilt = builtFrom;
	const w = base.width;

	// Floor slab line + rebar stubs (Q) just above built band
	if (topBuilt - 1 >= bodyStart) {
		const r = topBuilt - 1;
		const bounds = solidBounds(finished.rows[topBuilt - bodyStart]!) ?? solidBounds(base.rows[r]!);
		if (bounds) {
			for (let c = bounds.left; c <= bounds.right; c++) {
				setCell(base.rows, r, c, "c");
			}
			for (let c = bounds.left + 1; c < bounds.right; c += 2) {
				if (r - 1 >= bodyStart) setCell(base.rows, r - 1, c, "Q");
			}
		}
	}

	// Clear glass above built; keep steel posts
	for (let r = bodyStart; r < builtFrom; r++) {
		const src = finished.rows[r - bodyStart]!;
		const bounds = solidBounds(src);
		if (!bounds) continue;
		let line = ".".repeat(w).split("");
		for (let c = 0; c < w; c++) {
			if (src[c] === ".") continue;
			if (c === bounds.left || c === bounds.right || (c - bounds.left) % 3 === 0) line[c] = "C";
			else if ((r - bodyStart) % 5 === 0) line[c] = "c";
		}
		base.rows[r] = line.join("");
	}

	return base;
}

/** Steel frame above, glazed floors below, taller crane with beacon. */
function skyscraperConstruction(finished: BuildingSprite, phase: ConstructionPhase): ConstructionMeta {
	const base = genericConstruction(finished, phase);
	const bodyStart = base.craneRows;
	const hBody = finished.height;
	const builtH = builtHeight(hBody, phase);
	const builtFrom = bodyStart + (hBody - builtH);
	const w = base.width;

	for (let r = bodyStart; r < builtFrom; r++) {
		const src = finished.rows[r - bodyStart]!;
		const bounds = solidBounds(src);
		if (!bounds) continue;
		let line = ".".repeat(w).split("");
		for (let c = 0; c < w; c++) {
			if (src[c] === ".") continue;
			const edge = c === bounds.left || c === bounds.right;
			const post = edge || (c - bounds.left) % 2 === 0;
			if (post) line[c] = "Q";
			else if ((r - bodyStart) % 4 === 0) line[c] = "M";
		}
		base.rows[r] = line.join("");
	}

	// Built band keeps glazed look from finished (m/M/w)
	return base;
}

/** Lower tiers complete; upper steel core; short spire only in phase 2. */
function landmarkConstruction(finished: BuildingSprite, phase: ConstructionPhase): ConstructionMeta {
	const h = finished.height;
	const w = finished.width;
	const builtH = builtHeight(h, phase);
	const builtFrom = h - builtH;
	const out = cloneRows(finished.rows);

	// Detect spire: rows where solid width <= 3
	const spireUntil = (() => {
		let n = 0;
		for (let r = 0; r < h; r++) {
			const b = solidBounds(finished.rows[r]!);
			if (!b) {
				n++;
				continue;
			}
			if (b.right - b.left <= 2) n++;
			else break;
		}
		return n;
	})();

	fillSkeleton(out, finished.rows, 0, builtFrom, 5, "Q", "Q");
	fillBuilt(out, finished.rows, builtFrom, h, { dropBeacon: true });

	// Strip / shorten spire
	for (let r = 0; r < spireUntil; r++) {
		if (phase < 2) {
			out[r] = ".".repeat(w);
		} else if (r < spireUntil - 2) {
			// shorter needle: keep only last 2–3 spire rows as steel
			out[r] = ".".repeat(w);
		} else {
			const mid = Math.floor(w / 2);
			const cells = Array.from({ length: w }, () => ".");
			cells[mid] = r === spireUntil - 1 ? "A" : "Q";
			out[r] = cells.join("");
		}
	}

	// Upper unbuilt: steel core only (center 4 cols)
	for (let r = spireUntil; r < builtFrom; r++) {
		const b = solidBounds(finished.rows[r]!);
		if (!b) {
			out[r] = ".".repeat(w);
			continue;
		}
		const coreL = Math.max(b.left, Math.floor(w / 2) - 2);
		const coreR = Math.min(b.right, Math.floor(w / 2) + 1);
		let line = ".".repeat(w).split("");
		for (let c = coreL; c <= coreR; c++) {
			line[c] = c === coreL || c === coreR || (r - spireUntil) % 4 === 0 ? "Q" : "M";
		}
		out[r] = line.join("");
	}

	const scaffoldRows = applyScaffold(out, builtFrom, h);
	const crane = craneFor("landmark", w, phase)!;
	const withCrane = prependCrane(out, crane);
	return {
		rows: withCrane.rows,
		width: w,
		height: withCrane.rows.length,
		doorX: finished.doorX,
		craneHook: withCrane.hook,
		scaffoldRows: scaffoldRows.map((r) => r + withCrane.craneRows),
		craneRows: withCrane.craneRows,
	};
}

/**
 * Build explicit construction grid rows for a finished sprite.
 * Width matches the finished sprite; height may grow by at most MAX_CRANE_MAST for a crane.
 */
export function makeConstructionRows(
	finished: BuildingSprite,
	phase: ConstructionPhase,
): string[] {
	return makeConstruction(finished, phase).rows;
}

export function makeConstruction(
	finished: BuildingSprite,
	phase: ConstructionPhase,
): ConstructionMeta {
	switch (finished.id) {
		case "wood-house":
			return woodHouseConstruction(finished, phase);
		case "stone-shop":
			return stoneShopConstruction(finished, phase);
		case "midrise":
			return midriseConstruction(finished, phase);
		case "skyscraper":
			return skyscraperConstruction(finished, phase);
		case "landmark":
			return landmarkConstruction(finished, phase);
		default:
			return genericConstruction(finished, phase);
	}
}

/** Construction visual for a target building id. */
export function constructionForTarget(
	target: BuildingId,
	phase: ConstructionPhase,
): ConstructionMeta {
	return makeConstruction(BUILDING_BY_ID[target], phase);
}

/** Targets that have under-construction variants (everything except hut). */
export const CONSTRUCTION_TARGETS: readonly BuildingId[] = [
	"wood-house",
	"stone-shop",
	"midrise",
	"skyscraper",
	"landmark",
];
