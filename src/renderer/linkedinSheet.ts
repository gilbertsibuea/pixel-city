import {
	BUILDING_BY_ID,
	BUILDINGS,
	CONSTRUCTION_TARGETS,
	PALETTE,
	builderAnimationsCss,
	makeConstruction,
	planBuilders,
	renderBuilder,
	renderCraneHook,
	type BuildingId,
	type ConstructionMeta,
} from "../visual";

export type LinkedInTheme = "light" | "dark";

const S = 5;
const COLS = 4;
const PAD = 32;
const GAP_X = 18;
const GAP_Y = 20;
const LABEL_H = 14;
const ROW_TITLE_W = 158;
const HEADER_H = 78;
const FOOTER_H = 40;
const PANEL_PAD_X = 10;
const PANEL_PAD_BOTTOM = 12;

const NAMES: Record<BuildingId, { en: string; id: string; range: string }> = {
	hut: { en: "Hut", id: "Gubuk", range: "1–19" },
	"wood-house": { en: "House", id: "Rumah kayu", range: "20–40" },
	"stone-shop": { en: "Shop", id: "Toko batu", range: "41–50" },
	midrise: { en: "Mid-rise", id: "Gedung", range: "51–99" },
	skyscraper: { en: "Skyscraper", id: "Pencakar langit", range: "100–199" },
	landmark: { en: "Landmark", id: "Menara landmark", range: "200+" },
};

const COL_LABELS = ["Finished", "Build · 70%", "Build · 80%", "Build · 90%"] as const;

type Cell = {
	rows: string[];
	meta: ConstructionMeta | null;
	lit: boolean;
};

function cellsFor(id: BuildingId): Cell[] {
	const finished = BUILDING_BY_ID[id];
	const canBuild = (CONSTRUCTION_TARGETS as readonly string[]).includes(id);
	if (!canBuild) {
		return [
			{ rows: finished.rows, meta: null, lit: true },
			{ rows: [], meta: null, lit: false },
			{ rows: [], meta: null, lit: false },
			{ rows: [], meta: null, lit: false },
		];
	}
	return ([null, 0, 1, 2] as const).map((phase) => {
		if (phase === null) return { rows: finished.rows, meta: null, lit: true };
		const meta = makeConstruction(finished, phase);
		return { rows: meta.rows, meta, lit: false };
	});
}

function drawRows(rows: string[], ox: number, oy: number, lit: boolean): string {
	let out = "";
	const winFill = lit ? "#c9d1d9" : (PALETTE.w ?? "#8fb4d6");
	rows.forEach((row, r) => {
		let c = 0;
		while (c < row.length) {
			const ch = row[c]!;
			if (ch === ".") {
				c++;
				continue;
			}
			const x = ox + c * S;
			const y = oy + r * S;
			if (ch === "w") {
				out += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${winFill}"/>`;
				c++;
				continue;
			}
			if (ch === "A") {
				out += `<rect class="blink" x="${x}" y="${y}" width="${S}" height="${S}" fill="#ffd84a"/>`;
				c++;
				continue;
			}
			const fill = PALETTE[ch];
			if (!fill) {
				c++;
				continue;
			}
			let run = 1;
			while (c + run < row.length && row[c + run] === ch) run++;
			out += `<rect x="${x}" y="${y}" width="${run * S}" height="${S}" fill="${fill}"/>`;
			c += run;
		}
	});
	return out;
}

function themeColors(theme: LinkedInTheme) {
	if (theme === "light") {
		return {
			bg: "#eef3f8",
			panel: "#ffffff",
			panelBorder: "#d5dee8",
			title: "#0f172a",
			sub: "#475569",
			muted: "#64748b",
			accent: "#ea580c",
			ground: "#5a8f45",
			chip: "#fff7ed",
			chipText: "#9a3412",
			rule: "#cbd5e1",
		};
	}
	return {
		bg: "#0b1220",
		panel: "#151d2e",
		panelBorder: "#2a3548",
		title: "#f1f5f9",
		sub: "#94a3b8",
		muted: "#64748b",
		accent: "#fb923c",
		ground: "#2f4a2a",
		chip: "#3b2210",
		chipText: "#fdba74",
		rule: "#334155",
	};
}

/** Full LinkedIn showcase: every finished stage + construction phases. */
export function renderLinkedInStagesSvg(theme: LinkedInTheme = "light"): string {
	const C = themeColors(theme);
	const rows = BUILDINGS.map((b) => {
		const id = b.id as BuildingId;
		const cells = cellsFor(id);
		let maxW = 0;
		let maxH = 0;
		for (const cell of cells) {
			if (!cell.rows.length) continue;
			maxW = Math.max(maxW, cell.rows[0]!.length * S);
			maxH = Math.max(maxH, cell.rows.length * S);
		}
		// Empty hut slots still need a panel sized to the finished hut.
		if (maxW === 0) maxW = b.width * S;
		if (maxH === 0) maxH = b.height * S;
		return { id, cells, maxW, maxH };
	});

	const cellW = Math.max(...rows.map((r) => r.maxW)) + PANEL_PAD_X * 2;
	const gridW = ROW_TITLE_W + COLS * (cellW + GAP_X) - GAP_X;
	const W = Math.max(1100, PAD * 2 + gridW);

	const rowHeights = rows.map((r) => r.maxH + LABEL_H + PANEL_PAD_BOTTOM + 16);
	const gridH = rowHeights.reduce((a, h) => a + h, 0) + GAP_Y * (rows.length - 1);
	const H = PAD + HEADER_H + gridH + FOOTER_H + PAD;

	let body = "";
	body += `<text x="${PAD}" y="${PAD + 30}" fill="${C.title}" font-size="28" font-weight="700">Kota Pixel</text>`;
	body += `<text x="${PAD}" y="${PAD + 54}" fill="${C.sub}" font-size="14">Semua tahap bangunan — finished &amp; under construction</text>`;
	body += `<rect x="${W - PAD - 92}" y="${PAD + 16}" width="92" height="28" rx="6" fill="${C.chip}"/>`;
	body += `<text x="${W - PAD - 46}" y="${PAD + 35}" text-anchor="middle" fill="${C.chipText}" font-size="13" font-weight="700">${theme.toUpperCase()}</text>`;
	body += `<line x1="${PAD}" y1="${PAD + HEADER_H - 18}" x2="${W - PAD}" y2="${PAD + HEADER_H - 18}" stroke="${C.rule}" stroke-width="1"/>`;

	const gridTop = PAD + HEADER_H;
	for (let ci = 0; ci < COLS; ci++) {
		const ox = PAD + ROW_TITLE_W + ci * (cellW + GAP_X);
		body += `<text x="${ox + cellW / 2}" y="${gridTop - 8}" text-anchor="middle" fill="${C.muted}" font-size="12">${COL_LABELS[ci]}</text>`;
	}

	let yCursor = gridTop;
	rows.forEach((row, ri) => {
		const cellH = rowHeights[ri]!;
		const meta = NAMES[row.id];
		body += `<text x="${PAD}" y="${yCursor + 20}" fill="${C.title}" font-size="15" font-weight="700">${meta.id}</text>`;
		body += `<text x="${PAD}" y="${yCursor + 38}" fill="${C.muted}" font-size="12">${meta.en}</text>`;
		body += `<text x="${PAD}" y="${yCursor + 54}" fill="${C.accent}" font-size="12">${meta.range} commits</text>`;

		row.cells.forEach((cell, ci) => {
			const ox = PAD + ROW_TITLE_W + ci * (cellW + GAP_X);
			const oy = yCursor;
			body += `<rect x="${ox}" y="${oy}" width="${cellW}" height="${cellH}" rx="10" fill="${C.panel}" stroke="${C.panelBorder}"/>`;

			if (!cell.rows.length) {
				body += `<text x="${ox + cellW / 2}" y="${oy + cellH / 2 + 4}" text-anchor="middle" fill="${C.muted}" font-size="13">n/a</text>`;
				return;
			}

			const spriteW = cell.rows[0]!.length * S;
			const spriteH = cell.rows.length * S;
			const groundY = oy + cellH - PANEL_PAD_BOTTOM;
			const spriteTop = groundY - spriteH;
			const spriteLeft = ox + Math.floor((cellW - spriteW) / 2);

			body += `<rect x="${ox + 8}" y="${groundY - 3}" width="${cellW - 16}" height="6" rx="2" fill="${C.ground}"/>`;
			body += drawRows(cell.rows, spriteLeft, spriteTop, cell.lit);

			if (cell.meta?.craneHook) {
				body += renderCraneHook(
					spriteLeft,
					spriteTop,
					cell.meta.craneHook.col,
					cell.meta.craneHook.row,
					S,
				);
			}
			if (cell.meta) {
				const builders = planBuilders({
					target: row.id,
					seed: `linkedin/${theme}/${row.id}/${ci}`,
					originX: spriteLeft,
					groundY,
					spriteWidthPx: spriteW,
					scale: S,
					scaffoldRows: cell.meta.scaffoldRows,
					spriteTopY: spriteTop,
				});
				for (const b of builders) body += renderBuilder(b);
			}
		});

		yCursor += cellH + GAP_Y;
	});

	body += `<text x="${PAD}" y="${H - PAD + 4}" fill="${C.muted}" font-size="12">Commits (12 bulan) → tahap bangunan · konstruksi mulai ±70% menuju tahap berikutnya · hut tidak punya fase bangun</text>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<title>Kota Pixel — stages (${theme})</title>
<desc>All Kota Pixel building stages: finished and under construction (${theme} mode).</desc>
<style>
text { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
${builderAnimationsCss()}
@keyframes blink { 0%,70%,100%{opacity:1} 80%{opacity:.15} }
.blink { animation: blink 1.6s steps(2) infinite; }
@media (prefers-reduced-motion: reduce) {
  .blink, .hook, .builder-hammer .builder-arm, .builder-carry, .builder-spark { animation: none !important; }
}
</style>
<rect width="100%" height="100%" fill="${C.bg}"/>
${body}
</svg>
`;
}

export function parseLinkedInTheme(raw: string | null): LinkedInTheme {
	return raw === "dark" ? "dark" : "light";
}
