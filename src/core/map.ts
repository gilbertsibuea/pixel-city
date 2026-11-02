import {
	MAX_CARS,
	MAX_TREES,
	STARS_PER_TREE,
	STREAK_ACTIVE_DAYS,
	WINDOW_FULL_LIT_COMMITS,
	buildingIdForCommits,
	type ThemeMode,
} from "./config";
import type { CityBuilding, CityMetrics, CityModel, RepositoryMetric } from "./types";
import { LANGUAGE_FALLBACK_COLOR } from "../visual";

export function sortRepositories(repos: RepositoryMetric[]): RepositoryMetric[] {
	return [...repos].sort((a, b) => {
		if (b.commits12m !== a.commits12m) return b.commits12m - a.commits12m;
		if (b.stars !== a.stars) return b.stars - a.stars;
		return a.name.localeCompare(b.name);
	});
}

export function selectRepositories(
	repos: RepositoryMetric[],
	limit: number,
): RepositoryMetric[] {
	return sortRepositories(repos.filter((r) => r.commits12m >= 1)).slice(0, limit);
}

export function litRatioForCommits(commits30d: number): number {
	if (commits30d <= 0) return 0;
	return Math.min(1, commits30d / WINDOW_FULL_LIT_COMMITS);
}

export function treeCountFromStars(totalStars: number): number {
	if (totalStars <= 0) return 0;
	return Math.min(MAX_TREES, Math.max(1, Math.floor(totalStars / STARS_PER_TREE)));
}

export function carCountFromMergedPrs(mergedPrs30d: number): number {
	return Math.min(MAX_CARS, Math.max(0, Math.floor(mergedPrs30d)));
}

export function mapMetricsToCity(
	metrics: CityMetrics,
	options: { limit: number; theme: ThemeMode; stale?: boolean },
): CityModel {
	const selected = selectRepositories(metrics.repositories, options.limit);
	const totalStars = selected.reduce((sum, r) => sum + r.stars, 0);
	const streakActive = metrics.streakDays >= STREAK_ACTIVE_DAYS;

	const buildings: CityBuilding[] = [];
	for (const repo of selected) {
		const buildingId = buildingIdForCommits(repo.commits12m);
		if (!buildingId) continue;
		buildings.push({
			repoName: repo.name,
			buildingId,
			languageColor: repo.languageColor ?? LANGUAGE_FALLBACK_COLOR,
			litRatio: litRatioForCommits(repo.commits30d),
			smoke: streakActive,
			flag: streakActive,
		});
	}

	return {
		username: metrics.username,
		theme: options.theme,
		buildings,
		cars: carCountFromMergedPrs(metrics.mergedPrs30d),
		trees: treeCountFromStars(totalStars),
		streakActive,
		generatedAt: metrics.fetchedAt,
		stale: options.stale,
	};
}
