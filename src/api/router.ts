import {
	ABUSE_LIMIT_PER_MINUTE,
	SVG_CACHE_TTL_SECONDS,
	clampLimit,
	parseTheme,
} from "../core/config";
import { mapMetricsToCity } from "../core/map";
import { getCachedMetrics, putCachedMetrics } from "../cache/kv";
import { normalizeUsername, svgCacheKey } from "../cache/keys";
import { fetchCityMetrics, GitHubError } from "../github/client";
import { renderCitySvg } from "../renderer/render";
import {
	isBuildingId,
	renderBuildingPreviewSvg,
	renderEnvironmentPreviewSvg,
	renderPreviewIndexHtml,
	renderStagesPreviewSvg,
} from "../renderer/previewGallery";
import {
	parseLinkedInTheme,
	renderLinkedInStagesSvg,
} from "../renderer/linkedinSheet";
import { renderFallbackSvg } from "../fallback/renderFallback";
import { etagFor, svgResponse } from "./response";

/** GitHub username: 1–39 chars, alphanumeric or hyphen, no leading/trailing hyphen. */
const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export interface WorkerEnv {
	GITHUB_TOKEN: string;
	CITY_CACHE?: KVNamespace;
}

function parseCityPath(pathname: string): string | null {
	const match = pathname.match(/^\/v1\/city\/([^/]+)\.svg$/i);
	if (!match) return null;
	try {
		return decodeURIComponent(match[1]!);
	} catch {
		return null;
	}
}

async function checkAbuse(
	kv: KVNamespace | undefined,
	ip: string,
): Promise<boolean> {
	if (!kv) return true;
	const key = `abuse:${ip}:${Math.floor(Date.now() / 60_000)}`;
	const current = Number((await kv.get(key)) ?? "0");
	if (current >= ABUSE_LIMIT_PER_MINUTE) return false;
	await kv.put(key, String(current + 1), { expirationTtl: 120 });
	return true;
}

export async function handleRequest(
	request: Request,
	env: WorkerEnv,
	ctx: ExecutionContext,
): Promise<Response> {
	const url = new URL(request.url);

	if (request.method === "OPTIONS") {
		return new Response(null, {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, If-None-Match",
			},
		});
	}

	if (url.pathname === "/health") {
		return new Response(
			JSON.stringify({
				name: "Kota Pixel",
				endpoint: "/v1/city/{username}.svg",
				preview: "/preview",
				ok: true,
			}),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	if (request.method !== "GET" && request.method !== "HEAD") {
		return new Response("Method Not Allowed", { status: 405 });
	}

	if (url.pathname === "/" || url.pathname === "/preview") {
		return new Response(renderPreviewIndexHtml(url.origin), {
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Cache-Control": "public, max-age=60",
			},
		});
	}

	if (url.pathname === "/v1/preview/stages.svg") {
		const svg = renderStagesPreviewSvg(url.searchParams.get("theme"));
		return svgResponse(svg, { cacheSeconds: 60 });
	}

	if (url.pathname === "/v1/preview/linkedin.svg") {
		const svg = renderLinkedInStagesSvg(parseLinkedInTheme(url.searchParams.get("theme")));
		return svgResponse(svg, { cacheSeconds: 60 });
	}

	if (url.pathname === "/v1/preview/environment.svg") {
		const svg = renderEnvironmentPreviewSvg(url.searchParams.get("theme"));
		return svgResponse(svg, { cacheSeconds: 60 });
	}

	const buildingMatch = url.pathname.match(
		/^\/v1\/preview\/building\/([a-z0-9-]+)\.svg$/i,
	);
	if (buildingMatch) {
		const id = buildingMatch[1]!;
		if (!isBuildingId(id)) {
			return svgResponse(
				renderFallbackSvg({
					title: "Building tidak ditemukan",
					message: `id: ${id}`,
					status: 404,
				}),
				{ status: 404, cacheSeconds: 60 },
			);
		}
		return svgResponse(
			renderBuildingPreviewSvg(id, url.searchParams.get("theme")),
			{ cacheSeconds: 60 },
		);
	}

	const rawUser = parseCityPath(url.pathname);
	if (rawUser === null) {
		return new Response("Not Found", { status: 404 });
	}

	if (!USERNAME_RE.test(rawUser)) {
		const svg = renderFallbackSvg({
			title: "Username tidak valid",
			message: "Gunakan username GitHub yang sah.",
			status: 400,
		});
		return svgResponse(svg, { status: 400, cacheSeconds: 60 });
	}

	// Ignore unknown query keys (e.g. ?v=8 for GitHub/Camo cache-bust).
	// Only limit + theme are read below.

	const limitParam = url.searchParams.get("limit");
	const limit =
		limitParam === null ? clampLimit(undefined) : clampLimit(Number(limitParam));
	if (limitParam !== null) {
		const n = Number(limitParam);
		if (!Number.isFinite(n) || n < 1 || n > 18) {
			const svg = renderFallbackSvg({
				title: "limit tidak valid",
				message: "limit harus 1–18.",
				status: 400,
			});
			return svgResponse(svg, { status: 400, cacheSeconds: 60 });
		}
	}

	const theme = parseTheme(url.searchParams.get("theme"));
	const username = normalizeUsername(rawUser);
	const ip = request.headers.get("CF-Connecting-IP") ?? "local";

	if (!(await checkAbuse(env.CITY_CACHE, ip))) {
		const svg = renderFallbackSvg({
			title: "Terlalu banyak permintaan",
			message: "Coba lagi sebentar lagi.",
			status: 429,
		});
		return svgResponse(svg, { status: 429, cacheSeconds: 30 });
	}

	const cache = caches.default;
	const cacheUrl = new URL(url.toString());
	cacheUrl.pathname = `/__cache/${svgCacheKey(username, limit, theme)}`;
	const cacheReq = new Request(cacheUrl.toString(), { method: "GET" });

	const edgeHit = await cache.match(cacheReq);
	if (edgeHit) {
		console.log(JSON.stringify({ event: "cache_hit", layer: "edge", username }));
		if (request.method === "HEAD") {
			return new Response(null, { status: edgeHit.status, headers: edgeHit.headers });
		}
		return edgeHit;
	}

	if (!env.GITHUB_TOKEN) {
		const svg = renderFallbackSvg({
			title: "Konfigurasi belum siap",
			message: "GITHUB_TOKEN belum disetel.",
			status: 503,
		});
		return svgResponse(svg, { status: 503, cacheSeconds: 30 });
	}

	let stale = false;
	let metrics = null as Awaited<ReturnType<typeof fetchCityMetrics>> | null;

	const cached = await getCachedMetrics(env.CITY_CACHE, username);
	if (cached && !cached.stale) {
		console.log(JSON.stringify({ event: "cache_hit", layer: "kv", username }));
		metrics = cached.metrics;
	} else {
		try {
			metrics = await fetchCityMetrics(username, env.GITHUB_TOKEN);
			console.log(JSON.stringify({ event: "cache_miss", username }));
			ctx.waitUntil(putCachedMetrics(env.CITY_CACHE, username, metrics));
		} catch (err) {
			if (err instanceof GitHubError && err.kind === "not_found") {
				const svg = renderFallbackSvg({
					title: "Pengguna tidak ditemukan",
					message: `@${username} tidak ada di GitHub.`,
					status: 404,
				});
				return svgResponse(svg, { status: 404, cacheSeconds: 300 });
			}

			if (cached?.stale) {
				console.log(JSON.stringify({ event: "stale_fallback", username }));
				metrics = cached.metrics;
				stale = true;
			} else {
				const svg = renderFallbackSvg({
					title: "GitHub sedang sibuk",
					message: "Coba lagi nanti.",
					status: 503,
				});
				return svgResponse(svg, { status: 503, cacheSeconds: 60 });
			}
		}
	}

	const city = mapMetricsToCity(metrics!, { limit, theme, stale });
	const svg = renderCitySvg(city);
	const etag = await etagFor(svg);
	const ifNoneMatch = request.headers.get("If-None-Match");
	if (ifNoneMatch && ifNoneMatch === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				"Cache-Control": `public, max-age=${SVG_CACHE_TTL_SECONDS}`,
			},
		});
	}

	const response = svgResponse(svg, {
		cacheSeconds: stale ? 60 : SVG_CACHE_TTL_SECONDS,
		etag,
		extraHeaders: stale ? { "X-Kota-Pixel-Stale": "1" } : undefined,
	});

	if (!stale) {
		ctx.waitUntil(cache.put(cacheReq, response.clone()));
	}

	if (request.method === "HEAD") {
		return new Response(null, { status: response.status, headers: response.headers });
	}
	return response;
}
