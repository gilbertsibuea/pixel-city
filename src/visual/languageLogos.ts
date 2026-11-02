/**
 * Tiny pixel logos for common languages only.
 * Unknown languages: no logo (window color still applies).
 *
 * Grid size is ~12x12 (Go and PHP are wider because their logos are wordmarks).
 * Most logos are converted from official brand SVGs (simple-icons, devicon) and
 * hand-cleaned; JS, TS, Go, Java, PHP, Ruby and Shell are drawn by hand because
 * their originals rely on tiny letters or details that vanish at this size.
 */
export interface LanguageLogo {
	/** Grid rows; non-`.` drawn with `color` unless char maps in `colors`. */
	rows: string[];
	color: string;
	colors?: Record<string, string>;
}

const LOGOS: Record<string, LanguageLogo> = {
	javascript: {
		rows: ["yyyyyyyyyyyy", "yyyyyyyyyyyy", "yyyyyyyyyyyy", "yyyyyyyyyyyy", "yyyyyyyyyyyy", "yyyyyyyyyyyy", "yyyyyykykkky", "yyyyyykykyyy", "yyyyyykykkky", "yyyykykyyyky", "yyyyykyykkky", "yyyyyyyyyyyy"],
		color: "#f7df1e",
		colors: { "y": "#f7df1e", "k": "#323330" },
	},
	typescript: {
		rows: ["bbbbbbbbbbbb", "bbbbbbbbbbbb", "bbbbbbbbbbbb", "bbbbbbbbbbbb", "bbbbbbbbbbbb", "bbbbbbbbbbbb", "bbbbwwwbwwwb", "bbbbbwbbwbbb", "bbbbbwbbwwwb", "bbbbbwbbbbwb", "bbbbbwbbwwwb", "bbbbbbbbbbbb"],
		color: "#3178c6",
		colors: { "b": "#3178c6", "w": "#ffffff" },
	},
	python: {
		rows: ["............", "....aaaa....", "....aaaa....", "...aaaaaa...", ".aaaaaaabcc.", ".aaaaaaaccc.", ".aaaccccccc.", ".aabccccccc.", "...bccccc...", "....cccc....", "....cccc....", "............"],
		color: "#4682b3",
		colors: { "a": "#4682b3", "b": "#9ca577", "c": "#ffe56b" },
	},
	go: {
		rows: [".....gggg..ggg..", ".gg.g.....g...g.", "ggg.g..gg.g...g.", ".gg.g...g.g...g.", ".....ggg...ggg.."],
		color: "#00add8",
		colors: { "g": "#00add8" },
	},
	rust: {
		rows: ["....aaaa....", "..aaaaaaaa..", ".aa......aa.", ".aaaaaaaaaa.", "aaaaaaaaaaaa", "aa.aaaaaa.aa", "aa.aaaaaa.aa", "aaaaaa.aaaaa", ".aaaaa.aaaa.", ".aaa....aaa.", "..aaaaaaaa..", "....aaaa...."],
		color: "#c23e29",
		colors: { "a": "#c23e29" },
	},
	java: {
		rows: [".....r......", "....r.......", ".....r......", "....r.......", "............", "..bbbbbbbb..", "..bbbbbbbbbb", "..bbbbbbbb.b", "...bbbbbbbbb", "....bbbbbb..", ".bbbbbbbbbb.", "............"],
		color: "#e76f00",
		colors: { "r": "#e76f00", "b": "#5382a1" },
	},
	c: {
		rows: ["....aaaaa...", "..aaaaaaaa..", ".aaaaaaaaaa.", ".aaaa...aaa.", ".aaa....aaa.", "aaaa........", "aaaa........", ".aaa....aaa.", ".aaaa...aaa.", ".aaaaaaaaaa.", "..aaaaaaaa..", "...aaaaaa..."],
		color: "#005798",
		colors: { "a": "#005798" },
	},
	"c++": {
		rows: [".....aa.....", "...aaaaaa...", ".aaaaaaaaaa.", ".aaa....aaa.", ".aa..aa.aaa.", ".aa.aaaaaaa.", ".aa.aaaaaaa.", ".aa..aa.aaa.", ".aaa....aaa.", ".aaaaaaaaaa.", "...aaaaaa...", ".....aa....."],
		color: "#005798",
		colors: { "a": "#005798" },
	},
	"c#": {
		rows: [".....aa.....", "...aaaaaa...", "..aabbbbaa..", ".aabccccbaa.", ".abcbaabbaa.", ".abcaaaaabb.", ".abcaaaaacb.", ".abcaaaabaa.", ".aabccccbaa.", "..aabbbaaa..", "...aaaaaa...", ".....aa....."],
		color: "#964c91",
		colors: { "a": "#964c91", "b": "#c090bd", "c": "#fffeff" },
	},
	ruby: {
		rows: ["............", "..lllrrddd..", ".llrrrrrrddd", "llrrrrrrrrdd", "lrrrrrrrrrrd", ".lrrrrrrrrd.", "..lrrrrrrd..", "...lrrrrd...", "....lrrd....", ".....rd.....", "......d.....", "............"],
		color: "#e8625a",
		colors: { "l": "#e8625a", "r": "#cc342d", "d": "#8f1d1d" },
	},
	php: {
		rows: ["...ppppppppp...", ".ppppppppppppp.", "ppkkkpkpppkkkpp", "ppkpkpkkkpkpkpp", "ppkkkpkpkpkkkpp", "ppkpppkpkpkpppp", ".ppppppppppppp.", "...ppppppppp..."],
		color: "#777bb4",
		colors: { "p": "#777bb4", "k": "#1a1a2e" },
	},
	swift: {
		rows: [".aaaaaaaaaa.", "aaaaaaaaaaaa", "aaaaaaaaaaaa", "aaaaaaaa.aaa", "aaaaaaaa.aaa", "aaaa...a.aaa", "aaaaa.....aa", "aaaaaa....aa", "aaa.......aa", "aaaaa..aaaaa", "aaaaaaaaaaaa", ".aaaaaaaaaa."],
		color: "#e94e36",
		colors: { "a": "#e94e36" },
	},
	kotlin: {
		rows: ["aaaaaaaaaaaa", "aaaaaaaaaaa.", "aaaaaaaaaa..", "aaaaaaaaa...", "aaaaaaaa....", "aaaaaaa.....", "aaaaaaa.....", "aaaaaaaa....", "aaaaaaaaa...", "aaaaaaaaaa..", "aaaaaaaaaaa.", "aaaaaaaaaaaa"],
		color: "#7f52ff",
		colors: { "a": "#7f52ff" },
	},
	html: {
		rows: [".aaaaaaaaaa.", ".aaaaaaaaaa.", ".aa......aa.", ".aa..aaaaaa.", ".aa.aaaaaaa.", ".aa......aa.", ".aaaaaaa.aa.", ".aa.aaaa.aa.", ".aa......aa.", ".aaaaaaaaaa.", "..aaaaaaaa..", "....aaaa...."],
		color: "#e34f26",
		colors: { "a": "#e34f26" },
	},
	css: {
		rows: [".aaaaaaaaaa.", ".aaaaaaaaaa.", ".aabbbbbbca.", ".aacccbbbca.", ".aaaaaccbca.", ".aaacbbbbca.", ".aaaaacbbaa.", ".aabbacbbaa.", ".aabbbbbbaa.", "..aaacccca..", "..aaaacaaa..", "....aaaa...."],
		color: "#1572b6",
		colors: { "a": "#1572b6", "b": "#c3d4e1", "c": "#57b8e2" },
	},
	shell: {
		rows: [".kkkkkkkkkk.", "kkkkkkkkkkkk", "kkkkkkkkkkkk", "kkgkkkkkkkkk", "kkkgkkkkkkkk", "kkkkgkkkkkkk", "kkkgkkkkkkkk", "kkgkkkggggkk", "kkkkkkkkkkkk", "kkkkkkkkkkkk", "kkkkkkkkkkkk", ".kkkkkkkkkk."],
		color: "#3a3f47",
		colors: { "k": "#3a3f47", "g": "#4eaa25" },
	},
	vue: {
		rows: ["............", "aaa......aaa", ".aa......aa.", ".aaa....aaa.", "..aaa..aaa..", "...aa..aa...", "...aaaaaa...", "....aaaa....", "....aaaa....", ".....aa.....", ".....aa.....", "............"],
		color: "#3eb07e",
		colors: { "a": "#3eb07e" },
	},
	dart: {
		rows: [".....aaa....", "...a....a...", "..aaaaaaaa..", ".aaaaaaaaaa.", ".aa.aaaaaaaa", "aaa..aaaaaaa", "aaa...aaaaaa", "aaa....aaaaa", ".aa.....aaaa", "..a......aaa", "...a.....a..", "....aaaaaa.."],
		color: "#016db5",
		colors: { "a": "#016db5" },
	},
	scala: {
		rows: ["........aa..", "..aaaaaaaa..", "..aaaaaaaa..", "..aaaaaaa...", "........aa..", "..aaaaaaaa..", "..aaaaaaaa..", "..aaaaaa....", ".......aaa..", "..aaaaaaaa..", "..aaaaaaaa..", "..aaaaa....."],
		color: "#d12f2d",
		colors: { "a": "#d12f2d" },
	},
};

const ALIASES: Record<string, string> = {
	js: "javascript",
	ts: "typescript",
	py: "python",
	golang: "go",
	"objective-c": "c",
	"objective-c++": "c++",
	cplusplus: "c++",
	csharp: "c#",
	"c sharp": "c#",
	bash: "shell",
	zsh: "shell",
	powershell: "shell",
	html5: "html",
	css3: "css",
	"vue.js": "vue",
	dockerfile: "shell",
};

export function normalizeLanguageKey(name: string | null | undefined): string | null {
	if (!name) return null;
	const key = name.trim().toLowerCase();
	return ALIASES[key] ?? key;
}

export function getLanguageLogo(name: string | null | undefined): LanguageLogo | null {
	const key = normalizeLanguageKey(name);
	if (!key) return null;
	return LOGOS[key] ?? null;
}

export function renderLanguageLogoSvg(
	name: string | null | undefined,
	x: number,
	y: number,
	pixel = 2,
): string {
	const logo = getLanguageLogo(name);
	if (!logo) return "";
	const parts: string[] = [];
	for (let row = 0; row < logo.rows.length; row++) {
		const line = logo.rows[row]!;
		for (let col = 0; col < line.length; col++) {
			const ch = line[col]!;
			if (ch === "." || ch === " ") continue;
			const fill = logo.colors?.[ch] ?? logo.color;
			parts.push(
				`<rect x="${x + col * pixel}" y="${y + row * pixel}" width="${pixel}" height="${pixel}" fill="${fill}"/>`,
			);
		}
	}
	return `<g class="lang-logo" transform="translate(0,0)">${parts.join("")}</g>`;
}

export const COMMON_LANGUAGE_LOGO_IDS = Object.keys(LOGOS);