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
├── bear.config.js               ← global framework configuration
├── src/
│   ├── bear.css                 ← entry point, just @imports
│   ├── reset.css
│   ├── primitives/
│   │   ├── index.css            ← entry, just @imports
│   │   ├── scale.css            ← auto-generated
│   │   ├── type.css             ← auto-generated
│   │   └── colors.css
│   ├── tokens/
│   │   └── tokens.css
│   ├── composition/
│   │   └── composition.css
│   └── properties/
│       ├── index.css            ← entry, just @imports
│       ├── space.css
│       ├── layout.css
│       └── responsive.css       ← auto-generated (@media and @container)
├── dist/
│   └── bear.css                 ← the one <link> file, generated
└── package.json
```

## Configuration

The framework is driven by a single JavaScript configuration file: `bear.config.js`. 

```javascript
module.exports = {
  "scale": [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32],
  "base-unit": 4,
  "type-scale-ratio": 1.25,
  "type-base": 16,
  "breakpoints": { "s": 480, "m": 768, "l": 1024, "xl": 1280 }
};
```

## Build

```bash
npm run build
```

The zero-dependency compiler (`src/build.js`) will:
1. Dynamically generate the primitive scales (`scale.css`, `type.css`) from your config.
2. Dynamically generate BOTH `@media` (`\@s`) and `@container` (`\@c-s`) responsive query variants for your defined breakpoints.
3. Bundle and minify everything into `dist/bear.css`.

Link that one file in your HTML — `src/` is never shipped to a browser.