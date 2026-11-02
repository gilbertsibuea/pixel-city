import { RENDERER_VERSION } from "../core/config";
import type { ThemeMode } from "../core/config";

export function normalizeUsername(username: string): string {
	return username.trim().toLowerCase();
}

export function metricsCacheKey(username: string): string {
	return `metrics:${RENDERER_VERSION}:${normalizeUsername(username)}`;
}

export function svgCacheKey(
	username: string,
	limit: number,
	theme: ThemeMode,
): string {
	return `city:${RENDERER_VERSION}:${normalizeUsername(username)}:limit${limit}:theme-${theme}`;
}
