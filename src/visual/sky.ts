import { PALETTE } from "./buildings/palette";

const S = 3;

function cloudAt(x: number, y: number, scale = 1, cls = "cloud"): string {
	const w = S * 6 * scale;
	return (
		`<g class="${cls}" opacity="0.9" transform="translate(${x},${y})">` +
		`<rect x="0" y="${S}" width="${w}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`<rect x="${S}" y="0" width="${w - S * 2}" height="${S * 2}" fill="${PALETTE.q}"/>` +
		`</g>`
	);
}

function birdAt(x: number, y: number, delay: number): string {
	return (
		`<g class="bird" style="animation-delay:${delay}s" transform="translate(${x},${y})">` +
		`<rect x="0" y="2" width="3" height="2" fill="#1f2933"/>` +
		`<rect x="3" y="0" width="3" height="2" fill="#1f2933"/>` +
		`<rect x="6" y="2" width="3" height="2" fill="#1f2933"/>` +
		`</g>`
	);
}

function stars(width: number, count: number): string {
	const parts: string[] = [];
	for (let i = 0; i < count; i++) {
		const x = 12 + ((i * 97) % Math.max(width - 24, 1));
		const y = 8 + ((i * 53) % 36);
		const delay = (i % 5) * 0.35;
		parts.push(
			`<rect class="star" style="animation-delay:${delay}s" x="${x}" y="${y}" width="2" height="2" fill="#f4f0cf"/>`,
		);
	}
	return parts.join("");
}

function balloons(width: number): string {
	const colors = ["#d94f4f", "#4a7fc0", "#c9a24d"];
	return colors
		.map((c, i) => {
			const x = Math.floor(width * (0.25 + i * 0.2));
			return (
				`<g class="balloon" style="animation-delay:${i}s" transform="translate(${x},18)">` +
				`<rect x="0" y="0" width="6" height="8" fill="${c}"/>` +
				`<rect x="2" y="8" width="2" height="8" fill="#888"/>` +
				`</g>`
			);
		})
		.join("");
}

export function renderSkyDecor(options: {
	width: number;
	theme: "auto" | "light" | "dark";
}): string {
	const { width, theme } = options;
	const sun =
		`<g class="sun"><circle cx="36" cy="22" r="10" fill="${PALETTE.y}"/>` +
		`<rect x="34" y="4" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="34" y="36" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="12" y="20" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`<rect x="56" y="20" width="4" height="4" fill="${PALETTE.y}" opacity="0.7"/>` +
		`</g>`;
	const moon =
		`<g class="moon">` +
		`<circle cx="${width - 40}" cy="22" r="10" fill="${PALETTE.f}"/>` +
		`<circle cx="${width - 34}" cy="18" r="8" fill="#1a2233"/>` +
		`</g>`;

	const daySky =
		`<g class="light-only">` +
		sun +
		cloudAt(70, 12, 1, "cloud") +
		cloudAt(Math.floor(width * 0.35), 20, 1.2, "cloud-alt") +
		cloudAt(Math.floor(width * 0.62), 10, 0.9, "cloud") +
		cloudAt(Math.floor(width * 0.8), 24, 1.1, "cloud-alt") +
		birdAt(40, 34, 0) +
		birdAt(Math.floor(width * 0.3), 28, 3) +
		birdAt(Math.floor(width * 0.55), 18, 6) +
		balloons(width) +
		`</g>`;

	const nightSky =
		`<g class="dark-only">` +
		moon +
		stars(width, Math.max(14, Math.floor(width / 28))) +
		cloudAt(80, 16, 1, "cloud") +
		cloudAt(Math.floor(width * 0.5), 22, 1.1, "cloud-alt") +
		`<g class="balloon" style="animation-delay:1s" transform="translate(${Math.floor(width * 0.4)},20)">` +
		`<rect width="6" height="8" fill="#7eb6ff"/><rect x="2" y="8" width="2" height="8" fill="#888"/>` +
		`</g>` +
		`</g>`;

	if (theme === "light") {
		return daySky.replace(/class="light-only"/, 'class="sky-layer"');
	}
	if (theme === "dark") {
		return nightSky.replace(/class="dark-only"/, 'class="sky-layer"');
	}
	return daySky + nightSky;
}
