/**
 * Write LinkedIn showcase SVGs (light + dark) into public/.
 *   npx tsx scripts/render-linkedin-sheets.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { renderLinkedInStagesSvg } from "../src/renderer/linkedinSheet.ts";

mkdirSync("public", { recursive: true });
for (const theme of ["light", "dark"] as const) {
	const svg = renderLinkedInStagesSvg(theme);
	const path = `public/linkedin-stages-${theme}.svg`;
	writeFileSync(path, svg);
	const w = svg.match(/width="(\d+)"/)?.[1];
	const h = svg.match(/height="(\d+)"/)?.[1];
	console.log("wrote", path, Buffer.byteLength(svg), "bytes", `${w}x${h}`);
}
