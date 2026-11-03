import type { BuildingId } from "../visual/buildings/types";

export const RENDERER_VERSION = "v18";

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

/**
 * Single source of truth for stage thresholds (commits in last 12 months).
 * Ordered ascending by `min`. Landmark is the final stage (no construction after it).
 */
export const BUILDING_STAGE_DEFS: ReadonlyArray<{
	readonly id: BuildingId;
	readonly min: number;
}> = [
	{ id: "hut", min: 1 },
	{ id: "wood-house", min: 20 },
	{ id: "stone-shop", min: 41 },
	{ id: "midrise", min: 51 },
	{ id: "skyscraper", min: 100 },
	{ id: "landmark", min: 200 },
] as const;

/** Descending by min — used by buildingIdForCommits. */
export const BUILDING_STAGES: ReadonlyArray<{ min: number; id: BuildingId }> = [
	...BUILDING_STAGE_DEFS,
].sort((a, b) => b.min - a.min);

export type ConstructionPhase = 0 | 1 | 2;

export interface ConstructionState {
	target: BuildingId;
	phase: ConstructionPhase;
}

/** First commit count where construction of the next stage begins (progress ≥ 70%). */
export function constructionStartCommit(lo: number, nextLo: number): number {
	// ceil((lo*10 + 7*(nextLo-lo)) / 10) via integer math
	const num = lo * 10 + 7 * (nextLo - lo);
	return Math.floor((num + 9) / 10);
}

/**
 * When a repo is ≥70% through its current stage toward the next, show the NEXT
 * building under construction. Returns null outside that window / for landmark.
 */
export function constructionPhase(commits: number): ConstructionState | null {
	if (commits < 1) return null;

	let idx = -1;
	for (let i = BUILDING_STAGE_DEFS.length - 1; i >= 0; i--) {
		if (commits >= BUILDING_STAGE_DEFS[i]!.min) {
			idx = i;
			break;
		}
	}
	if (idx < 0 || idx >= BUILDING_STAGE_DEFS.length - 1) return null;

	const lo = BUILDING_STAGE_DEFS[idx]!.min;
	const next = BUILDING_STAGE_DEFS[idx + 1]!;
	const nextLo = next.min;
	if (commits >= nextLo) return null;

	const span = nextLo - lo;
	const pct = Math.floor(((commits - lo) * 100) / span);
	if (pct < 70) return null;

	const phase: ConstructionPhase = pct < 80 ? 0 : pct < 90 ? 1 : 2;
	return { target: next.id, phase };
}

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
