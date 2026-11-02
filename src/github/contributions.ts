export interface ContributionDay {
	date: string;
	contributionCount: number;
}

/** Streak of consecutive days with contributions, ending on `asOf` (UTC date YYYY-MM-DD). */
export function computeStreak(
	days: ContributionDay[],
	asOf: string = new Date().toISOString().slice(0, 10),
): number {
	const byDate = new Map(days.map((d) => [d.date, d.contributionCount]));
	let streak = 0;
	const cursor = new Date(`${asOf}T00:00:00Z`);

	// If today has zero, start from yesterday (streak can still be "current" overnight).
	const todayCount = byDate.get(asOf) ?? 0;
	if (todayCount === 0) {
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}

	for (;;) {
		const key = cursor.toISOString().slice(0, 10);
		const count = byDate.get(key) ?? 0;
		if (count <= 0) break;
		streak += 1;
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}
	return streak;
}

export function daysAgoIso(days: number, now = new Date()): string {
	const d = new Date(now);
	d.setUTCDate(d.getUTCDate() - days);
	return d.toISOString();
}

export function yearsAgoIso(years: number, now = new Date()): string {
	const d = new Date(now);
	d.setUTCFullYear(d.getUTCFullYear() - years);
	return d.toISOString();
}
