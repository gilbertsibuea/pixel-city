import { GITHUB_TIMEOUT_MS } from "../core/config";
import type { CityMetrics } from "../core/types";
import { computeStreak, daysAgoIso, yearsAgoIso } from "./contributions";
import { CITY_METRICS_QUERY } from "./queries";
import { mergeRepositoryMetrics } from "./repository";

export class GitHubError extends Error {
	constructor(
		message: string,
		readonly kind: "not_found" | "rate_limit" | "upstream" | "auth",
		readonly status?: number,
	) {
		super(message);
		this.name = "GitHubError";
	}
}

interface GraphQlPayload {
	data?: {
		user: null | {
			login: string;
			contribYear: {
				commitContributionsByRepository: Array<{
					contributions: { totalCount: number };
					repository: {
						name: string;
						nameWithOwner: string;
						isPrivate: boolean;
						stargazerCount: number;
						primaryLanguage: { name: string; color: string | null } | null;
					};
				}>;
				contributionCalendar: {
					weeks: Array<{
						contributionDays: Array<{ date: string; contributionCount: number }>;
					}>;
				};
			};
			contribMonth: {
				commitContributionsByRepository: Array<{
					contributions: { totalCount: number };
					repository: { nameWithOwner: string };
				}>;
			};
		};
		search: { issueCount: number };
		rateLimit?: { remaining: number; resetAt: string };
	};
	errors?: Array<{ type?: string; message: string }>;
}

export async function fetchCityMetrics(
	username: string,
	token: string,
	now = new Date(),
): Promise<CityMetrics> {
	const to = now.toISOString();
	const fromYear = yearsAgoIso(1, now);
	const fromMonth = daysAgoIso(30, now);
	const mergedSince = daysAgoIso(30, now).slice(0, 10);
	const mergedSearch = `author:${username} is:pr is:merged merged:>=${mergedSince}`;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);

	let response: Response;
	try {
		response = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				"User-Agent": "pixel-cityscape-worker",
				Accept: "application/json",
			},
			body: JSON.stringify({
				query: CITY_METRICS_QUERY,
				variables: {
					login: username,
					fromYear,
					to,
					fromMonth,
					mergedSearch,
				},
			}),
			signal: controller.signal,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "fetch failed";
		throw new GitHubError(message, "upstream");
	} finally {
		clearTimeout(timer);
	}

	if (response.status === 401 || response.status === 403) {
		const remaining = response.headers.get("x-ratelimit-remaining");
		if (remaining === "0" || response.status === 403) {
			throw new GitHubError("GitHub rate limit exceeded", "rate_limit", response.status);
		}
		throw new GitHubError("GitHub authentication failed", "auth", response.status);
	}

	if (!response.ok) {
		throw new GitHubError(`GitHub HTTP ${response.status}`, "upstream", response.status);
	}

	const payload = (await response.json()) as GraphQlPayload;

	if (payload.errors?.length) {
		const notFound = payload.errors.some(
			(e) => e.type === "NOT_FOUND" || /could not resolve/i.test(e.message),
		);
		if (notFound || payload.data?.user === null) {
			throw new GitHubError(`User ${username} not found`, "not_found", 404);
		}
		const rateLimited = payload.errors.some((e) => /rate limit/i.test(e.message));
		if (rateLimited) {
			throw new GitHubError("GitHub GraphQL rate limit", "rate_limit");
		}
		throw new GitHubError(payload.errors[0]?.message ?? "GraphQL error", "upstream");
	}

	const user = payload.data?.user;
	if (!user) {
		throw new GitHubError(`User ${username} not found`, "not_found", 404);
	}

	const days = user.contribYear.contributionCalendar.weeks.flatMap(
		(w) => w.contributionDays,
	);
	const repositories = mergeRepositoryMetrics(
		user.contribYear.commitContributionsByRepository,
		user.contribMonth.commitContributionsByRepository,
	);
	const totalStars = repositories.reduce((sum, r) => sum + r.stars, 0);

	if (payload.data?.rateLimit) {
		console.log(
			JSON.stringify({
				event: "github_rate_limit",
				remaining: payload.data.rateLimit.remaining,
				resetAt: payload.data.rateLimit.resetAt,
			}),
		);
	}

	return {
		username: user.login,
		fetchedAt: now.toISOString(),
		repositories,
		streakDays: computeStreak(days, now.toISOString().slice(0, 10)),
		mergedPrs30d: Math.min(payload.data?.search.issueCount ?? 0, 100),
		totalStars,
	};
}
