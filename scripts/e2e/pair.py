"""side-by-side of react-<name>.png and legacy-<name>.png  →  pair-<name>.png (legacy left, react right)"""
import sys
from PIL import Image
d = "notes/shots/phase3/"
for name in sys.argv[1:]:
    a = Image.open(d + "legacy-" + name + ".png"); b = Image.open(d + "react-" + name + ".png")
    h = max(a.height, b.height); im = Image.new("RGB", (a.width + b.width + 8, h), (255, 0, 255))
    im.paste(a, (0, 0)); im.paste(b, (a.width + 8, 0)); im.save(d + "pair-" + name + ".png")
