#!/usr/bin/env python3
"""Composite the copy-stand plate for the Verso object-record canvas.

Sources, both Cleveland Museum of Art open access, licence CC0:
  1927.220  tin-glazed tile, shot on a white sweep with its own contact shadow
  2023.15   etching on antique laid paper -- a blank margin patch supplies the
            accession label's paper, so the label is photographed stock rather
            than a drawn rectangle

The tile's own white ground is extended to fill the canvas. Nothing on the
plate is drawn except the typewriting on the label, which is set in Courier
and baked in here so it carries the paper's tone, grain and shadow.

Output is 2x the CSS box (1396x726) so it stays sharp at a 2x capture.
Also writes the two rectified crops the inspector shows, and dets.json --
the detection geometry, in CSS coordinates, for gen-verso.mjs to read.
"""
import base64, io, json, math, random
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageStat

# The photograph is a bounded image inside the viewer's dark canvas, not the
# canvas itself, so its box is a camera aspect (3:2) rather than the viewport's.
CW, CH, S = 820, 615, 2
W, H = CW * S, CH * S
random.seed(1963)

# ---- placement, in CSS coordinates -----------------------------------------
TILE_W = 470.0                       # the tile itself, in CSS px
TILE = {"cx": 300.0, "cy": 305.0, "rot": 1.6}
# the label lies across the tile's right edge, half on the glaze, half on the sweep
LABEL = {"cx": 600.0, "cy": 178.0, "w": 248.0, "h": 108.0, "rot": -6.8}
# the painted cartouche, measured in tile-1927.220.jpg source pixels
INSC_SRC = {"cx": 423.0, "cy": 800.0, "w": 148.0, "h": 70.0, "tilt": 0.9}

FONT = "/System/Library/Fonts/Supplemental/Courier New.ttf"
FONT_B = "/System/Library/Fonts/Supplemental/Courier New Bold.ttf"
LINES = [                            # text, size (2x px), bold, baseline y
    ("RAVENSHOLT MUSEUM & ARCHIVE", 18, False, 40),
    ("1963.114", 30, True, 82),
    ("Tile, tin-glazed earthenware", 18, False, 122),
    ("Delft, c. 1740-60", 18, False, 150),
    ("Gift of Mrs E. M. Harkness, 1963", 16, False, 184),
]

frame_src = Image.open("tile-1927.220.jpg").convert("RGB")

# ---- ground: the sweep the tile was shot on, extended to the full canvas ----
# Sampled from the top, left and right margins only. The source's bottom edge
# is the tile's own contact shadow, cut off flat by the crop; including it
# would drag the whole sweep grey.
sw, sh = frame_src.size
edge = [frame_src.crop(b) for b in [(0, 0, sw, 7), (0, 0, 7, sh), (sw - 7, 0, sw, sh)]]
base = tuple(int(sum(ImageStat.Stat(e).mean[i] for e in edge) / 3) for i in range(3))

# Lift the tile off its own white margin. The tile is itself slightly rotated
# within the source frame, so a rectangular crop always leaves white triangles
# at the corners -- and pasting those lays a second, slightly different white
# over this one, which is what reads as a cut-out border. So cut a silhouette:
# mark everything darker than the ground (the tile's rim, its decoration and
# its shadow -- the margin's specks are brighter, so a one-sided test ignores
# them), then fill each row between its outermost marks, which recovers the
# solid shape because a tile is convex.
lum = sum(base) / 3
mark = frame_src.convert("L").filter(ImageFilter.MedianFilter(5)) \
    .point(lambda v: 255 if (lum - v) > 8 else 0)
mp = list(mark.getdata())
sil = Image.new("L", (sw, sh), 0)
sd = ImageDraw.Draw(sil)
for y in range(sh):
    row = mp[y * sw:(y + 1) * sw]
    if 255 not in row:
        continue
    sd.line([(row.index(255), y), (sw - 1 - row[::-1].index(255), y)], fill=255)
sil = sil.filter(ImageFilter.GaussianBlur(3))

bx0, by0, bx1, by1 = sil.getbbox()
tile_src = frame_src.convert("RGBA")
tile_src.putalpha(sil)
tile_src = tile_src.crop((bx0, by0, bx1, by1))
scale = TILE_W * S / tile_src.width           # device px per source px
print("frame", frame_src.size, "-> silhouette", (bx0, by0, bx1, by1), tile_src.size)
ground = Image.new("RGB", (W, H), base)
# a real sweep is not flat: a shallow fall-off away from the lamp axis. It is
# applied to the finished composite, not to the ground alone -- lighting falls
# on the object too, and dimming only the extension would leave the source
# frame showing as a brighter rectangle.
gw, gh = 160, 84
small = Image.new("L", (gw, gh))
sp = small.load()
for y in range(gh):
    for x in range(gw):
        nx, ny = (x - 0.52 * gw) / (0.94 * gw), (y - 0.36 * gh) / (0.98 * gh)
        sp[x, y] = int(255 * min(1.0, math.hypot(nx, ny)) ** 2.4 * 0.62)
falloff = small.resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(20))

# ---- the tile, rotated, feathered into the ground it already sits on -------
tl = tile_src.resize((round(tile_src.width * scale), round(tile_src.height * scale)),
                     Image.LANCZOS).convert("RGBA")
# The lamp sits up and to the right, so the tile throws its shadow down and to
# the left; the source frame ends before that shadow does, clipping it off
# square at the bottom. Ramping the alpha out over the clipped band lets it
# fall away into the sweep. Measured: the tile's own bottom edge is at about
# 4% of the frame height above the crop, so the ramp must stay inside that or
# it eats the edge itself.
FADE = round(0.04 * tl.height)
a = Image.new("L", tl.size, 255)
ad = ImageDraw.Draw(a)
for i in range(FADE):
    ad.line([(0, tl.height - 1 - i), (tl.width, tl.height - 1 - i)],
            fill=int(255 * (i / FADE) ** 0.75))
tl.putalpha(ImageChops.multiply(tl.split()[3], a))

tl = tl.rotate(-TILE["rot"], resample=Image.BICUBIC, expand=True)
px = round(TILE["cx"] * S - tl.width / 2)
py = round(TILE["cy"] * S - tl.height / 2)
ground.paste(tl, (px, py), tl.split()[3].filter(ImageFilter.GaussianBlur(1)))

# ---- the accession label: photographed paper, typed here ------------------
lw, lh = round(LABEL["w"] * S), round(LABEL["h"] * S)
paper = Image.open("paper-2023.15.jpg").convert("RGB").crop((1330, 245, 1330 + 580, 245 + 235))
paper = paper.resize((lw, lh), Image.LANCZOS)

ink = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
d = ImageDraw.Draw(ink)
tx0, tx1, ty0, ty1 = lw, 0, lh, 0
for txt, size, bold, by in LINES:
    f = ImageFont.truetype(FONT_B if bold else FONT, size)
    x = 26 + random.uniform(-1.5, 1.5)        # a typist's left margin wanders
    d.text((x, by), txt, font=f, fill=(38, 33, 28, 232), anchor="ls")
    bb = d.textbbox((x, by), txt, font=f, anchor="ls")
    tx0, ty0 = min(tx0, bb[0]), min(ty0, bb[1])
    tx1, ty1 = max(tx1, bb[2]), max(ty1, bb[3])
ink = ink.filter(ImageFilter.GaussianBlur(0.65))          # ink bleed into fibre
label = paper.convert("RGBA")
label.alpha_composite(ink)

# an irregular cut edge, and gum showing at the corners
cut = Image.new("L", (lw, lh), 0)
cd = ImageDraw.Draw(cut)
pts = []
for i in range(0, lw, 26):
    pts.append((i, random.uniform(0, 3.2)))
for i in range(0, lh, 26):
    pts.append((lw - random.uniform(0, 3.2), i))
for i in range(lw, 0, -26):
    pts.append((i, lh - random.uniform(0, 3.2)))
for i in range(lh, 0, -26):
    pts.append((random.uniform(0, 3.2), i))
cd.polygon(pts, fill=255)
label.putalpha(cut.filter(ImageFilter.GaussianBlur(0.7)))
gum = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
ImageDraw.Draw(gum).ellipse([lw - 96, lh - 62, lw - 12, lh - 8], fill=(176, 150, 96, 34))
label.alpha_composite(gum.filter(ImageFilter.GaussianBlur(8)))

label = label.rotate(-LABEL["rot"], resample=Image.BICUBIC, expand=True)
lpx = round(LABEL["cx"] * S - label.width / 2)
lpy = round(LABEL["cy"] * S - label.height / 2)
shadow = Image.new("L", (W, H), 0)
# cast the same way as the tile's -- down and to the left -- but shorter and
# softer, because the label is paper lying almost flat rather than a slab
ImageDraw.Draw(shadow).bitmap((lpx - 5, lpy + 3), label.split()[3], fill=92)
ground.paste(Image.new("RGB", (W, H), (36, 31, 26)),
             (0, 0), shadow.filter(ImageFilter.GaussianBlur(7)))
ground.paste(label, (lpx, lpy), label)

# ---- lamp fall-off, then photographic grain, over the whole plate ----------
ground = Image.composite(ImageEnhance.Brightness(ground).enhance(0.88), ground, falloff)
noise = Image.effect_noise((W, H), 9).convert("L").convert("RGB")
ground = Image.blend(ground, Image.blend(ground, noise, 0.5), 0.11)

# ---- detection geometry, in CSS coordinates --------------------------------
def rot(x, y, cx, cy, deg):
    a = math.radians(deg)
    dx, dy = x - cx, y - cy
    return cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a)

# label: the box hugs the typed block, not the paper
lcx = LABEL["cx"] + ((tx0 + tx1) / 2 - lw / 2) / S
lcy = LABEL["cy"] + ((ty0 + ty1) / 2 - lh / 2) / S
lcx, lcy = rot(lcx, lcy, LABEL["cx"], LABEL["cy"], LABEL["rot"])
# inscription: source pixels -> CSS, then through the tile's own rotation
icx = TILE["cx"] + (INSC_SRC["cx"] - (bx0 + bx1) / 2) * scale / S
icy = TILE["cy"] + (INSC_SRC["cy"] - (by0 + by1) / 2) * scale / S
icx, icy = rot(icx, icy, TILE["cx"], TILE["cy"], TILE["rot"])

dets = [
    {"id": "det-1", "cx": round(lcx, 1), "cy": round(lcy, 1),
     "w": round((tx1 - tx0 + 22) / S, 1), "h": round((ty1 - ty0 + 20) / S, 1),
     "th": LABEL["rot"]},
    {"id": "det-2", "cx": round(icx, 1), "cy": round(icy, 1),
     "w": round(INSC_SRC["w"] * scale / S, 1), "h": round(INSC_SRC["h"] * scale / S, 1),
     "th": round(TILE["rot"] + INSC_SRC["tilt"], 1)},
]

# ---- rectified crops: deskew about the box centre, then cut ---------------
CROP_W = 340          # wide enough to stay sharp in the inspector at a 2x capture
crops = {}
for det in dets:
    r = ground.rotate(det["th"], resample=Image.BICUBIC, center=(det["cx"] * S, det["cy"] * S))
    hw, hh = det["w"] * S / 2, det["h"] * S / 2
    c = r.crop((round(det["cx"] * S - hw), round(det["cy"] * S - hh),
                round(det["cx"] * S + hw), round(det["cy"] * S + hh)))
    c = c.resize((CROP_W, max(1, round(c.height * CROP_W / c.width))), Image.LANCZOS)
    buf = io.BytesIO()
    c.save(buf, "JPEG", quality=86, optimize=True)
    crops[det["id"]] = base64.b64encode(buf.getvalue()).decode()

buf = io.BytesIO()
ground.convert("RGB").save(buf, "JPEG", quality=80, optimize=True, progressive=True)
raw = buf.getvalue()
open("plate.jpg", "wb").write(raw)
open("plate.b64", "w").write(base64.b64encode(raw).decode())
json.dump({"dets": dets, "crops": crops}, open("dets.json", "w"))
for d_ in dets:
    print(" ", d_)
print(f"plate.jpg {len(raw)/1024:.0f} KB -> base64 {len(raw)*4/3/1024:.0f} KB")
