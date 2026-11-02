import type { BuildingId } from "../visual";

export const RENDERER_VERSION = "v8";

export const DEFAULT_BUILDING_LIMIT = 18;
export const MAX_BUILDING_LIMIT = 18;
export const MAX_CARS = 4;
export const MAX_BUSES = 2;
export const MAX_TREES = 10;
export const MAX_PLANTS = 12;
export const STREAK_ACTIVE_DAYS = 7;

/** Stars per tree (capped at MAX_TREES). Uses visualized repos' stars. */
export const STARS_PER_TREE = 8;

/** Commits in 30d that fully light all windows of a building. */
export const WINDOW_FULL_LIT_COMMITS = 20;

export const METRICS_TTL_SECONDS = 6 * 60 * 60;
export const SVG_CACHE_TTL_SECONDS = 60 * 60;
export const STALE_FALLBACK_TTL_SECONDS = 24 * 60 * 60;

export const GITHUB_TIMEOUT_MS = 8_000;
export const ABUSE_LIMIT_PER_MINUTE = 30;

export type ThemeMode = "auto" | "light" | "dark";

/** Commit contribution thresholds -> building stage (12-month window). */
export const BUILDING_STAGES: ReadonlyArray<{ min: number; id: BuildingId }> = [
	{ min: 1000, id: "burj-khalifa" },
	{ min: 800, id: "skyscraper" },
	{ min: 300, id: "midrise" },
	{ min: 100, id: "stone-shop" },
	{ min: 20, id: "wood-house" },
	{ min: 1, id: "hut" },
];

export function buildingIdForCommits(commits12m: number): BuildingId | null {
	if (commits12m < 1) return null;
	for (const stage of BUILDING_STAGES) {
		if (commits12m >= stage.min) return stage.id;
	}
	return "hut";
}

export function clampLimit(raw: number | undefined): number {
	if (raw === undefined || Number.isNaN(raw)) return DEFAULT_BUILDING_LIMIT;
	return Math.min(MAX_BUILDING_LIMIT, Math.max(1, Math.floor(raw)));
}

export function parseTheme(raw: string | null): ThemeMode {
	if (raw === "light" || raw === "dark" || raw === "auto") return raw;
	return "auto";
}
