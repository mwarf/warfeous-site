"""Subset the site's variable fonts with HarfBuzz.

Run from the repo root:

    uv run --with uharfbuzz --with fonttools --with brotli python3 scripts/subset-fonts.py

Reads the full upstream fonts from fonts-source/ and writes the *-subset.woff2
files the site actually serves into public/fonts/.

Hard-won rules, do not relearn them:
- Subset with HarfBuzz, NOT fontTools' subsetter. fontTools inflates the
  variable-font delta tables (gvar) and the output comes out LARGER than
  the input.
- Never range-limit axes (e.g. wght 260-560). L4 instancing adds
  intermediate deltas and also grows the file. Pinning an axis to a single
  value (like WONK=0) is fine and is the only axis operation used here.
- Latin + punctuation subset; all OpenType layout features kept because
  onum/tnum/lnum are load-bearing for the design system.
"""
import io
import os

import uharfbuzz as hb
from fontTools.ttLib import TTFont

SOURCE_DIR = "fonts-source"
OUT_DIR = "public/fonts"

RANGES = [
    (0x20, 0x7E), (0xA0, 0xFF),              # basic latin + latin-1
    (0x131, 0x131), (0x152, 0x153),          # dotless i, OE
    (0x2BB, 0x2BC), (0x2C6, 0x2C6), (0x2DA, 0x2DA), (0x2DC, 0x2DC),
    (0x2013, 0x2014), (0x2018, 0x201E),      # dashes, quotes
    (0x2022, 0x2022), (0x2026, 0x2026),      # bullet, ellipsis
    (0x2032, 0x2033), (0x2039, 0x203A),      # primes, guillemets
    (0x2044, 0x2044), (0x20AC, 0x20AC), (0x2122, 0x2122),
    (0x2190, 0x2190), (0x2192, 0x2192), (0x21A9, 0x21A9),  # arrows, return
    (0x2212, 0x2212), (0xFB01, 0xFB02),      # minus, fi/fl
]
FEATURES = ["onum", "lnum", "tnum", "pnum", "kern", "liga", "clig", "calt",
            "dlig", "case", "frac", "sups", "subs", "ordn", "salt",
            "ss01", "ss02", "ss03", "zero", "cpsp"]
tag = lambda t: int.from_bytes(t.encode(), "big")

# (source file, output file, axes to pin)
JOBS = [
    ("Fraunces-VariableFont_SOFT_WONK_opsz_wght.woff2", "Fraunces-Roman-subset.woff2", [("WONK", 0)]),
    ("Fraunces-Italic-VariableFont_SOFT_WONK_opsz_wght.woff2", "Fraunces-Italic-subset.woff2", [("WONK", 0)]),
    ("Newsreader-VariableFont_opsz_wght.woff2", "Newsreader-Roman-subset.woff2", []),
    ("Newsreader-Italic-VariableFont_opsz_wght.woff2", "Newsreader-Italic-subset.woff2", []),
    ("ia-writer-mono-latin-400-normal.woff2", "ia-writer-mono-400-subset.woff2", []),
    ("ia-writer-mono-latin-400-italic.woff2", "ia-writer-mono-400-italic-subset.woff2", []),
    ("ia-writer-mono-latin-700-normal.woff2", "ia-writer-mono-700-subset.woff2", []),
    ("ia-writer-mono-latin-700-italic.woff2", "ia-writer-mono-700-italic-subset.woff2", []),
]

for src, dst, pins in JOBS:
    src_path = os.path.join(SOURCE_DIR, src)
    if not os.path.exists(src_path):
        print(f"skip (no source): {src}")
        continue

    # HarfBuzz cannot read woff2; decompress to raw TTF bytes first.
    f = TTFont(src_path)
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    face = hb.Face(buf.getvalue())

    inp = hb.SubsetInput()
    for lo, hi in RANGES:
        for cp in range(lo, hi + 1):
            inp.unicode_set.add(cp)
    for t in FEATURES:
        inp.layout_feature_tag_set.add(tag(t))
    for axis, value in pins:
        inp.pin_axis_location(face, axis, value)

    new = inp.subset(face)
    out = TTFont(io.BytesIO(new.blob.data))
    out.flavor = "woff2"
    out.save(os.path.join(OUT_DIR, dst))

    before = os.path.getsize(src_path) // 1024
    after = os.path.getsize(os.path.join(OUT_DIR, dst)) // 1024
    print(f"{src}: {before}KB -> {dst}: {after}KB")
