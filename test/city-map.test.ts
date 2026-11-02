import { describe, expect, it } from "vitest";
import {
	buildingIdForCommits,
	clampLimit,
} from "../src/core/config";
import {
	carCountForCity,
	carCountFromMergedPrs,
	litRatioForCommits,
	mapMetricsToCity,
	selectRepositories,
	treeCountFromStars,
} from "../src/core/map";
import type { CityMetrics, RepositoryMetric } from "../src/core/types";

function repo(partial: Partial<RepositoryMetric> & Pick<RepositoryMetric, "name">): RepositoryMetric {
	return {
		nameWithOwner: `user/${partial.name}`,
		commits12m: 10,
		commits30d: 0,
		primaryLanguage: null,
		languageColor: null,
		stars: 0,
		...partial,
	};
}

describe("building stages", () => {
	it("maps commit thresholds", () => {
		expect(buildingIdForCommits(0)).toBeNull();
		expect(buildingIdForCommits(1)).toBe("hut");
		expect(buildingIdForCommits(19)).toBe("hut");
		expect(buildingIdForCommits(20)).toBe("wood-house");
		expect(buildingIdForCommits(99)).toBe("wood-house");
		expect(buildingIdForCommits(100)).toBe("stone-shop");
		expect(buildingIdForCommits(300)).toBe("midrise");
		expect(buildingIdForCommits(800)).toBe("skyscraper");
		expect(buildingIdForCommits(999)).toBe("skyscraper");
		expect(buildingIdForCommits(1000)).toBe("burj-khalifa");
	});
});

describe("repository selection", () => {
	it("sorts by commits and caps at limit", () => {
		const repos = [
			repo({ name: "a", commits12m: 5 }),
			repo({ name: "b", commits12m: 50 }),
			repo({ name: "c", commits12m: 50, stars: 9 }),
			repo({ name: "d", commits12m: 0 }),
		];
		const selected = selectRepositories(repos, 2);
		expect(selected.map((r) => r.name)).toEqual(["c", "b"]);
	});
});

describe("city mapping", () => {
	it("applies cars, trees, streak effects", () => {
		const metrics: CityMetrics = {
			username: "dev",
			fetchedAt: "2026-11-02T00:00:00.000Z",
			streakDays: 8,
			mergedPrs30d: 5,
			totalStars: 100,
			repositories: [
				repo({
					name: "pixel",
					commits12m: 120,
					commits30d: 10,
					languageColor: "#3572A5",
					stars: 25,
				}),
			],
		};
		const city = mapMetricsToCity(metrics, { limit: 18, theme: "light" });
		expect(city.buildings).toHaveLength(1);
		expect(city.buildings[0]?.buildingId).toBe("stone-shop");
		expect(city.buildings[0]?.smoke).toBe(true);
		expect(city.buildings[0]?.flag).toBe(true);
		expect(city.cars).toBe(4);
		expect(city.buses).toBeGreaterThanOrEqual(1);
		expect(city.trees).toBe(3);
		expect(city.plants).toBeGreaterThan(0);
		expect(city.buildings[0]?.primaryLanguage).toBeNull();
		expect(litRatioForCommits(10)).toBe(0.5);
	});

	it("produces empty buildings for inactive accounts", () => {
		const metrics: CityMetrics = {
			username: "newbie",
			fetchedAt: "2026-11-02T00:00:00.000Z",
			streakDays: 0,
			mergedPrs30d: 0,
			totalStars: 0,
			repositories: [],
		};
		const city = mapMetricsToCity(metrics, { limit: 18, theme: "auto" });
		expect(city.buildings).toEqual([]);
		expect(city.cars).toBe(0);
		expect(city.buses).toBe(0);
		expect(city.trees).toBe(0);
	});
});

describe("helpers", () => {
	it("clamps limit", () => {
		expect(clampLimit(undefined)).toBe(18);
		expect(clampLimit(0)).toBe(1);
		expect(clampLimit(99)).toBe(18);
	});

	it("caps cars and trees", () => {
		expect(carCountFromMergedPrs(0)).toBe(0);
		expect(carCountFromMergedPrs(9)).toBe(4);
		expect(carCountForCity(0, 8)).toBeGreaterThanOrEqual(1);
		expect(treeCountFromStars(0)).toBe(0);
		expect(treeCountFromStars(3)).toBe(1);
		expect(treeCountFromStars(999)).toBe(10);
	});
});
