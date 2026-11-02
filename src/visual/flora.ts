import { PALETTE } from "./buildings/palette";

const S = 4;

/**
 * Trees are drawn so foliage sits flush on / slightly overlapping the trunk.
 * Trunk top Y always equals foliage bottom Y (no floating canopy gap).
 */
export function renderTree(x: number, groundY: number, variant: number): string {
	const v = variant % 3;
	const trunkX = S;

	if (v === 1) {
		// Tall pine: stacked foliage resting on trunk
		const trunkH = 4 * S;
		const trunkTop = groundY - trunkH;
		return (
			`<g class="tree" transform="translate(${x},0)">` +
			`<rect x="${trunkX}" y="${trunkTop}" width="${S}" height="${trunkH}" fill="${PALETTE.b}"/>` +
			`<g class="tree-top">` +
			`<rect x="${-S}" y="${trunkTop - 2 * S}" width="${S * 5}" height="${S * 2}" fill="${PALETTE.g}"/>` +
			`<rect x="0" y="${trunkTop - 4 * S}" width="${S * 3}" height="${S * 2}" fill="${PALETTE.g}"/>` +
			`<rect x="${S}" y="${trunkTop - 5 * S}" width="${S}" height="${S}" fill="${PALETTE.g}"/>` +
			`</g></g>`
		);
	}

	if (v === 2) {
		// Round canopy flush on short trunk
		const trunkH = 3 * S;
		const trunkTop = groundY - trunkH;
		return (
			`<g class="tree" transform="translate(${x},0)">` +
			`<rect x="${trunkX}" y="${trunkTop}" width="${S}" height="${trunkH}" fill="${PALETTE.b}"/>` +
			`<g class="tree-top">` +
			`<rect x="0" y="${trunkTop - 3 * S}" width="${S * 3}" height="${S * 3}" fill="#3f7a32"/>` +
			`<rect x="${S}" y="${trunkTop - 4 * S}" width="${S}" height="${S}" fill="#3f7a32"/>` +
			`</g></g>`
		);
	}

	// Default: block canopy overlapping trunk by 1px-row
	const trunkH = 4 * S;
	const trunkTop = groundY - trunkH;
	return (
		`<g class="tree" transform="translate(${x},0)">` +
		`<rect x="${trunkX}" y="${trunkTop}" width="${S}" height="${trunkH}" fill="${PALETTE.b}"/>` +
		`<g class="tree-top">` +
		`<rect x="0" y="${trunkTop - 2 * S}" width="${S * 3}" height="${S * 3}" fill="${PALETTE.g}"/>` +
		`<rect x="${S}" y="${trunkTop - 3 * S}" width="${S}" height="${S}" fill="${PALETTE.g}"/>` +
		`</g></g>`
	);
}

export function renderBush(x: number, groundY: number, variant: number): string {
	const color = variant % 2 === 0 ? PALETTE.g : "#3d6e30";
	return (
		`<g class="bush" transform="translate(${x},${groundY - S * 2})">` +
		`<rect x="0" y="${S}" width="${S * 4}" height="${S}" fill="${color}"/>` +
		`<rect x="${S}" y="0" width="${S * 2}" height="${S}" fill="${color}"/>` +
		`</g>`
	);
}

export function renderFlower(x: number, groundY: number, variant: number): string {
	const petal = ["#e85d75", "#f0c14a", "#7eb6ff"][variant % 3]!;
	return (
		`<g class="flower" transform="translate(${x},${groundY - S * 3})">` +
		`<rect x="${S}" y="${S * 2}" width="2" height="${S}" fill="${PALETTE.g}"/>` +
		`<rect x="${S}" y="${S}" width="${S}" height="${S}" fill="${petal}"/>` +
		`<rect x="0" y="${S}" width="${S}" height="${S}" fill="${petal}" opacity="0.85"/>` +
		`<rect x="${S * 2}" y="${S}" width="${S}" height="${S}" fill="${petal}" opacity="0.85"/>` +
		`<rect x="${S}" y="0" width="${S}" height="${S}" fill="${petal}" opacity="0.85"/>` +
		`</g>`
	);
}
