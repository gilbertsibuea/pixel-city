import type { CityBuilding, CityModel } from "../core/types";
import {
	BUILDING_BY_ID,
	builderAnimationsCss,
	cityAnimationsCss,
	constructionForTarget,
	GROUND_H,
	groundCss,
	groundThemeCss,
	PALETTE,
	planBuilders,
	renderBuilder,
	renderBush,
	renderBus,
	renderCar,
	renderCraneHook,
	renderFlower,
	renderGround,
	renderLanguageLogoCentered,
	renderPedestrian,
	renderRoad,
	renderSkyBackground,
	renderSkyDecor,
	renderSkyDefs,
	renderTree,
	ROAD_H,
	roadCss,
	roadThemeCss,
	pedestriansForStage,
	planPedestriansForBuilding,
	planStreetWanderers,
	pedestrianKeyframes,
	type BuildingSprite,
	type ConstructionMeta,
} from "../visual";
import { escapeCssColor, escapeXml } from "./escape";
import { hashString } from "./hash";

/** Match preview gallery pixel size so stage art doesn't look bigger than live cities. */
const SCALE = 4;
const PADDING_X = 16;
/** Keep small so tall peaks sit inside the cloud band (not below an empty sky). */
const PADDING_TOP = 8;
const GAP = 8;
/**
 * GitHub README scales by the SVG width/height attributes.
 * Composition keeps a minimum sky band (like stages preview) so short cities
 * aren't a flat ribbon; display size is then upscaled for README readability.
 */
const DISPLAY_TARGET_WIDTH = 920;
const DISPLAY_MIN_HEIGHT = 280;
/** Minimum full city height in viewBox units (sky + buildings + ground + road). */
const MIN_COMPOSITION_H = 260;

interface PlacedBuilding {
	building: CityBuilding;
	sprite: BuildingSprite;
	x: number;
	y: number;
	construction: ConstructionMeta | null;
}

function visualForBuilding(building: CityBuilding): {
	sprite: BuildingSprite;
	construction: ConstructionMeta | null;
} {
	if (!building.construction) {
		return { sprite: BUILDING_BY_ID[building.buildingId], construction: null };
	}
	const meta = constructionForTarget(
		building.construction.target,
		building.construction.phase,
	);
	const finished = BUILDING_BY_ID[building.construction.target];
	const sprite: BuildingSprite = {
		id: finished.id,
		name: finished.name,
		rows: meta.rows,
		width: meta.width,
		height: meta.height,
		doorX: meta.doorX,
	};
	return { sprite, construction: meta };
}

function themeCss(theme: CityModel["theme"]): string {
	const labelLight = `.lbl { fill: #1f2933; }`;
	const labelDark = `.lbl { fill: #e8eef6; }`;
	if (theme === "light") {
		return groundThemeCss("light") + roadThemeCss("light") + labelLight;
	}
	if (theme === "dark") {
		return groundThemeCss("dark") + roadThemeCss("dark") + labelDark;
	}
	return `${labelLight}
${groundCss()}
${roadCss()}
@media (prefers-color-scheme: dark) {
${labelDark}
}`;
}

function renderSprite(
	sprite: BuildingSprite,
	building: CityBuilding,
	originX: number,
	originY: number,
	seed: string,
	construction: ConstructionMeta | null,
): string {
	const parts: string[] = [];
	const windowCells: Array<{ x: number; y: number }> = [];
	const underConstruction = construction !== null;

	// Horizontal run-length merge for solid palette cells (keeps SVG small).
	for (let row = 0; row < sprite.rows.length; row++) {
		const line = sprite.rows[row]!;
		let col = 0;
		while (col < line.length) {
			const ch = line[col]!;
			if (ch === ".") {
				col++;
				continue;
			}
			const x = originX + col * SCALE;
			const y = originY + row * SCALE;
			if (ch === "w") {
				windowCells.push({ x, y });
				col++;
				continue;
			}
			if (ch === "A") {
				parts.push(
					`<rect class="blink" x="${x}" y="${y}" width="${SCALE}" height="${SCALE}" fill="#ffd84a"/>`,
				);
				col++;
				continue;
			}
			const color = PALETTE[ch];
			if (!color) {
				col++;
				continue;
			}
			let run = 1;
			while (col + run < line.length && line[col + run] === ch) run++;
			parts.push(
				`<rect x="${x}" y="${y}" width="${run * SCALE}" height="${SCALE}" fill="${color}"/>`,
			);
			col += run;
		}
	}

	const litRatio = underConstruction ? 0 : building.litRatio;
	const litCount = Math.round(windowCells.length * litRatio);
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

	if (!underConstruction && building.smoke && sprite.smokeX !== undefined) {
		const sx = originX + sprite.smokeX * SCALE;
		const sy = originY - 2 * SCALE;
		parts.push(
			`<g class="smoke" opacity="0.8">` +
				`<rect x="${sx}" y="${sy}" width="${SCALE}" height="${SCALE}" fill="#c8c8c8"/>` +
				`<rect x="${sx + SCALE}" y="${sy - SCALE}" width="${SCALE}" height="${SCALE}" fill="#d8d8d8"/>` +
				`</g>`,
		);
	}

	if (!underConstruction && building.flag && sprite.flag) {
		const fx = originX + Math.floor(sprite.width / 2) * SCALE;
		// Pole sits fully above the roof (4 grid tall), cloth at the top.
		const fy = originY - 4 * SCALE;
		parts.push(
			`<rect x="${fx}" y="${fy}" width="${SCALE}" height="${SCALE * 4}" fill="#7a5434"/>` +
				`<rect class="flag" x="${fx + SCALE}" y="${fy}" width="${SCALE * 3}" height="${SCALE * 2}" fill="#d94f4f"/>`,
		);
	}

	// Pixel language logo only on taller finished buildings — centered on the facade.
	const displayId = underConstruction
		? building.construction!.target
		: building.buildingId;
	const canShowLogo =
		!underConstruction &&
		(displayId === "midrise" || displayId === "skyscraper" || displayId === "landmark");
	if (canShowLogo) {
		const logoPixel = 2;
		const centerX = originX + (sprite.width * SCALE) / 2;
		const yRatio =
			displayId === "landmark" ? 0.3 : displayId === "skyscraper" ? 0.16 : 0.14;
		const topY = originY + sprite.height * SCALE * yRatio;
		const logo = renderLanguageLogoCentered(
			building.primaryLanguage,
			centerX,
			topY,
			logoPixel,
		);
		if (logo) parts.push(logo);
	}

	if (construction?.craneHook) {
		parts.push(
			renderCraneHook(
				originX,
				originY,
				construction.craneHook.col,
				construction.craneHook.row,
				SCALE,
			),
		);
	}

	if (construction && building.construction) {
		const builders = planBuilders({
			target: building.construction.target,
			seed,
			originX,
			groundY: originY + sprite.height * SCALE,
			spriteWidthPx: sprite.width * SCALE,
			scale: SCALE,
			scaffoldRows: construction.scaffoldRows,
			spriteTopY: originY,
		});
		for (const b of builders) parts.push(renderBuilder(b));
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
	const visuals = model.buildings.map((b) => visualForBuilding(b));
	const maxH = visuals.reduce((m, v) => Math.max(m, v.sprite.height), 8);

	const labelExtra = model.showBuildingLabels ? 28 : 0;
	const buildingH = maxH * SCALE;
	const stackH = buildingH + GROUND_H + ROAD_H + 14 + labelExtra;
	// Extra sky above buildings so clouds/sun have room (matches stages preview feel).
	const skyH = Math.max(PADDING_TOP, MIN_COMPOSITION_H - stackH);
	const groundY = skyH + buildingH;
	const roadY = groundY + GROUND_H;
	const height = roadY + ROAD_H + 14 + labelExtra;

	let x = PADDING_X;
	const placed: PlacedBuilding[] = [];
	const gap = model.showBuildingLabels ? Math.max(GAP, 18) : GAP;
	for (let i = 0; i < model.buildings.length; i++) {
		const building = model.buildings[i]!;
		const { sprite, construction } = visuals[i]!;
		const y = groundY - sprite.height * SCALE;
		placed.push({ building, sprite, x, y, construction });
		x += sprite.width * SCALE + gap;
	}

	const width = Math.max(x + PADDING_X, 360);
	return { placed, width, height, groundY, roadY };
}

function skyPeakFallback(groundY: number): number {
	return Math.max(PADDING_TOP, Math.floor(groundY * 0.35));
}

function displaySize(width: number, height: number): { outW: number; outH: number } {
	const scale = Math.max(
		1,
		DISPLAY_TARGET_WIDTH / width,
		DISPLAY_MIN_HEIGHT / height,
	);
	return {
		outW: Math.round(width * scale),
		outH: Math.round(height * scale),
	};
}

export function renderCitySvg(model: CityModel): string {
	const { placed, width, height, groundY, roadY } = placeBuildings(model);
	const { outW, outH } = displaySize(width, height);
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
				p.construction,
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
	/**
	 * Two lanes on the road strip (smaller Y = farther / near buildings).
	 * Painter order must be back → front so near-lane traffic sits on top.
	 * Back lane: R→L (rev). Front lane: L→R.
	 */
	const LANE_BACK = roadY + 1;
	const LANE_FRONT = roadY + 5;
	const vehiclePlans: Array<{ laneY: number; svg: string }> = [];
	for (let i = 0; i < model.cars; i++) {
		const rev = i % 2 === 1;
		const laneY = rev ? LANE_BACK : LANE_FRONT;
		vehiclePlans.push({
			laneY,
			svg: renderCar(laneY, carColors[i % carColors.length]!, i * -3.5, rev),
		});
	}
	for (let i = 0; i < model.buses; i++) {
		const rev = i % 2 === 0;
		const laneY = rev ? LANE_BACK : LANE_FRONT;
		vehiclePlans.push({
			laneY,
			svg: renderBus(laneY, -1.5 - i * 4.5, rev),
		});
	}
	vehiclePlans.sort((a, b) => a.laneY - b.laneY);

	const pedPlans = placed.flatMap((p, bi) => {
		const doorXPx = p.x + p.sprite.doorX * SCALE;
		const stageId = p.building.construction?.target ?? p.building.buildingId;
		return planPedestriansForBuilding({
			buildingLeft: p.x,
			buildingWidthPx: p.sprite.width * SCALE,
			doorXPx,
			groundY,
			count: pedestriansForStage(stageId),
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
<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${width} ${height}" role="img">
<title>Pixel Cityscape — ${user}</title>
<desc>Pixel Cityscape of public GitHub activity for ${user}${staleNote}. Buildings represent repositories; window lights show recent commits.</desc>
${renderSkyDefs()}
<style>
${themeCss(model.theme)}
${visibilityCss}
${cityAnimationsCss(width + 80)}
${builderAnimationsCss()}
${pedestrianKeyframes(pedPlans)}
text { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
</style>
${renderSkyBackground(width, roadY + ROAD_H)}
${renderSkyDecor({
	width,
	theme: model.theme,
	peakY: placed.length ? Math.min(...placed.map((p) => p.y)) : skyPeakFallback(groundY),
	groundY,
	layer: "back",
})}
${renderGround(width, groundY)}
${renderRoad(width, roadY)}
${flora.join("")}
${buildingsSvg}
${renderSkyDecor({
	width,
	theme: model.theme,
	peakY: placed.length ? Math.min(...placed.map((p) => p.y)) : skyPeakFallback(groundY),
	groundY,
	layer: "front",
})}
${pedestrians.join("")}
<g class="vehicles-back">${vehiclePlans
	.filter((v) => v.laneY <= LANE_BACK)
	.map((v) => v.svg)
	.join("")}</g>
<g class="vehicles-front">${vehiclePlans
	.filter((v) => v.laneY > LANE_BACK)
	.map((v) => v.svg)
	.join("")}</g>
${emptyHint}
${buildingLabels}
</svg>`;
}
