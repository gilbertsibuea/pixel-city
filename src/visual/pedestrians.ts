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
		case "burj-khalifa":
			return 6;
		default:
			return 1;
	}
}

const SHIRTS = ["#d94f4f", "#4a7fc0", "#c9a24d", "#7a5434", "#5d6b82", "#e85d75"];

export interface PedestrianPlan {
	id: string;
	spawnX: number;
	doorX: number;
	groundY: number;
	variant: number;
	delaySec: number;
	durationSec: number;
}

/**
 * Spread pedestrians on both sides of the door (not stacked on the left).
 * Distances grow so the sidewalk feels busy near taller buildings.
 */
export function planPedestriansForBuilding(options: {
	buildingLeft: number;
	buildingWidthPx: number;
	doorXPx: number;
	groundY: number;
	count: number;
	idPrefix: string;
	cityWidth: number;
}): PedestrianPlan[] {
	const { doorXPx, groundY, count, idPrefix, cityWidth, buildingLeft, buildingWidthPx } =
		options;
	const plans: PedestrianPlan[] = [];
	const minX = Math.max(4, buildingLeft - 18);
	const maxX = Math.min(cityWidth - 10, buildingLeft + buildingWidthPx + 18);

	for (let i = 0; i < count; i++) {
		const side = i % 2 === 0 ? -1 : 1;
		const ring = Math.floor(i / 2) + 1;
		const dist = 14 + ring * 16 + (i % 3) * 5;
		let spawnX = Math.round(doorXPx + side * dist);
		spawnX = Math.max(minX, Math.min(maxX, spawnX));
		// If clamped onto the door, push further along the sidewalk.
		if (Math.abs(spawnX - doorXPx) < 8) {
			spawnX = Math.max(minX, Math.min(maxX, doorXPx + side * (24 + ring * 10)));
		}
		plans.push({
			id: `${idPrefix}-${i}`,
			spawnX,
			doorX: Math.round(doorXPx),
			groundY,
			variant: i,
			delaySec: (i * 1.1) % 7,
			durationSec: 6.5 + (i % 3) * 1.2,
		});
	}
	return plans;
}

/** Extra wanderers along the whole street so the left side isn't the only busy area. */
export function planStreetWanderers(
	cityWidth: number,
	groundY: number,
	count: number,
): PedestrianPlan[] {
	const plans: PedestrianPlan[] = [];
	if (cityWidth < 80 || count <= 0) return plans;
	for (let i = 0; i < count; i++) {
		const t = (i + 1) / (count + 1);
		const spawnX = Math.round(20 + t * (cityWidth - 40));
		const doorX = Math.round(spawnX + (i % 2 === 0 ? 36 : -36));
		plans.push({
			id: `wander-${i}`,
			spawnX,
			doorX: Math.max(10, Math.min(cityWidth - 10, doorX)),
			groundY,
			variant: i + 3,
			delaySec: i * 1.4,
			durationSec: 8 + (i % 2),
		});
	}
	return plans;
}

export function pedestrianKeyframes(plans: PedestrianPlan[]): string {
	return plans
		.map((p) => {
			const name = `ped-${p.id}`;
			return `
@keyframes ${name} {
  0% { transform: translate(${p.spawnX}px, 0); opacity: 1; }
  55% { transform: translate(${p.doorX}px, 0); opacity: 1; }
  70% { transform: translate(${p.doorX}px, 0); opacity: 0; }
  71% { transform: translate(${p.spawnX}px, 0); opacity: 0; }
  100% { transform: translate(${p.spawnX}px, 0); opacity: 1; }
}`;
		})
		.join("");
}

export function renderPedestrian(plan: PedestrianPlan): string {
	const shirt = SHIRTS[plan.variant % SHIRTS.length]!;
	const skin = "#f1c27d";
	const pants = plan.variant % 2 === 0 ? "#2a2a32" : "#3f5273";
	const gy = plan.groundY;
	return (
		`<g class="pedestrian" style="animation: ped-${plan.id} ${plan.durationSec}s steps(8) infinite; animation-delay:${plan.delaySec}s">` +
		`<rect x="${S}" y="${gy - S * 5}" width="${S}" height="${S}" fill="${skin}"/>` +
		`<rect x="${S}" y="${gy - S * 4}" width="${S}" height="${S * 2}" fill="${shirt}"/>` +
		`<rect x="${S}" y="${gy - S * 2}" width="${S}" height="${S}" fill="${pants}"/>` +
		`<rect x="${S}" y="${gy - S}" width="${S}" height="${S}" fill="#222"/>` +
		`</g>`
	);
}
