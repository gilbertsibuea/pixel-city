import type { BuildingId, BuildingSprite } from "./types";
import { hut } from "./hut";
import { woodHouse } from "./wood-house";
import { stoneShop } from "./stone-shop";
import { midrise } from "./midrise";
import { skyscraper } from "./skyscraper";
import { burjKhalifa } from "./burj-khalifa";

/** Ordered by stage: index 0 = tahap 1 ... index 5 = tahap 6. */
export const BUILDINGS: readonly BuildingSprite[] = [
	hut,
	woodHouse,
	stoneShop,
	midrise,
	skyscraper,
	burjKhalifa,
];

export const BUILDING_BY_ID: Readonly<Record<BuildingId, BuildingSprite>> = {
	hut,
	"wood-house": woodHouse,
	"stone-shop": stoneShop,
	midrise,
	skyscraper,
	"burj-khalifa": burjKhalifa,
};

export { hut, woodHouse, stoneShop, midrise, skyscraper, burjKhalifa };
