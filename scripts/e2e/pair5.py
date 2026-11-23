"""side-by-side of react-<name>.png and legacy-<name>.png in notes/shots/phase5  ->  pair-<name>.png (legacy left, react right)"""
import sys, glob, os
from PIL import Image
d = "notes/shots/phase5/"
for f in sorted(glob.glob(d + "react-*.png")):
    name = os.path.basename(f)[len("react-"):-4]
    lp = d + "legacy-" + name + ".png"
    if not os.path.exists(lp): continue
    a = Image.open(lp); b = Image.open(f)
    h = max(a.height, b.height); im = Image.new("RGB", (a.width + b.width + 8, h), (255, 0, 255))
    im.paste(a, (0, 0)); im.paste(b, (a.width + 8, 0)); im.save(d + "pair-" + name + ".png")
