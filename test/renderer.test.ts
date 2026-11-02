import { describe, expect, it } from "vitest";
import { mapMetricsToCity } from "../src/core/map";
import type { CityMetrics } from "../src/core/types";
import { escapeXml } from "../src/renderer/escape";
import { renderCitySvg } from "../src/renderer/render";
import { renderFallbackSvg } from "../src/fallback/renderFallback";

describe("escapeXml", () => {
	it("escapes special characters", () => {
		expect(escapeXml(`a<b>&"c'`)).toBe("a&lt;b&gt;&amp;&quot;c&apos;");
	});
});

describe("renderCitySvg", () => {
	it("renders deterministic svg under 100KB without scripts", () => {
		const metrics: CityMetrics = {
			username: "gilbertsibuea",
			fetchedAt: "2026-11-02T00:00:00.000Z",
			streakDays: 7,
			mergedPrs30d: 2,
			totalStars: 40,
			repositories: [
				{
					name: "pixel-city",
					nameWithOwner: "gilbertsibuea/pixel-city",
					commits12m: 850,
					commits30d: 12,
					primaryLanguage: "TypeScript",
					languageColor: "#3178c6",
					stars: 12,
				},
				{
					name: "demo<script>",
					nameWithOwner: "gilbertsibuea/demo",
					commits12m: 25,
					commits30d: 1,
					primaryLanguage: null,
					languageColor: null,
					stars: 2,
				},
			],
		};
		const city = mapMetricsToCity(metrics, { limit: 18, theme: "auto" });
		const svg = renderCitySvg(city);
		const again = renderCitySvg(city);
		expect(svg).toBe(again);
		expect(svg.startsWith("<?xml")).toBe(true);
		expect(svg).toContain("<svg");
		expect(svg.toLowerCase()).not.toContain("<script");
		expect(svg).toContain("demo&lt;script&gt;");
		expect(svg).toContain('class="vehicle"');
		expect(svg).toContain("pedestrian");
		expect(svg).toContain("lang-logo");
		expect(new TextEncoder().encode(svg).byteLength).toBeLessThan(100_000);
		expect(svg).toContain("prefers-reduced-motion");
	});

	it("renders a tidy empty city", () => {
		const city = mapMetricsToCity(
			{
				username: "empty",
				fetchedAt: "2026-11-02T00:00:00.000Z",
				streakDays: 0,
				mergedPrs30d: 0,
				totalStars: 0,
				repositories: [],
			},
			{ limit: 18, theme: "light" },
		);
		const svg = renderCitySvg(city);
		expect(svg).toContain("Belum ada bangunan publik");
	});
});

describe("fallback svg", () => {
	it("escapes message text", () => {
		const svg = renderFallbackSvg({
			title: "Error <x>",
			message: 'Bad & "input"',
			status: 400,
		});
		expect(svg).toContain("Error &lt;x&gt;");
		expect(svg).toContain("Bad &amp; &quot;input&quot;");
		expect(svg.toLowerCase()).not.toContain("<script");
	});
});
