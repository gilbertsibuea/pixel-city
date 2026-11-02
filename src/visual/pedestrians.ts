import type { BuildingId } from "./buildings/types";

const S = 3;

/** Pedestrians spawned near a building, based on its stage. */
export function pedestriansForStage(stage: BuildingId): number {
	switch (stage) {
		case "hut":
			return 1;
		case "wood-house":
			return 2;
		case "stone-shop":
			return 3;
		case "midrise":
			return 4;
		case "skyscraper":
			return 5;
		default:
			return 1;
	}
}

const SHIRTS = ["#d94f4f", "#4a7fc0", "#c9a24d", "#7a5434", "#5d6b82", "#e85d75"];

export function renderPedestrian(
	x: number,
	groundY: number,
	variant: number,
	delaySec: number,
): string {
	const shirt = SHIRTS[variant % SHIRTS.length]!;
	const skin = "#f1c27d";
	const pants = variant % 2 === 0 ? "#2a2a32" : "#3f5273";
	return (
		`<g class="pedestrian" style="animation-delay:${delaySec}s" transform="translate(${x},0)">` +
		`<rect x="${S}" y="${groundY - S * 5}" width="${S}" height="${S}" fill="${skin}"/>` +
		`<rect x="${S}" y="${groundY - S * 4}" width="${S}" height="${S * 2}" fill="${shirt}"/>` +
		`<rect x="${S}" y="${groundY - S * 2}" width="${S}" height="${S}" fill="${pants}"/>` +
		`<rect x="${S}" y="${groundY - S}" width="${S}" height="${S}" fill="#222"/>` +
		`</g>`
	);
}
