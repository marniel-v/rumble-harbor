#!/usr/bin/env python3
"""Thumbnail atlases for the Verso filmstrip and review queue.

One distinct CC0 object per capture -- see objects.json for the accession list.
Each capture is a separate exposure on the stand, so every thumbnail carries its
own small rotation, framing, brightness and colour-temperature drift; the two
captures the run rejected for blur are actually blurred, and the one it rejected
for occlusion has the mount edge across it.

Emitted at 2x the CSS box so they stay sharp at a 2x capture.
"""
import base64, hashlib, io, json
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

SIZES = {"strip": (224, 88), "q": (52, 40)}

# capture -> source object. C-0847 is the tile on the object-record canvas, and
# C-0851 is the same object in the filmstrip and in the queue.
STRIP = {
    "C-0843": "cer0", "C-0844": "cer1", "C-0845": "cer2", "C-0846": "cer3",
    "C-0847": "tile", "C-0848": "cer4", "C-0849": "cer5", "C-0850": "cer6",
    "C-0851": "soc0", "C-0852": "cer7", "C-0853": "cer8", "C-0854": "cer9",
}
QUEUE = {
    "C-1043": "arc0", "C-0851": "soc0", "C-0771": "art0", "C-1129": "mar0",
    "C-0847": "tile", "C-1204": "mar1", "C-0668": "tex0", "C-0559": "art1",
    "C-1318": "soc1", "C-0902": "cer10", "C-1077": "arc1", "C-0733": "tex1",
    "C-1265": "art2", "C-0614": "arc2", "C-1391": "soc2", "C-0985": "tex2",
    "C-1152": "mar2", "C-0812": "cer11", "C-1337": "art3", "C-0691": "arc3",
    "C-1418": "soc3", "C-0748": "tex3",
}
BLUR = {"C-0771": 2.6, "C-0559": 1.9}      # the run rejected these for blur
OCCLUDED = "C-0851"                         # rejected: occluded by mount

SRC = {"tile": "tile-1927.220.jpg"}


def jitter(cap):
    """Deterministic per-capture exposure drift, from the capture id."""
    h = hashlib.sha256(cap.encode()).digest()
    u = [b / 255 for b in h[:6]]
    return {"rot": (u[0] - 0.5) * 4.8, "zoom": 1.0 + u[1] * 0.14,
            "px": (u[2] - 0.5) * 0.18, "py": (u[3] - 0.5) * 0.18,
            "bright": 0.90 + u[4] * 0.17, "warm": 0.97 + u[5] * 0.07}


def thumb(cap, key, size):
    j = jitter(cap)
    im = Image.open(SRC.get(key, f"obj/{key}.jpg")).convert("RGB")
    im = im.rotate(j["rot"], resample=Image.BICUBIC)
    tw, th = size
    ar = tw / th
    w, h = im.size
    # inset past the rotation's empty corners, then frame to the target aspect
    m = int(min(w, h) * 0.06)
    w, h = w - 2 * m, h - 2 * m
    if w / h > ar:
        cw, ch = int(h * ar / j["zoom"]), int(h / j["zoom"])
    else:
        cw, ch = int(w / j["zoom"]), int(w / ar / j["zoom"])
    dx = m + int((w - cw) * (0.5 + j["px"]))
    dy = m + int((h - ch) * (0.5 + j["py"]))
    c = im.crop((dx, dy, dx + cw, dy + ch)).resize(size, Image.LANCZOS)

    r, g, b = c.split()                      # colour-temperature drift
    c = Image.merge("RGB", (r.point(lambda v: min(255, int(v * j["warm"]))), g,
                            b.point(lambda v: min(255, int(v * (1.97 - j["warm"]))))))
    c = ImageEnhance.Brightness(c).enhance(j["bright"])
    c = ImageEnhance.Color(c).enhance(0.88)
    if cap in BLUR:
        c = c.filter(ImageFilter.GaussianBlur(BLUR[cap] * size[1] / 88))
    if cap == OCCLUDED:
        d = ImageDraw.Draw(c, "RGBA")
        d.polygon([(0, size[1]), (0, size[1] * 0.34), (size[0] * 0.30, size[1])],
                  fill=(18, 16, 14, 205))
    return c


out = {}
for name, size in SIZES.items():
    px = (size[0] * 2, size[1] * 2)
    caps = STRIP if name == "strip" else QUEUE
    out[name] = {}
    for cap, key in caps.items():
        buf = io.BytesIO()
        thumb(cap, key, px).save(buf, "JPEG", quality=72, optimize=True)
        out[name][cap] = base64.b64encode(buf.getvalue()).decode()

open("thumbs.json", "w").write(json.dumps(out))
tot = sum(len(v) for s in out.values() for v in s.values())
distinct = len(set(STRIP.values()) | set(QUEUE.values()))
print(f"{len(STRIP)} strip + {len(QUEUE)} queue captures, {distinct} distinct objects "
      f"-> {tot/1024:.0f} KB base64")
