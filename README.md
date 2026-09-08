# Dragon Link

Marketing site for **Dragon Link Consultancy & Travel Tours L.L.C.** (Al Rigga, Deira — Dubai).

Implemented from the Claude Design source `Dragon Link.dc.html`
([project](https://claude.ai/design/p/24992634-97d1-46ad-a7a0-48352b9b5b25)). The design's
`<x-dc>` runtime template was ported to React so the page ships as a static, prerendered
site instead of loading React + Babel from a CDN at runtime.

## Stack

- Vite 8 + React 19
- Prerendered to static HTML at build time (`scripts/prerender.mjs`), hydrated on the client
- No runtime dependencies beyond React; Google Fonts is the only external request

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # client build -> SSR build -> prerender into dist/
npm run preview  # serve dist/
```

`npm run build` writes the deployable site to `dist/`.

## Layout

```
index.html            page shell, meta/OG tags, JSON-LD
src/App.jsx           the whole page (nav, hero, services, why, contact, footer)
src/data.js           service catalogue: options, required documents, copy
src/styles/tokens.css design-system tokens ("Classical") — the source of truth for the look
src/styles/app.css    page styles; the design's `style-hover` attributes as real :hover rules
public/assets/        logo and photography
design/               the Claude Design source, kept for reference — see design/README.md
```

## Content notes

- The request form is client-side only: submitting shows the confirmation state and the
  WhatsApp hand-off, exactly as the design specifies. Wire it to a backend before relying
  on it to capture leads.
- `src/App.jsx` has a `DEIRA_PHOTO` constant, currently `null`, which renders a styled
  placeholder in the "Why Dragon Link" section. Drop a photograph into
  `public/assets/` and point the constant at it.

## Deployment

Vercel, from `main`. Production domain: `dragonlink.vedryxtech.com`.
