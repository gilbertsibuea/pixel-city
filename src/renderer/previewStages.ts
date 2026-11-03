import type { CityModel } from "../core/types";
import { parseTheme, type ThemeMode } from "../core/config";
import { BUILDINGS } from "../visual";
import { renderCitySvg } from "./render";

/**
 * ViewBox width of a typical README city (e.g. /v1/city/… with ~6–10 repos).
 * Stages preview pads to this so width="920" scaling matches the live embed.
 */
const README_CITY_MIN_WIDTH = 560;

/** Dummy city with one finished building per stage — README capture framing. */
export function stagesPreviewModel(theme: ThemeMode = "dark"): CityModel {
	const samples = [
		{
			repoName: "Hut",
			buildingId: "hut" as const,
			languageColor: "#c9d1d9",
			primaryLanguage: null,
		},
		{
			repoName: "House",
			buildingId: "wood-house" as const,
			languageColor: "#3572A5",
			primaryLanguage: null,
		},
		{
			repoName: "Shop",
			buildingId: "stone-shop" as const,
			languageColor: "#f1e05a",
			primaryLanguage: null,
		},
		{
			repoName: "Mid-rise",
			buildingId: "midrise" as const,
			languageColor: "#3178c6",
			primaryLanguage: "TypeScript",
		},
		{
			repoName: "Skyscraper",
			buildingId: "skyscraper" as const,
			languageColor: "#dea584",
			primaryLanguage: "Rust",
		},
		{
			repoName: "Landmark",
			buildingId: "landmark" as const,
			languageColor: "#00add8",
			primaryLanguage: "Go",
		},
	];

	return {
		username: "preview-stages",
		theme,
		buildings: samples.map((s) => ({
			...s,
			litRatio: 0.65,
			smoke: true,
			flag: true,
		})),
		cars: 3,
		buses: 1,
		trees: 6,
		plants: 8,
		streakActive: true,
		generatedAt: new Date(0).toISOString(),
		// Match /v1/city/*.svg README embeds: no captions, same upscale width.
		showBuildingLabels: false,
		minWidth: README_CITY_MIN_WIDTH,
	};
}

export function renderStagesPreviewSvg(themeRaw: string | null): string {
	const theme = parseTheme(themeRaw);
	const model = stagesPreviewModel(theme);
	const ids = new Set(model.buildings.map((b) => b.buildingId));
	for (const sprite of BUILDINGS) {
		if (!ids.has(sprite.id)) {
			model.buildings.push({
				repoName: sprite.name,
				buildingId: sprite.id,
				languageColor: "#c9d1d9",
				primaryLanguage: null,
				litRatio: 0.5,
				smoke: true,
				flag: true,
			});
		}
	}
	return renderCitySvg(model);
}
