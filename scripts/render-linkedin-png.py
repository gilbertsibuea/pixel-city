#!/usr/bin/env python3
"""Rasterize LinkedIn stage sheets (light + dark) from linkedin-dump.json."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DUMP = ROOT / "public" / "linkedin-dump.json"
data = json.loads(DUMP.read_text())
PALETTE = data["palette"]
S = int(data["scale"])
COLS = 4
PAD = 32
GAP_X = 18
GAP_Y = 20
ROW_TITLE_W = 158
HEADER_H = 78
FOOTER_H = 40
PANEL_PAD_X = 10
PANEL_PAD_BOTTOM = 12


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


THEMES = {
    "light": dict(
        bg=(238, 243, 248),
        panel=(255, 255, 255),
        border=(213, 222, 232),
        title=(15, 23, 42),
        sub=(71, 85, 105),
        muted=(100, 116, 139),
        accent=(234, 88, 12),
        ground=(90, 143, 69),
        chip=(255, 247, 237),
        chip_text=(154, 52, 18),
        rule=(203, 213, 225),
    ),
    "dark": dict(
        bg=(11, 18, 32),
        panel=(21, 29, 46),
        border=(42, 53, 72),
        title=(241, 245, 249),
        sub=(148, 163, 184),
        muted=(100, 116, 139),
        accent=(251, 146, 60),
        ground=(47, 74, 42),
        chip=(59, 34, 16),
        chip_text=(253, 186, 116),
        rule=(51, 65, 85),
    ),
}


def draw_sprite(rows, builders, hook, lit: bool) -> Image.Image:
    if not rows:
        return Image.new("RGB", (40, 40), (0, 0, 0))
    h, w = len(rows), len(rows[0])
    img = Image.new("RGB", (w * S, h * S), (238, 243, 248))
    px = img.load()
    win = hex_rgb("#c9d1d9") if lit else hex_rgb(PALETTE.get("w", "#8fb4d6"))
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch == ".":
                continue
            if ch == "w":
                color = win
            elif ch == "A":
                color = (255, 216, 74)
            else:
                hexv = PALETTE.get(ch)
                if not hexv:
                    continue
                color = hex_rgb(hexv)
            x0, y0 = c * S, r * S
            for dy in range(S):
                for dx in range(S):
                    px[x0 + dx, y0 + dy] = color
    draw = ImageDraw.Draw(img)
    if builders:
        hat, vest, skin, pants = hex_rgb(PALETTE["H"]), hex_rgb(PALETTE["V"]), hex_rgb(PALETTE["F"]), (42, 42, 50)
        bp = 2
        for b in builders:
            x, gy = int(b["x"]), int(b["groundY"])
            draw.rectangle([x + bp, gy - 6 * bp, x + 2 * bp - 1, gy - 5 * bp - 1], fill=hat)
            draw.rectangle([x + bp, gy - 5 * bp, x + 2 * bp - 1, gy - 4 * bp - 1], fill=skin)
            draw.rectangle([x, gy - 4 * bp, x + 3 * bp - 1, gy - 2 * bp - 1], fill=vest)
            draw.rectangle([x + bp, gy - 2 * bp, x + 2 * bp - 1, gy - 1], fill=pants)
    if hook:
        hx = hook["col"] * S + S // 4
        hy = (hook["row"] + 1) * S
        draw.rectangle([hx, hy, hx + max(1, S // 4), hy + S], fill=hex_rgb(PALETTE["Q"]))
        draw.rectangle([hx - S // 2, hy + S, hx + S // 2, hy + S + max(2, S // 2)], fill=hex_rgb(PALETTE["X"]))
    return img


def render(theme: str) -> Path:
    C = THEMES[theme]
    # Pre-render sprites
    prepared = []
    max_w = 0
    for row in data["rows"]:
        sprites = []
        max_h = 0
        for i, v in enumerate(row["variants"]):
            if v["kind"] == "empty":
                sprites.append(None)
                continue
            sp = draw_sprite(v["rows"], v.get("builders"), v.get("hook"), lit=(v["kind"] == "finished"))
            # Transparent-ish: recolor bg of sprite to panel later via paste on panel
            sprites.append(sp)
            max_w = max(max_w, sp.width)
            max_h = max(max_h, sp.height)
        if max_h == 0:
            max_h = 40
        prepared.append((row, sprites, max_h))

    cell_w = max_w + PANEL_PAD_X * 2
    row_heights = [h + 14 + PANEL_PAD_BOTTOM + 16 for _, _, h in prepared]
    grid_w = ROW_TITLE_W + COLS * (cell_w + GAP_X) - GAP_X
    W = max(1100, PAD * 2 + grid_w)
    grid_h = sum(row_heights) + GAP_Y * (len(prepared) - 1)
    H = PAD + HEADER_H + grid_h + FOOTER_H + PAD

    canvas = Image.new("RGB", (W, H), C["bg"])
    draw = ImageDraw.Draw(canvas)
    try:
        font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except Exception:
        font_lg = font = font_sm = ImageFont.load_default()

    draw.text((PAD, PAD + 8), "Pixel Cityscape", fill=C["title"], font=font_lg)
    draw.text((PAD, PAD + 42), "Semua tahap bangunan — finished & under construction", fill=C["sub"], font=font)
    chip = [W - PAD - 92, PAD + 16, W - PAD, PAD + 44]
    draw.rounded_rectangle(chip, radius=6, fill=C["chip"])
    tw = draw.textlength(theme.upper(), font=font)
    draw.text((W - PAD - 46 - tw / 2, PAD + 22), theme.upper(), fill=C["chip_text"], font=font)
    draw.line([(PAD, PAD + HEADER_H - 18), (W - PAD, PAD + HEADER_H - 18)], fill=C["rule"], width=1)

    for ci, label in enumerate(data["colLabels"]):
        ox = PAD + ROW_TITLE_W + ci * (cell_w + GAP_X)
        tw = draw.textlength(label, font=font_sm)
        draw.text((ox + cell_w / 2 - tw / 2, PAD + HEADER_H - 16), label, fill=C["muted"], font=font_sm)

    y = PAD + HEADER_H
    for (row, sprites, max_h), cell_h in zip(prepared, row_heights):
        name = row["name"]
        draw.text((PAD, y + 8), name["id"], fill=C["title"], font=font)
        draw.text((PAD, y + 28), name["en"], fill=C["muted"], font=font_sm)
        draw.text((PAD, y + 46), f"{name['range']} commits", fill=C["accent"], font=font_sm)

        for ci, sp in enumerate(sprites):
            ox = PAD + ROW_TITLE_W + ci * (cell_w + GAP_X)
            draw.rounded_rectangle([ox, y, ox + cell_w, y + cell_h], radius=10, fill=C["panel"], outline=C["border"])
            if sp is None:
                tw = draw.textlength("n/a", font=font)
                draw.text((ox + cell_w / 2 - tw / 2, y + cell_h / 2 - 6), "n/a", fill=C["muted"], font=font)
                continue
            ground_y = y + cell_h - PANEL_PAD_BOTTOM
            sprite_top = ground_y - sp.height
            sprite_left = ox + (cell_w - sp.width) // 2
            draw.rounded_rectangle([ox + 8, ground_y - 3, ox + cell_w - 8, ground_y + 3], radius=2, fill=C["ground"])
            # Replace sprite paper bg with panel color
            sp2 = sp.copy()
            px = sp2.load()
            paper = (238, 243, 248)
            for yy in range(sp2.height):
                for xx in range(sp2.width):
                    if px[xx, yy] == paper:
                        px[xx, yy] = C["panel"]
            canvas.paste(sp2, (sprite_left, sprite_top))
        y += cell_h + GAP_Y

    draw.text(
        (PAD, H - PAD - 8),
        "Commits (12 bulan) → tahap bangunan · konstruksi mulai ±70% menuju tahap berikutnya · hut tidak punya fase bangun",
        fill=C["muted"],
        font=font_sm,
    )
    out = ROOT / "public" / f"linkedin-stages-{theme}.png"
    canvas.save(out, format="PNG", optimize=True)
    print(f"wrote {out} ({W}x{H})")
    return out


for t in ("light", "dark"):
    render(t)
