/** Escape text for safe inclusion in XML/SVG. */
export function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/** Escape a value used inside a CSS string or attribute context we control. */
export function escapeCssColor(value: string): string {
	const trimmed = value.trim();
	if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
	if (/^rgb(a)?\([\d\s.,%]+\)$/.test(trimmed)) return trimmed;
	return "#c9d1d9";
}
