#!/usr/bin/env python3
"""
Build the NurseHub assistant avatar assets from the owner's approved images (design/avatar-src/*.jpg, 768 x 1376, white background).

Output → public/avatar/ (static files served by Cloudflare, never through a Function):
  pose_<name>.webp   full poses with a transparent background, 512 px wide
  mouth_<name>.webp  the mouth area cut from each mouth image, feathered edges (laid over the face while speaking)
  eyes_closed.webp   the eye area cut from eyes_closed (blink)
  icon.webp          a square face crop (buttons / cards)
  avatar.json        geometry: patch boxes and, for the gesture poses, where the base face sits in that pose

Mouth / eye images were made by editing ONLY that part of base.jpg, so they line up with it pixel for pixel; the patches are cut
from those images at the same place. The gesture images were made separately: the face in them is found by matching the base
face (scale + shift search) so the mouth can be placed on them too.
Requirements: Python 3 + Pillow + numpy.   Run:  python3 scripts/build_avatar_assets.py
"""
import json
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "design", "avatar-src")
OUT = os.path.join(ROOT, "public", "avatar")
W0, H0 = 768, 1376          # source size
W = 512                     # output width
K = W / W0
H = round(H0 * K)

POSES = ["base", "listening", "happy", "sad", "thinking", "gesture_explain", "gesture_welcome"]
MOUTHS = {"slight": "mouth_slight", "open": "mouth_open", "wide": "mouth_wide", "round": "mouth_round", "smile": "happy"}
MOUTH_BOX = (226, 556, 544, 806)   # x0, y0, x1, y1 in source pixels (all mouth shapes + moving beard)
EYES_BOX = (258, 452, 510, 548)


def load(name):
    return Image.open(os.path.join(SRC, f"{name}.jpg")).convert("RGB")


def remove_background(img):
    """Flood-fill the near-white background from the image border; enclosed white (the undershirt) is kept."""
    marked = img.copy()
    px = marked.load()
    w, h = marked.size
    seeds = [(x, 0) for x in range(0, w, 24)] + [(x, h - 1) for x in range(0, w, 24)] + [(0, y) for y in range(0, h, 24)] + [(w - 1, y) for y in range(0, h, 24)]
    for s in seeds:
        r, g, b = px[s]
        if min(r, g, b) >= 228 and px[s] != (255, 0, 255):
            ImageDraw.floodfill(marked, s, (255, 0, 255), thresh=34)
    a = np.asarray(marked)
    bg = (a[:, :, 0] == 255) & (a[:, :, 1] == 0) & (a[:, :, 2] == 255)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8), "L")
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))  # trim the white fringe, soften
    out = img.copy()
    out.putalpha(alpha)
    return out


def feather(size, inset=0.24):
    """Elliptical alpha mask: opaque centre, soft edge over the outer `inset` part."""
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - (w - 1) / 2) / (w / 2)) ** 2 + ((yy - (h - 1) / 2) / (h / 2)) ** 2)
    a = np.clip((1 - d) / inset, 0, 1)
    a = a * a * (3 - 2 * a)  # smoothstep
    return Image.fromarray((a * 255).astype(np.uint8), "L")


def patch(img, box):
    """Feathered cut-out of `box`; the background around the neck stays transparent (no white halo)."""
    crop = remove_background(img).crop(box)
    bg_alpha = np.asarray(crop.getchannel("A"), dtype=np.float32)
    soft = np.asarray(feather(crop.size), dtype=np.float32)
    crop.putalpha(Image.fromarray((bg_alpha * soft / 255).astype(np.uint8), "L"))
    return crop.resize((round(crop.width * K), round(crop.height * K)), Image.LANCZOS)


def face_transform(name, base_gray):
    """Where the base face (brows → chin) appears in another pose: scale s and shift, found by template search."""
    tpl = base_gray[380:800, 230:540]
    im = Image.open(os.path.join(SRC, f"{name}.jpg")).convert("L")
    best = (1e18, None)
    for s in np.arange(0.86, 1.42, 0.02):
        ws, hs = int(round(W0 * s)), int(round(H0 * s))
        a = np.asarray(im.resize((ws, hs), Image.BILINEAR), dtype=np.float32)
        for dy in range(-210, 211, 3):
            for dx in range(-110, 111, 3):
                y0, x0 = int(380 * s) + dy, int(230 * s) + dx
                if y0 < 0 or x0 < 0 or y0 + 420 > hs or x0 + 310 > ws:
                    continue
                e = float(np.mean((a[y0:y0 + 420:3, x0:x0 + 310:3] - tpl[::3, ::3]) ** 2))
                if e < best[0]:
                    best = (e, (float(s), dx, dy))
    e, (s, dx, dy) = best
    # base point (x, y) → pose point ((x + ox) / s, (y + oy) / s) with ox = 230 s + dx - 230, oy = 380 s + dy - 380
    ox, oy = 230 * s + dx - 230, 380 * s + dy - 380
    return {"scale": round(1 / s, 4), "x": round(ox / s / W0, 5), "y": round(oy / s / H0, 5), "error": round(e, 1)}


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {"source": [W0, H0], "size": [W, H], "poses": {}, "mouths": list(MOUTHS), "mouthBox": [v / (W0 if i % 2 == 0 else H0) for i, v in enumerate(MOUTH_BOX)],
            "eyesBox": [v / (W0 if i % 2 == 0 else H0) for i, v in enumerate(EYES_BOX)]}
    base_gray = np.asarray(load("base").convert("L"), dtype=np.float32)
    for p in POSES:
        img = remove_background(load(p)).resize((W, H), Image.LANCZOS)
        img.save(os.path.join(OUT, f"pose_{p}.webp"), "WEBP", quality=82, method=6)
        meta["poses"][p] = {"face": {"scale": 1, "x": 0, "y": 0}} if p in ("base", "listening", "happy", "sad", "thinking") else {"face": face_transform(p, base_gray)}
    for key, src in MOUTHS.items():
        patch(load(src), MOUTH_BOX).save(os.path.join(OUT, f"mouth_{key}.webp"), "WEBP", quality=85, method=6)
    patch(load("eyes_closed"), EYES_BOX).save(os.path.join(OUT, "eyes_closed.webp"), "WEBP", quality=85, method=6)
    icon = remove_background(load("base")).crop((104, 212, 664, 772)).resize((160, 160), Image.LANCZOS)
    icon.save(os.path.join(OUT, "icon.webp"), "WEBP", quality=85, method=6)
    with open(os.path.join(OUT, "avatar.json"), "w") as f:
        json.dump(meta, f, indent=1)
    total = sum(os.path.getsize(os.path.join(OUT, n)) for n in os.listdir(OUT))
    print(json.dumps(meta["poses"], indent=1))
    print(f"{len(os.listdir(OUT))} files, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
