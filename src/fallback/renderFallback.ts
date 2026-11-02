import { escapeXml } from "../renderer/escape";

export function renderFallbackSvg(options: {
	title: string;
	message: string;
	status: number;
}): string {
	const title = escapeXml(options.title);
	const message = escapeXml(options.message);
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120" role="img">
<title>${title}</title>
<desc>${message}</desc>
<style>
  .bg { fill: #e8eef6; }
  .ground { fill: #5a8f45; }
  .lbl { fill: #1f2933; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  @media (prefers-color-scheme: dark) {
    .bg { fill: #1a2233; }
    .ground { fill: #2f4a2a; }
    .lbl { fill: #e8eef6; }
  }
</style>
<rect class="bg" width="420" height="120"/>
<rect class="ground" y="88" width="420" height="32"/>
<rect x="40" y="60" width="36" height="28" fill="#a8794a"/>
<rect x="48" y="68" width="8" height="8" fill="#8fb4d6"/>
<rect x="100" y="48" width="28" height="40" fill="#8e9bb0"/>
<text class="lbl" x="160" y="55" font-size="12">${title}</text>
<text class="lbl" x="160" y="74" font-size="10">${message}</text>
</svg>`;
}
