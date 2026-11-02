import type { CityBuilding, CityModel } from "../core/types";
import {
	BUILDING_BY_ID,
	cityAnimationsCss,
	PALETTE,
	renderBush,
	renderBus,
	renderCar,
	renderFlower,
	renderLanguageLogoCentered,
	renderPedestrian,
	renderSkyBackground,
	renderSkyDecor,
	renderSkyDefs,
	renderTree,
	pedestriansForStage,
	planPedestriansForBuilding,
	planStreetWanderers,
	pedestrianKeyframes,
	type BuildingSprite,
} from "../visual";
import { escapeCssColor, escapeXml } from "./escape";
import { hashString } from "./hash";

const SCALE = 3;
const PADDING_X = 16;
/** Keep small so tall peaks sit inside the cloud band (not below an empty sky). */
const PADDING_TOP = 8;
const GROUND_H = 22;
const ROAD_H = 14;
const GAP = 8;
const VIEW_MIN_W = 420;

interface PlacedBuilding {
	building: CityBuilding;
	sprite: BuildingSprite;
	x: number;
	y: number;
}

function themeCss(theme: CityModel["theme"]): string {
	const light = `
.ground { fill: #5a8f45; }
.road { fill: #4a4a52; }
.road-line { fill: #d4d4d8; }
.lbl { fill: #1f2933; }
`;
	const dark = `
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
		const line = sprite.rows[row]!;
		for (let col = 0; col < line.length; col++) {
			const ch = line[col]!;
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
		const { x, y } = order[i]!.cell;
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
		// Pole sits fully above the roof (4 grid tall), cloth at the top.
		const fy = originY - 4 * SCALE;
		parts.push(
			`<rect x="${fx}" y="${fy}" width="${SCALE}" height="${SCALE * 4}" fill="#7a5434"/>` +
				`<rect class="flag" x="${fx + SCALE}" y="${fy}" width="${SCALE * 3}" height="${SCALE * 2}" fill="#d94f4f"/>`,
		);
	}

	// Pixel language logo only on taller buildings — centered on the facade.
	const canShowLogo =
		building.buildingId === "midrise" ||
		building.buildingId === "skyscraper" ||
		building.buildingId === "burj-khalifa";
	if (canShowLogo) {
		const logoPixel = 2;
		const centerX = originX + (sprite.width * SCALE) / 2;
		// Sit on upper body (Burj: a bit lower so it rests on a wider tier).
		const yRatio =
			building.buildingId === "burj-khalifa"
				? 0.3
				: building.buildingId === "skyscraper"
					? 0.16
					: 0.14;
		const topY = originY + sprite.height * SCALE * yRatio;
		const logo = renderLanguageLogoCentered(
			building.primaryLanguage,
			centerX,
			topY,
			logoPixel,
		);
		if (logo) parts.push(logo);
	}

	parts.push(`<title>${escapeXml(building.repoName)}</title>`);
	return `<g data-repo="${escapeXml(building.repoName)}">${parts.join("")}</g>`;
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

	const labelExtra = model.showBuildingLabels ? 28 : 0;
	const contentH = maxH * SCALE;
	const groundY = PADDING_TOP + contentH;
	const roadY = groundY + GROUND_H;
	const height = roadY + ROAD_H + 14 + labelExtra;

	let x = PADDING_X;
	const placed: PlacedBuilding[] = [];
	const gap = model.showBuildingLabels ? Math.max(GAP, 18) : GAP;
	for (const building of model.buildings) {
		const sprite = BUILDING_BY_ID[building.buildingId];
		const y = groundY - sprite.height * SCALE;
		placed.push({ building, sprite, x, y });
		x += sprite.width * SCALE + gap;
	}

	const width = Math.max(VIEW_MIN_W, x + PADDING_X + 40);
	return { placed, width, height, groundY, roadY };
}

export function renderCitySvg(model: CityModel): string {
	const { placed, width, height, groundY, roadY } = placeBuildings(model);
	const user = escapeXml(model.username);
	const staleNote = model.stale ? " (cached)" : "";

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

	const flora: string[] = [];
	const treeSlots = Math.max(model.trees, 0);
	for (let i = 0; i < treeSlots; i++) {
		const side = i % 2 === 0 ? "left" : "right";
		const idx = Math.floor(i / 2);
		const tx = side === "left" ? 4 + idx * 16 : width - 22 - idx * 16;
		flora.push(renderTree(tx, groundY, i));
	}
	const plantSlots = Math.max(model.plants, 0);
	for (let i = 0; i < plantSlots; i++) {
		const x = 20 + ((i * 37) % Math.max(width - 40, 1));
		if (i % 3 === 0) flora.push(renderFlower(x, groundY, i));
		else flora.push(renderBush(x, groundY, i));
	}

	const carColors = [PALETTE.e!, "#4a7fc0", "#c9a24d", "#7a5434"];
	const vehicles: string[] = [];
	// Mix lanes: even index L→R (faces right), odd index R→L (faces left).
	for (let i = 0; i < model.cars; i++) {
		const rev = i % 2 === 1;
		const laneY = rev ? roadY + 1 : roadY + 5;
		vehicles.push(
			renderCar(laneY, carColors[i % carColors.length]!, i * -3.5, rev),
		);
	}
	for (let i = 0; i < model.buses; i++) {
		const rev = i % 2 === 0; // at least one bus goes R→L when buses >= 1
		const laneY = rev ? roadY + 0 : roadY + 4;
		vehicles.push(renderBus(laneY, -1.5 - i * 4.5, rev));
	}

	const pedPlans = placed.flatMap((p, bi) => {
		const doorXPx = p.x + p.sprite.doorX * SCALE;
		return planPedestriansForBuilding({
			buildingLeft: p.x,
			buildingWidthPx: p.sprite.width * SCALE,
			doorXPx,
			groundY,
			count: pedestriansForStage(p.building.buildingId),
			idPrefix: `b${bi}`,
			cityWidth: width,
		});
	});
	const wanderCount = Math.min(6, Math.max(2, Math.floor(width / 90)));
	pedPlans.push(...planStreetWanderers(width, groundY, wanderCount));
	const pedestrians = pedPlans.map(renderPedestrian);

	const emptyHint =
		placed.length === 0
			? `<text class="lbl" x="${width / 2}" y="${groundY - 20}" text-anchor="middle" font-size="10">Belum ada bangunan publik</text>`
			: "";

	const buildingLabels = model.showBuildingLabels
		? placed
				.map((p) => {
					const cx = p.x + (p.sprite.width * SCALE) / 2;
					const label = escapeXml(p.building.repoName);
					return `<text class="lbl" x="${cx}" y="${roadY + ROAD_H + 12}" text-anchor="middle" font-size="9">${label}</text>`;
				})
				.join("")
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
${renderSkyDefs()}
<style>
${themeCss(model.theme)}
${visibilityCss}
${cityAnimationsCss(width + 80)}
${pedestrianKeyframes(pedPlans)}
text { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
</style>
${renderSkyBackground(width, height)}
${renderSkyDecor({
	width,
	theme: model.theme,
	peakY: placed.length ? Math.min(...placed.map((p) => p.y)) : PADDING_TOP,
	layer: "back",
})}
<rect class="ground" x="0" y="${groundY}" width="${width}" height="${GROUND_H}"/>
<rect class="road" x="0" y="${roadY}" width="${width}" height="${ROAD_H}"/>
${Array.from({ length: Math.ceil(width / 24) }, (_, i) =>
	`<rect class="road-line" x="${8 + i * 24}" y="${roadY + 6}" width="10" height="2"/>`,
).join("")}
${flora.join("")}
${buildingsSvg}
${renderSkyDecor({
	width,
	theme: model.theme,
	peakY: placed.length ? Math.min(...placed.map((p) => p.y)) : PADDING_TOP,
	layer: "front",
})}
${pedestrians.join("")}
${vehicles.join("")}
${emptyHint}
${buildingLabels}
<text class="lbl" x="8" y="${height - 4}" font-size="9">@${user}${model.stale ? " · stale" : ""}</text>
</svg>`;
}
