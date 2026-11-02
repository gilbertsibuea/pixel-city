import {
	METRICS_TTL_SECONDS,
	STALE_FALLBACK_TTL_SECONDS,
} from "../core/config";
import type { CityMetrics } from "../core/types";
import { metricsCacheKey } from "./keys";

interface CachedMetrics {
	metrics: CityMetrics;
	storedAt: number;
	expiresAt: number;
	staleUntil: number;
}

export async function getCachedMetrics(
	kv: KVNamespace | undefined,
	username: string,
	now = Date.now(),
): Promise<{ metrics: CityMetrics; stale: boolean } | null> {
	if (!kv) return null;
	const raw = await kv.get(metricsCacheKey(username), "json");
	if (!raw || typeof raw !== "object") return null;
	const entry = raw as CachedMetrics;
	if (!entry.metrics) return null;
	if (now <= entry.expiresAt) {
		return { metrics: entry.metrics, stale: false };
	}
	if (now <= entry.staleUntil) {
		return { metrics: entry.metrics, stale: true };
	}
	return null;
}

export async function putCachedMetrics(
	kv: KVNamespace | undefined,
	username: string,
	metrics: CityMetrics,
	now = Date.now(),
): Promise<void> {
	if (!kv) return;
	const entry: CachedMetrics = {
		metrics,
		storedAt: now,
		expiresAt: now + METRICS_TTL_SECONDS * 1000,
		staleUntil: now + STALE_FALLBACK_TTL_SECONDS * 1000,
	};
	await kv.put(metricsCacheKey(username), JSON.stringify(entry), {
		expirationTtl: STALE_FALLBACK_TTL_SECONDS,
	});
}
