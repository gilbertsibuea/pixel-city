import { SVG_CACHE_TTL_SECONDS } from "../core/config";

export function svgResponse(
	svg: string,
	options: {
		status?: number;
		cacheSeconds?: number;
		etag?: string;
		extraHeaders?: Record<string, string>;
	} = {},
): Response {
	const status = options.status ?? 200;
	const cacheSeconds = options.cacheSeconds ?? SVG_CACHE_TTL_SECONDS;
	const headers = new Headers({
		"Content-Type": "image/svg+xml; charset=utf-8",
		"Cache-Control": `public, max-age=${cacheSeconds}`,
		"Access-Control-Allow-Origin": "*",
		...options.extraHeaders,
	});
	if (options.etag) headers.set("ETag", options.etag);
	return new Response(svg, { status, headers });
}

export async function etagFor(svg: string): Promise<string> {
	const data = new TextEncoder().encode(svg);
	const digest = await crypto.subtle.digest("SHA-1", data);
	const hex = [...new Uint8Array(digest)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `"${hex}"`;
}
