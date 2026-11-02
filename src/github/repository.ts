import type { RepositoryMetric } from "../core/types";

interface GhLanguage {
	name: string;
	color: string | null;
}

interface GhRepo {
	name: string;
	nameWithOwner: string;
	isPrivate: boolean;
	stargazerCount: number;
	primaryLanguage: GhLanguage | null;
}

interface GhCommitByRepo {
	contributions: { totalCount: number };
	repository: GhRepo | { nameWithOwner: string };
}

export function mergeRepositoryMetrics(
	yearRows: GhCommitByRepo[],
	monthRows: GhCommitByRepo[],
): RepositoryMetric[] {
	const monthMap = new Map<string, number>();
	for (const row of monthRows) {
		monthMap.set(row.repository.nameWithOwner, row.contributions.totalCount);
	}

	const out: RepositoryMetric[] = [];
	for (const row of yearRows) {
		const repo = row.repository as GhRepo;
		if (repo.isPrivate) continue;
		if (!repo.name || !repo.nameWithOwner) continue;
		out.push({
			name: repo.name,
			nameWithOwner: repo.nameWithOwner,
			commits12m: row.contributions.totalCount,
			commits30d: monthMap.get(repo.nameWithOwner) ?? 0,
			primaryLanguage: repo.primaryLanguage?.name ?? null,
			languageColor: repo.primaryLanguage?.color ?? null,
			stars: repo.stargazerCount ?? 0,
		});
	}
	return out;
}
