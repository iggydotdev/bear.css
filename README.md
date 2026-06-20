# bear.css

Bear (or Bare) CSS framework. Same philosophy as b0nes: simple and easy to understand in a day.

## The Atomic Stack

- Level 0 — RAW VALUES   (pure numbers, unitless, meaningless alone)
- Level 1 — PRIMITIVES   (raw values given units and meaning)
- Level 2 — TOKENS       (primitives given semantic names)
- Level 3 — PROPERTIES   (tokens applied to CSS properties)
- Level 4 — COMPOSITIONS (properties that combine intentionally)

Each level only ever references the level below it. Properties never hardcode
a primitive directly, compositions never hardcode a property value directly.
Change a token, everything built on it updates — that's the whole point.

## Structure

```
bear.css/
├── src/
│   ├── bear.css                 ← entry point, just @imports
│   ├── reset.css
│   ├── primitives/
│   │   ├── index.css            ← entry, just @imports
│   │   ├── scale.css
│   │   ├── type.css
│   │   └── colors.css
│   ├── tokens/
│   │   └── tokens.css
│   ├── composition/
│   │   └── composition.css
│   └── properties/
│       ├── index.css            ← entry, just @imports
│       ├── space.css
│       ├── type.css
│       ├── colors.css
│       ├── layout.css
│       ├── sizing.css
│       ├── border.css
│       ├── flex.css
│       ├── grid.css
│       ├── z-index.css
│       ├── transition.css
│       ├── state.css
│       ├── accessibility.css
│       └── responsive.css
├── dist/
│   └── bear.css                 ← the one <link> file, generated
└── package.json
```

## Build

```
npm run build
```

Bundles everything under `src/` into the single `dist/bear.css` file. Link
that one file — `src/` is never shipped to a browser.