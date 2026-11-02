import type { BuildingId } from "./buildings/types";
import { PALETTE } from "./buildings/palette";

function hashString(input: string): number {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

export type BuilderVariant = "hammer" | "carry" | "scaffold" | "weld";

export interface BuilderPlan {
	id: string;
	x: number;
	groundY: number;
	delaySec: number;
	variant: BuilderVariant;
	/** Horizontal walk amplitude for carry (px). */
	walkPx: number;
}

/** How many builders appear per construction target. */
export const BUILDERS_PER_TARGET: Readonly<Record<BuildingId, number>> = {
	hut: 0,
	"wood-house": 2,
	"stone-shop": 2,
	midrise: 3,
	skyscraper: 4,
	landmark: 5,
};

const VARIANTS: BuilderVariant[] = ["hammer", "carry", "scaffold", "weld"];

/**
 * Deterministic builder placements from repo seed.
 * Some stand on the ground; some sit on scaffold plank rows when available.
 */
export function planBuilders(options: {
	target: BuildingId;
	seed: string;
	originX: number;
	groundY: number;
	spriteWidthPx: number;
	scale: number;
	scaffoldRows: number[];
	spriteTopY: number;
}): BuilderPlan[] {
	const count = BUILDERS_PER_TARGET[options.target] ?? 0;
	const plans: BuilderPlan[] = [];
	if (count <= 0) return plans;

	const { seed, originX, groundY, spriteWidthPx, scale, scaffoldRows, spriteTopY } =
		options;

	for (let i = 0; i < count; i++) {
		const h = hashString(`${seed}:builder:${i}`);
		const variant = VARIANTS[(h + i) % VARIANTS.length]!;
		const onScaffold =
			variant === "scaffold" && scaffoldRows.length > 0
				? true
				: scaffoldRows.length > 0 && i % 3 === 0;

		let y = groundY;
		if (onScaffold && scaffoldRows.length > 0) {
			const row = scaffoldRows[(h >>> 3) % scaffoldRows.length]!;
			y = spriteTopY + (row + 1) * scale;
		}

		const t = ((h >>> 8) % 1000) / 1000;
		const margin = scale * 2;
		const span = Math.max(scale, spriteWidthPx - margin * 2 - scale * 3);
		const x = Math.round(originX + margin + t * span);
		const walkPx = 6 + ((h >>> 16) % 5);

		plans.push({
			id: `bld-${i}`,
			x,
			groundY: y,
			delaySec: ((h >>> 4) % 50) / 10,
			variant: onScaffold ? "scaffold" : variant,
			walkPx,
		});
	}
	return plans;
}

/** ~3×6 px worker: helmet, vest, legs. Two frames via CSS on arm/spark. */
export function renderBuilder(plan: BuilderPlan): string {
	const px = 2;
	const gy = plan.groundY;
	const x = plan.x;
	const hat = PALETTE.H!;
	const vest = PALETTE.V!;
	const skin = PALETTE.F!;
	const pants = "#2a2a32";
	const delay = `animation-delay:${plan.delaySec}s`;

	const body =
		`<rect x="${x + px}" y="${gy - 6 * px}" width="${px}" height="${px}" fill="${hat}"/>` +
		`<rect x="${x + px}" y="${gy - 5 * px}" width="${px}" height="${px}" fill="${skin}"/>` +
		`<rect x="${x}" y="${gy - 4 * px}" width="${px * 3}" height="${px * 2}" fill="${vest}"/>` +
		`<rect x="${x + px}" y="${gy - 2 * px}" width="${px}" height="${px * 2}" fill="${pants}"/>`;

	if (plan.variant === "hammer") {
		return (
			`<g class="builder builder-hammer" style="${delay}">` +
			body +
			`<rect class="builder-arm" x="${x + 3 * px}" y="${gy - 4 * px}" width="${px}" height="${px * 2}" fill="${skin}"/>` +
			`<rect class="builder-arm" x="${x + 3 * px}" y="${gy - 5 * px}" width="${px}" height="${px}" fill="#6b6f78"/>` +
			`</g>`
		);
	}

	if (plan.variant === "carry") {
		return (
			`<g class="builder builder-carry" style="${delay};--walk:${plan.walkPx}px">` +
			body +
			`<rect x="${x - px}" y="${gy - 4 * px}" width="${px * 5}" height="${px}" fill="${PALETTE.P}"/>` +
			`</g>`
		);
	}

	if (plan.variant === "weld") {
		return (
			`<g class="builder builder-weld" style="${delay}">` +
			body +
			`<rect class="builder-spark" x="${x + 3 * px}" y="${gy - 3 * px}" width="${px}" height="${px}" fill="#fff3b0"/>` +
			`</g>`
		);
	}

	// scaffold idle
	return `<g class="builder builder-scaffold" style="${delay}">${body}</g>`;
}

export function renderCraneHook(
	originX: number,
	originY: number,
	col: number,
	row: number,
	scale: number,
): string {
	const x = originX + col * scale + Math.floor(scale / 4);
	const y = originY + (row + 1) * scale;
	const w = Math.max(2, Math.floor(scale / 2));
	return (
		`<g class="hook" transform="translate(${x},${y})">` +
		`<rect x="0" y="0" width="${Math.max(1, Math.floor(w / 2))}" height="${scale}" fill="#6b6f78"/>` +
		`<rect x="${-w}" y="${scale}" width="${w * 2}" height="${w}" fill="${PALETTE.X}"/>` +
		`</g>`
	);
}

/** CSS for builder + crane hook animations (stepped). */
export function builderAnimationsCss(): string {
	return `
@keyframes builder-hammer {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0, 0); }
}
@keyframes builder-arm-swing {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-35deg); }
}
@keyframes builder-carry {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(var(--walk, 8px)); }
}
@keyframes builder-spark {
  0%, 70%, 100% { opacity: 1; }
  80% { opacity: 0.1; }
}
@keyframes hook-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
.builder-hammer .builder-arm {
  transform-box: fill-box;
  transform-origin: top center;
  animation: builder-arm-swing 0.8s steps(2) infinite;
}
.builder-carry { animation: builder-carry 2.4s steps(6) infinite alternate; }
.builder-spark { animation: builder-spark 0.6s steps(2) infinite; }
.hook { animation: hook-bob 1.6s steps(4) infinite; }

@media (prefers-reduced-motion: reduce) {
  .builder-hammer .builder-arm, .builder-carry, .builder-spark, .hook { animation: none !important; }
}
`;
}
