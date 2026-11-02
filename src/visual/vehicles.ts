import { PALETTE } from "./buildings/palette";

const S = 3;

export function renderCar(y: number, color: string, delaySec: number, rev = false): string {
	const cls = rev ? "vehicle rev" : "vehicle";
	return (
		`<g class="${cls}" style="animation-delay:${delaySec}s">` +
		`<rect x="0" y="${y}" width="${S * 5}" height="${S * 2}" fill="${color}"/>` +
		`<rect x="${S}" y="${y - S}" width="${S * 3}" height="${S}" fill="#dce6f0"/>` +
		`<rect x="${S}" y="${y + S * 2}" width="${S}" height="${S}" fill="${PALETTE.n}"/>` +
		`<rect x="${S * 3}" y="${y + S * 2}" width="${S}" height="${S}" fill="${PALETTE.n}"/>` +
		`</g>`
	);
}

export function renderBus(y: number, delaySec: number, rev = false): string {
	const cls = rev ? "vehicle rev" : "vehicle";
	return (
		`<g class="${cls}" style="animation-delay:${delaySec}s">` +
		`<rect x="0" y="${y - S}" width="${S * 9}" height="${S * 3}" fill="#e6a817"/>` +
		`<rect x="${S}" y="${y - S * 2}" width="${S * 2}" height="${S}" fill="#dce6f0"/>` +
		`<rect x="${S * 4}" y="${y - S * 2}" width="${S * 2}" height="${S}" fill="#dce6f0"/>` +
		`<rect x="${S * 7}" y="${y - S * 2}" width="${S}" height="${S}" fill="#dce6f0"/>` +
		`<rect x="${S}" y="${y + S * 2}" width="${S}" height="${S}" fill="${PALETTE.n}"/>` +
		`<rect x="${S * 4}" y="${y + S * 2}" width="${S}" height="${S}" fill="${PALETTE.n}"/>` +
		`<rect x="${S * 7}" y="${y + S * 2}" width="${S}" height="${S}" fill="${PALETTE.n}"/>` +
		`<rect x="${S * 8}" y="${y}" width="${S}" height="${S}" fill="#f4f0cf"/>` +
		`</g>`
	);
}
