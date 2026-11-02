#!/usr/bin/env python3
"""Render public/construction-sheet.png from construction-dump.json at 8× scale."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DUMP = ROOT / "public" / "construction-dump.json"
OUT = ROOT / "public" / "construction-sheet.png"

data = json.loads(DUMP.read_text())
PALETTE = data["palette"]
SCALE = int(data["scale"])
GAP = 16
LABEL_H = 16


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def draw_rows(rows, builders=None, hook=None) -> Image.Image:
    h = len(rows)
    w = len(rows[0])
    img = Image.new("RGB", (w * SCALE, h * SCALE), (238, 243, 248))
    px = img.load()
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch == ".":
                continue
            color = PALETTE.get(ch)
            if not color:
                if ch == "A":
                    color = "#ffd84a"
                else:
                    continue
            rgb = hex_to_rgb(color)
            x0, y0 = c * SCALE, r * SCALE
            for dy in range(SCALE):
                for dx in range(SCALE):
                    px[x0 + dx, y0 + dy] = rgb

    draw = ImageDraw.Draw(img)
    if builders:
        hat = hex_to_rgb(PALETTE["H"])
        vest = hex_to_rgb(PALETTE["V"])
        skin = hex_to_rgb(PALETTE["F"])
        pants = (42, 42, 50)
        bp = 2
        for b in builders:
            x = int(b.get("x") or 0)
            gy = int(b.get("groundY") or img.height)
            draw.rectangle([x + bp, gy - 6 * bp, x + 2 * bp - 1, gy - 5 * bp - 1], fill=hat)
            draw.rectangle([x + bp, gy - 5 * bp, x + 2 * bp - 1, gy - 4 * bp - 1], fill=skin)
            draw.rectangle([x, gy - 4 * bp, x + 3 * bp - 1, gy - 2 * bp - 1], fill=vest)
            draw.rectangle([x + bp, gy - 2 * bp, x + 2 * bp - 1, gy - 1], fill=pants)
    if hook:
        hx = hook["col"] * SCALE + SCALE // 4
        hy = (hook["row"] + 1) * SCALE
        steel = hex_to_rgb(PALETTE["Q"])
        crane = hex_to_rgb(PALETTE["X"])
        draw.rectangle([hx, hy, hx + max(1, SCALE // 4), hy + SCALE], fill=steel)
        draw.rectangle(
            [hx - SCALE // 2, hy + SCALE, hx + SCALE // 2, hy + SCALE + max(2, SCALE // 2)],
            fill=crane,
        )
    return img


tiles: list[list[tuple[str, str, Image.Image]]] = []
max_w = max_h = 0
for cell in data["cells"]:
    row_tiles = []
    for v in cell["variants"]:
        img = draw_rows(v["rows"], v.get("builders"), v.get("hook"))
        row_tiles.append((cell["id"], v["label"], img))
        max_w = max(max_w, img.width)
        max_h = max(max_h, img.height)
    tiles.append(row_tiles)

cols = 4
cell_w = max_w + GAP
cell_h = max_h + LABEL_H + GAP
W = GAP + cols * cell_w
H = GAP + len(tiles) * cell_h
canvas = Image.new("RGB", (W, H), (18, 24, 38))
draw = ImageDraw.Draw(canvas)

for ri, row in enumerate(tiles):
    for ci, (bid, label, img) in enumerate(row):
        x0 = GAP + ci * cell_w
        # Bottom-align so tall towers and short houses share a ground line.
        y0 = GAP + ri * cell_h + LABEL_H + (max_h - img.height)
        bar = (255, 210, 63) if label == "finished" else (240, 138, 36)
        draw.rectangle([x0, GAP + ri * cell_h, x0 + min(cell_w - 4, 120), GAP + ri * cell_h + 10], fill=bar)
        canvas.paste(img, (x0, y0))

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, format="PNG", optimize=True)
print(f"wrote {OUT} ({W}x{H})")
