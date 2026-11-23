# Home Row

A free touch-typing trainer that runs in the browser. Learn to type with all ten fingers, without looking.

- **22 lessons**: home row, top row and bottom row, then capitals, punctuation and numbers. A one-minute typing check at
  the start gives you a personal plan.
- **Adaptive practice**: every round is built around your weakest key or letter pair.
- **Real typing**: 40 short passages, 25 code snippets (JavaScript, Python, Swift, CSS, SQL, shell), or your own text.
- **Tests**: 15, 30, 60 or 120 seconds, with a share card for your result.
- **Rewards**: levels, a daily streak, 21 achievements and a weekly recap.
- **Key sounds**: Soft, Creamy, Clicky and Typewriter, made in the browser with no audio files.
- **Claude coach**: copy your progress into a Claude chat and get lessons written for your weakest keys.

Progress is saved in your browser. There is no account and no server.

## Layout

```
src/        the app, in parts (app1.js … app11.js, p1.html for markup and CSS, words.js, texts.js)
build.sh    joins the parts into the pages below
site/       the website, served as is
  index.html       landing page
  app/index.html   the trainer (built)
  assets/          icon, link preview image
vercel.json static hosting settings for Vercel
```

## Build

```sh
sh build.sh
```

This writes `site/app/index.html` (the website build), plus two outputs that stay out of the repo: `local/index.html`
(a local preview with debug helpers) and `artifact/home-row.html` (the same app as a claude.ai Artifact page, where
progress syncs to the Claude account and the in-app coach can ask Claude directly).

Needs `sh`, `python3` and `node` (the build syntax-checks the result).

## Run locally

```sh
python3 -m http.server 8780 --directory site
```

Then open http://localhost:8780.

## Deploy

The site is static. Vercel serves the `site/` folder (see `vercel.json`); there is no build step on Vercel, so run
`sh build.sh` and commit `site/` before pushing.
