#!/bin/sh
# Build Home Row from src/.
#   site/app/index.html     the trainer on the website (production: debug helpers stripped)
#   artifact/home-row.html  the same app as a claude.ai artifact page (claude.ai adds the document wrapper)
#   local/index.html        local preview with the debug helpers (window.App)
set -e
D="$(cd "$(dirname "$0")" && pwd)"
S="$D/src"
B="$D/.build"
mkdir -p "$B" "$D/site/app" "$D/artifact" "$D/local"

cat "$S/app1.js" "$S/app2.js" "$S/app3.js" "$S/app4.js" "$S/app5.js" "$S/app5b.js" "$S/app7.js" "$S/app8.js" "$S/app8b.js" \
    "$S/app9.js" "$S/app10.js" "$S/app11.js" "$S/app12.js" "$S/app6.js" > "$B/app.js"
{ cat "$S/p1.html"; printf '<script>\n"use strict";\n'; cat "$S/words.js"; echo; cat "$S/texts.js"; echo; cat "$B/app.js"; printf '</script>\n'; } > "$B/page-debug.html"

# strip the debug block for everything that ships
python3 -I - "$B/page-debug.html" "$D/artifact/home-row.html" <<'PY'
import re,sys
s=open(sys.argv[1]).read()
out,n=re.subn(r'/\*DEBUG-START\*/.*?/\*DEBUG-END\*/','',s,flags=re.S)
assert n==1 and 'window.App' not in out, 'debug block not stripped'
open(sys.argv[2],'w').write(out)
PY

HEAD_BASE='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style>'
HEAD_SITE='<meta name="description" content="Learn to type with all ten fingers. Short daily lessons that adapt to you, right in your browser."><meta name="theme-color" content="#0E1220"><link rel="icon" type="image/svg+xml" href="/assets/icon.svg"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta property="og:title" content="Home Row · Practice"><meta property="og:description" content="Learn to type with all ten fingers."><meta property="og:url" content="https://homerow.sebthe.dev/app/"><meta property="og:image" content="https://homerow.sebthe.dev/assets/og.png"><meta name="twitter:card" content="summary_large_image">'

{ printf '%s' "$HEAD_BASE$HEAD_SITE</head><body>"; cat "$D/artifact/home-row.html"; printf '%s' '</body></html>'; } > "$D/site/app/index.html"
{ printf '%s' "$HEAD_BASE</head><body>"; cat "$B/page-debug.html"; printf '%s' '</body></html>'; } > "$D/local/index.html"

node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const h=fs.readFileSync(f,"utf8");const m=h.match(/<script>([\s\S]*)<\/script>/);new Function(m[1]);}console.log("build ok: syntax checked")' \
  "$D/artifact/home-row.html" "$D/site/app/index.html" "$D/local/index.html"
