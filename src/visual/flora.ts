import { PALETTE } from "./buildings/palette";

const S = 3;

export function renderTree(x: number, groundY: number, variant: number): string {
	const v = variant % 3;
	if (v === 1) {
		const trunkH = 5 * S;
		return (
			`<g class="tree" transform="translate(${x},0)">` +
			`<rect x="${S}" y="${groundY - trunkH}" width="${S}" height="${trunkH}" fill="${PALETTE.b}"/>` +
			`<g class="tree-top">` +
			`<rect x="${-S}" y="${groundY - trunkH - 5 * S}" width="${S * 5}" height="${S * 2}" fill="${PALETTE.g}"/>` +
			`<rect x="0" y="${groundY - trunkH - 7 * S}" width="${S * 3}" height="${S * 2}" fill="${PALETTE.g}"/>` +
			`<rect x="${S}" y="${groundY - trunkH - 8 * S}" width="${S}" height="${S}" fill="${PALETTE.g}"/>` +
			`</g></g>`
		);
	}
	if (v === 2) {
		const trunkH = 3 * S;
		return (
			`<g class="tree" transform="translate(${x},0)">` +
			`<rect x="${S}" y="${groundY - trunkH}" width="${S}" height="${trunkH}" fill="${PALETTE.b}"/>` +
			`<g class="tree-top">` +
			`<rect x="0" y="${groundY - trunkH - 3 * S}" width="${S * 3}" height="${S * 3}" fill="#3f7a32"/>` +
			`</g></g>`
		);
	}
	const trunkH = 4 * S;
	const topY = groundY - trunkH - 4 * S;
	return (
		`<g class="tree" transform="translate(${x},0)">` +
		`<rect x="2" y="${groundY - trunkH}" width="${S}" height="${trunkH}" fill="${PALETTE.b}"/>` +
		`<g class="tree-top">` +
		`<rect x="0" y="${topY}" width="${S * 3}" height="${S * 3}" fill="${PALETTE.g}"/>` +
		`<rect x="${S}" y="${topY - S}" width="${S}" height="${S}" fill="${PALETTE.g}"/>` +
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
