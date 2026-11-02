import type { BuildingId } from "../visual";
import type { ThemeMode } from "./config";

export interface RepositoryMetric {
	name: string;
	nameWithOwner: string;
	commits12m: number;
	commits30d: number;
	primaryLanguage: string | null;
	languageColor: string | null;
	stars: number;
}

export interface CityMetrics {
	username: string;
	fetchedAt: string;
	repositories: RepositoryMetric[];
	/** Consecutive contribution days ending on evaluation date. */
	streakDays: number;
	mergedPrs30d: number;
	/** Sum of stars across repositories included in aggregation. */
	totalStars: number;
}

export interface CityBuilding {
	repoName: string;
	buildingId: BuildingId;
	languageColor: string;
	/** GitHub primary language name; logo only for common languages. */
	primaryLanguage: string | null;
	/** 0..1 fraction of windows that should be lit. */
	litRatio: number;
	smoke: boolean;
	flag: boolean;
}

export interface CityModel {
	username: string;
	theme: ThemeMode;
	buildings: CityBuilding[];
	cars: number;
	buses: number;
	trees: number;
	/** Extra bushes/flowers along the ground. */
	plants: number;
	streakActive: boolean;
	generatedAt: string;
	stale?: boolean;
	/** When true, draw repo/stage captions under each building (preview). */
	showBuildingLabels?: boolean;
}

export type FetchMetricsResult =
	| { ok: true; metrics: CityMetrics; fromCache: boolean; stale?: boolean }
	| { ok: false; error: "not_found" | "upstream" | "invalid"; message: string };
