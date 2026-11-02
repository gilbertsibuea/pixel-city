import { describe, expect, it } from "vitest";
import { computeStreak } from "../src/github/contributions";
import { mergeRepositoryMetrics } from "../src/github/repository";

describe("computeStreak", () => {
	it("counts consecutive days ending today", () => {
		const days = [
			{ date: "2026-10-30", contributionCount: 1 },
			{ date: "2026-10-31", contributionCount: 2 },
			{ date: "2026-11-01", contributionCount: 1 },
			{ date: "2026-11-02", contributionCount: 3 },
		];
		expect(computeStreak(days, "2026-11-02")).toBe(4);
	});

	it("falls back to yesterday when today is empty", () => {
		const days = [
			{ date: "2026-10-31", contributionCount: 1 },
			{ date: "2026-11-01", contributionCount: 2 },
			{ date: "2026-11-02", contributionCount: 0 },
		];
		expect(computeStreak(days, "2026-11-02")).toBe(2);
	});

	it("breaks on a zero day", () => {
		const days = [
			{ date: "2026-10-31", contributionCount: 1 },
			{ date: "2026-11-01", contributionCount: 0 },
			{ date: "2026-11-02", contributionCount: 4 },
		];
		expect(computeStreak(days, "2026-11-02")).toBe(1);
	});
});

describe("mergeRepositoryMetrics", () => {
	it("joins 12m and 30d commits and skips private repos", () => {
		const merged = mergeRepositoryMetrics(
			[
				{
					contributions: { totalCount: 40 },
					repository: {
						name: "pub",
						nameWithOwner: "u/pub",
						isPrivate: false,
						stargazerCount: 3,
						primaryLanguage: { name: "TypeScript", color: "#3178c6" },
					},
				},
				{
					contributions: { totalCount: 99 },
					repository: {
						name: "secret",
						nameWithOwner: "u/secret",
						isPrivate: true,
						stargazerCount: 0,
						primaryLanguage: null,
					},
				},
			],
			[
				{
					contributions: { totalCount: 7 },
					repository: { nameWithOwner: "u/pub" },
				},
			],
		);
		expect(merged).toHaveLength(1);
		expect(merged[0]?.commits12m).toBe(40);
		expect(merged[0]?.commits30d).toBe(7);
		expect(merged[0]?.languageColor).toBe("#3178c6");
	});
});
