import type { CityModel } from "../core/types";
import { parseTheme, type ThemeMode } from "../core/config";
import { BUILDINGS } from "../visual";
import { renderCitySvg } from "./render";

/** Dummy city with one building per stage so every sprite can be previewed. */
export function stagesPreviewModel(theme: ThemeMode = "light"): CityModel {
	const samples = [
		{
			repoName: "Gubuk (1–19)",
			buildingId: "hut" as const,
			languageColor: "#c9d1d9",
			primaryLanguage: null,
		},
		{
			repoName: "Rumah kayu (20–99)",
			buildingId: "wood-house" as const,
			languageColor: "#3572A5",
			primaryLanguage: null,
		},
		{
			repoName: "Toko batu (100–299)",
			buildingId: "stone-shop" as const,
			languageColor: "#f1e05a",
			primaryLanguage: null,
		},
		{
			repoName: "Gedung (300–799)",
			buildingId: "midrise" as const,
			languageColor: "#3178c6",
			primaryLanguage: "TypeScript",
		},
		{
			repoName: "Pencakar langit (800+)",
			buildingId: "skyscraper" as const,
			languageColor: "#dea584",
			primaryLanguage: "Rust",
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
		buses: 2,
		trees: 8,
		plants: 10,
		streakActive: true,
		generatedAt: new Date(0).toISOString(),
		showBuildingLabels: true,
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
