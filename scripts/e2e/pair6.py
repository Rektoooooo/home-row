"""phase 6: pair-<name>.png (legacy left, react right) for every react-*/legacy-* shot, plus the share of differing pixels"""
import glob, os
from PIL import Image, ImageChops
d = "notes/shots/phase6/"
for f in sorted(glob.glob(d + "react-*.png")):
    name = os.path.basename(f)[6:-4]
    a = Image.open(d + "legacy-" + name + ".png").convert("RGB"); b = Image.open(f).convert("RGB")
    h = max(a.height, b.height); im = Image.new("RGB", (a.width + b.width + 8, h), (255, 0, 255))
    im.paste(a, (0, 0)); im.paste(b, (a.width + 8, 0)); im.save(d + "pair-" + name + ".png")
    if a.size == b.size:
        diff = ImageChops.difference(a, b).convert("L").point(lambda x: 255 if x > 24 else 0)
        print(name, a.size, "differing px: %.2f%%" % (100 * sum(diff.histogram()[255:]) / (a.width * a.height)), "bbox", diff.getbbox())
    else: print(name, "SIZE", a.size, b.size)
