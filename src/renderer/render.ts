import type { CityBuilding, CityModel } from "../core/types";
import {
	BUILDING_BY_ID,
	CITY_ANIMATIONS_CSS,
	PALETTE,
	type BuildingSprite,
} from "../visual";
import { escapeCssColor, escapeXml } from "./escape";
import { hashString } from "./hash";

const SCALE = 3;
const PADDING_X = 16;
const PADDING_TOP = 28;
const GROUND_H = 18;
const ROAD_H = 10;
const GAP = 6;
const VIEW_MIN_W = 420;

interface PlacedBuilding {
	building: CityBuilding;
	sprite: BuildingSprite;
	x: number;
	y: number;
}

function themeCss(theme: CityModel["theme"]): string {
	const light = `
.sky { fill: #87b8e8; }
.ground { fill: #5a8f45; }
.road { fill: #4a4a52; }
.road-line { fill: #d4d4d8; }
.lbl { fill: #1f2933; }
`;
	const dark = `
.sky { fill: #1a2233; }
.ground { fill: #2f4a2a; }
.road { fill: #2a2a32; }
.road-line { fill: #6a6a72; }
.lbl { fill: #e8eef6; }
`;
	if (theme === "light") return light;
	if (theme === "dark") return dark;
	return `${light}
@media (prefers-color-scheme: dark) {
${dark}
}`;
}

function renderSprite(
	sprite: BuildingSprite,
	building: CityBuilding,
	originX: number,
	originY: number,
	seed: string,
): string {
	const parts: string[] = [];
	const windowCells: Array<{ x: number; y: number }> = [];

	for (let row = 0; row < sprite.rows.length; row++) {
		const line = sprite.rows[row];
		for (let col = 0; col < line.length; col++) {
			const ch = line[col];
			if (ch === ".") continue;
			const x = originX + col * SCALE;
			const y = originY + row * SCALE;
			if (ch === "w") {
				windowCells.push({ x, y });
				continue;
			}
			if (ch === "A") {
				parts.push(
					`<rect class="blink" x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="#ffd84a"/>`,
				);
				continue;
			}
			const color = PALETTE[ch];
			if (!color) continue;
			parts.push(
				`<rect x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="${color}"/>`,
			);
		}
	}

	const litCount = Math.round(windowCells.length * building.litRatio);
	const order = windowCells
		.map((cell, i) => ({ cell, rank: hashString(`${seed}:${i}`) }))
		.sort((a, b) => a.rank - b.rank);

	const winColor = escapeCssColor(building.languageColor);
	for (let i = 0; i < order.length; i++) {
		const { x, y } = order[i].cell;
		const on = i < litCount;
		const cls = on ? 'class="win on"' : 'class="win"';
		const fill = on ? winColor : (PALETTE.w ?? "#8fb4d6");
		parts.push(
			`<rect ${cls} x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="${fill}"/>`,
		);
	}

	if (building.smoke && sprite.smokeX !== undefined) {
		const sx = originX + sprite.smokeX * SCALE;
		const sy = originY - 2 * SCALE;
		parts.push(
			`<g class="smoke" opacity="0.8">` +
				`<rect x="${sx}" y="${sy}" width="${SCALE}" height="${SCALE}" fill="#c8c8c8"/>` +
				`<rect x="${sx + SCALE}" y="${sy - SCALE}" width="${SCALE}" height="${SCALE}" fill="#d8d8d8"/>` +
				`</g>`,
		);
	}

	if (building.flag && sprite.flag) {
		const fx = originX + Math.floor(sprite.width / 2) * SCALE;
		const fy = originY - SCALE;
		parts.push(
			`<rect x="${fx}" y="${fy}" width="${SCALE}" height="${SCALE * 4}" fill="#7a5434"/>` +
				`<rect class="flag" x="${fx + SCALE}" y="${fy}" width="${SCALE * 3}" height="${SCALE * 2}" fill="#d94f4f"/>`,
		);
	}

	const label = escapeXml(building.repoName);
	parts.push(
		`<title>${label}</title>`,
	);

	return `<g data-repo="${escapeXml(building.repoName)}">${parts.join("")}</g>`;
}

function renderTree(x: number, groundY: number, i: number): string {
	const trunkH = 4 * SCALE;
	const topY = groundY - trunkH - 4 * SCALE;
	return (
		`<g class="tree" transform="translate(${x},0)">` +
		`<rect x="2" y="${groundY - trunkH}" width="${SCALE}" height="${trunkH}" fill="${PALETTE.b}"/>` +
		`<g class="tree-top">` +
		`<rect x="0" y="${topY}" width="${SCALE * 3}" height="${SCALE * 3}" fill="${PALETTE.g}"/>` +
		`<rect x="${SCALE}" y="${topY - SCALE}" width="${SCALE}" height="${SCALE}" fill="${PALETTE.g}"/>` +
		`</g></g>`
	);
}

function renderCar(y: number, delay: number, color: string): string {
	return (
		`<g class="car" style="animation-delay:${delay}s">` +
		`<rect x="0" y="${y}" width="${SCALE * 5}" height="${SCALE * 2}" fill="${color}"/>` +
		`<rect x="${SCALE}" y="${y - SCALE}" width="${SCALE * 3}" height="${SCALE}" fill="#dce6f0"/>` +
		`<rect x="${SCALE}" y="${y + SCALE * 2}" width="${SCALE}" height="${SCALE}" fill="${PALETTE.n}"/>` +
		`<rect x="${SCALE * 3}" y="${y + SCALE * 2}" width="${SCALE}" height="${SCALE}" fill="${PALETTE.n}"/>` +
		`</g>`
	);
}

function placeBuildings(model: CityModel): {
	placed: PlacedBuilding[];
	width: number;
	height: number;
	groundY: number;
	roadY: number;
} {
	const maxH = model.buildings.reduce((m, b) => {
		const s = BUILDING_BY_ID[b.buildingId];
		return Math.max(m, s.height);
	}, 8);

	const contentH = maxH * SCALE;
	const groundY = PADDING_TOP + contentH;
	const roadY = groundY + GROUND_H;
	const height = roadY + ROAD_H + 12;

	let x = PADDING_X;
	const placed: PlacedBuilding[] = [];
	for (const building of model.buildings) {
		const sprite = BUILDING_BY_ID[building.buildingId];
		const y = groundY - sprite.height * SCALE;
		placed.push({ building, sprite, x, y });
		x += sprite.width * SCALE + GAP;
	}

	const width = Math.max(VIEW_MIN_W, x + PADDING_X + 40);
	return { placed, width, height, groundY, roadY };
}

export function renderCitySvg(model: CityModel): string {
	const { placed, width, height, groundY, roadY } = placeBuildings(model);
	const user = escapeXml(model.username);
	const staleNote = model.stale ? " (cached)" : "";

	const skyExtras =
		model.theme === "dark"
			? `<circle class="moon" cx="${width - 36}" cy="22" r="10" fill="${PALETTE.f}"/>`
			: model.theme === "light"
				? `<g class="sun"><circle cx="36" cy="22" r="10" fill="${PALETTE.y}"/></g>`
				: `<g class="sun light-only"><circle cx="36" cy="22" r="10" fill="${PALETTE.y}"/></g>` +
					`<circle class="moon dark-only" cx="${width - 36}" cy="22" r="10" fill="${PALETTE.f}"/>`;

	const clouds =
		`<g class="cloud" opacity="0.9">` +
		`<rect x="70" y="14" width="${SCALE * 6}" height="${SCALE * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="76" y="10" width="${SCALE * 4}" height="${SCALE * 2}" fill="${PALETTE.q}"/>` +
		`</g>` +
		`<g class="cloud" opacity="0.75" style="animation-delay:8s">` +
		`<rect x="${Math.floor(width * 0.45)}" y="20" width="${SCALE * 7}" height="${SCALE * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${Math.floor(width * 0.45) + 6}" y="16" width="${SCALE * 4}" height="${SCALE * 2}" fill="${PALETTE.q}"/>` +
		`</g>`;

	const buildingsSvg = placed
		.map((p) =>
			renderSprite(
				p.sprite,
				p.building,
				p.x,
				p.y,
				`${model.username}/${p.building.repoName}`,
			),
		)
		.join("");

	const treeParts: string[] = [];
	const treeSlots = Math.max(model.trees, 0);
	for (let i = 0; i < treeSlots; i++) {
		const side = i % 2 === 0 ? "left" : "right";
		const idx = Math.floor(i / 2);
		const tx =
			side === "left"
				? 4 + idx * 14
				: width - 20 - idx * 14;
		treeParts.push(renderTree(tx, groundY, i));
	}

	const carColors = [PALETTE.e, "#4a7fc0", "#c9a24d"];
	const cars = Array.from({ length: model.cars }, (_, i) =>
		renderCar(roadY + 2, i * 5.5, carColors[i % carColors.length]!),
	).join("");

	const emptyHint =
		placed.length === 0
			? `<text class="lbl" x="${width / 2}" y="${groundY - 20}" text-anchor="middle" font-family="monospace" font-size="10">Belum ada bangunan publik</text>`
			: "";

	const visibilityCss =
		model.theme === "auto"
			? `
.dark-only { display: none; }
@media (prefers-color-scheme: dark) {
  .light-only { display: none; }
  .dark-only { display: inline; }
}`
			: model.theme === "dark"
				? `.light-only { display: none; }`
				: `.dark-only { display: none; }`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<title>Kota Pixel — ${user}</title>
<desc>Pixel city of public GitHub activity for ${user}${staleNote}. Buildings represent repositories; window lights show recent commits.</desc>
<style>
${themeCss(model.theme)}
${visibilityCss}
${CITY_ANIMATIONS_CSS}
text { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
</style>
<rect class="sky" width="${width}" height="${height}"/>
${skyExtras}
${clouds}
<rect class="ground" x="0" y="${groundY}" width="${width}" height="${GROUND_H}"/>
<rect class="road" x="0" y="${roadY}" width="${width}" height="${ROAD_H}"/>
${Array.from({ length: Math.ceil(width / 24) }, (_, i) =>
	`<rect class="road-line" x="${8 + i * 24}" y="${roadY + 4}" width="10" height="2"/>`,
).join("")}
${treeParts.join("")}
${buildingsSvg}
${cars}
${emptyHint}
<text class="lbl" x="8" y="${height - 4}" font-size="9">@${user}${model.stale ? " · stale" : ""}</text>
</svg>`;
}
