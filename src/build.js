// build.js — Zero-dependency compiler and bundler
const fs = require('fs')
const path = require('path')

// 1. Compile Config
function compileConfig() {
  const configPath = path.resolve(__dirname, '../bear.config.js')
  let config
  try {
    config = require(configPath)
  } catch (err) {
    throw new Error(`Could not load config from ${configPath}: ` + err.message)
  }

  // Generate scale.css
  const scalePath = path.join(__dirname, 'primitives/scale.css')
  let scaleCss = `/* scale.css — raw numeric scale, never used directly in HTML */\n`
  scaleCss += `/* Automatically generated from config in bear.config.js — DO NOT EDIT DIRECTLY */\n\n`
  scaleCss += `:root {\n`
  for (const step of config.scale) {
    if (step === 0) {
      scaleCss += `  --primitive-0: 0;\n`
    } else {
      const px = step * config['base-unit']
      const rem = px / 16
      scaleCss += `  --primitive-${step}: ${rem}rem; /* ${px}px */\n`
    }
  }
  scaleCss += `}\n`
  fs.writeFileSync(scalePath, scaleCss)
  console.log('✓ Generated primitives/scale.css')

  // Generate type.css
  // `type-base` sets the base font size in px (e.g. 16). We express every
  // step as a rem value relative to a 16px root, so the *ratio* between
  // steps stays correct however the browser's actual root font-size
  // resolves — reset.css keeps `font-size: 100%` on purpose, to respect
  // the user's own browser setting. `type-base` shifts where "1× " sits
  // on that scale, it doesn't hardcode an absolute pixel size.
  const typePath = path.join(__dirname, 'primitives/type.css')
  const ratio = config['type-scale-ratio']
  const base = config['type-base']
  if (!base) {
    throw new Error('bear.config.js is missing required "type-base" value')
  }
  const baseRem = base / 16
  const formatRem = (val) => Number(val.toFixed(3)) + 'rem'

  let typeCss = `/* type.css — raw type scale, never used directly in HTML */\n`
  typeCss += `/* Automatically generated from config in bear.config.js — DO NOT EDIT DIRECTLY */\n\n`
  typeCss += `:root {\n`
  typeCss += `  --primitive-text-xs:   ${formatRem(baseRem / (ratio * ratio))};\n`
  typeCss += `  --primitive-text-sm:   ${formatRem(baseRem / ratio)};\n`
  typeCss += `  --primitive-text-base: ${formatRem(baseRem)};\n`
  typeCss += `  --primitive-text-md:   ${formatRem(baseRem * ratio)};\n`
  typeCss += `  --primitive-text-lg:   ${formatRem(baseRem * ratio * ratio)};\n`
  typeCss += `  --primitive-text-xl:   ${formatRem(baseRem * ratio * ratio * ratio)};\n`
  typeCss += `  --primitive-text-2xl:  ${formatRem(baseRem * ratio * ratio * ratio * ratio)};\n`
  typeCss += `  --primitive-text-3xl:  ${formatRem(baseRem * ratio * ratio * ratio * ratio * ratio)};\n`
  typeCss += `}\n`
  fs.writeFileSync(typePath, typeCss)
  console.log('✓ Generated primitives/type.css')

  // Generate grid-columns.css
  // `columns` drives every column-count-dependent grid utility: template
  // columns, column span, column start, column end. Change the config,
  // the full run regenerates — nothing hand-maintained, nothing partial.
  const gridColumnsPath = path.join(__dirname, 'properties/grid-columns.css')
  const columns = config.columns
  if (!columns) {
    throw new Error('bear.config.js is missing required "columns" value')
  }

  let gridCss = `/* grid-columns.css — column-count-dependent grid utilities */\n`
  gridCss += `/* Automatically generated from config in bear.config.js — DO NOT EDIT DIRECTLY */\n\n`

  gridCss += `/* --- Template columns --- */\n`
  for (let i = 1; i <= columns; i++) {
    gridCss += `.grid-cols-${i} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }\n`
  }
  gridCss += `\n/* --- Column span --- */\n`
  for (let i = 1; i <= columns; i++) {
    gridCss += `.col-span-${i} { grid-column: span ${i} / span ${i}; }\n`
  }
  gridCss += `.col-span-full { grid-column: 1 / -1; }\n`

  gridCss += `\n/* --- Column start --- */\n`
  for (let i = 1; i <= columns; i++) {
    gridCss += `.col-start-${i} { grid-column-start: ${i}; }\n`
  }
  gridCss += `.col-start-auto { grid-column-start: auto; }\n`

  gridCss += `\n/* --- Column end --- */\n`
  for (let i = 1; i <= columns + 1; i++) {
    gridCss += `.col-end-${i} { grid-column-end: ${i}; }\n`
  }
  gridCss += `.col-end-auto { grid-column-end: auto; }\n`
  gridCss += `.col-end-last { grid-column-end: -1; }\n`

  fs.writeFileSync(gridColumnsPath, gridCss)
  console.log('✓ Generated properties/grid-columns.css')

  // Generate responsive.css
  const responsivePath = path.join(__dirname, 'properties/responsive.css')
  let respCss = `/* responsive.css — curated breakpoint overrides */\n`
  respCss += `/* Automatically generated from config in bear.config.js — DO NOT EDIT DIRECTLY */\n\n`

  const breakpoints = Object.entries(config.breakpoints)

  function generateUtilities(suffix) {
    let u = ''
    u += `  /* --- Display --- */\n`
    u += `  .hidden\\@${suffix} { display: none; }\n`
    u += `  .block\\@${suffix}  { display: block; }\n`
    u += `  .flex\\@${suffix}   { display: flex; }\n`
    u += `  .grid\\@${suffix}   { display: grid; }\n\n`

    u += `  /* --- Flex direction --- */\n`
    u += `  .flex-row\\@${suffix} { flex-direction: row; }\n`
    u += `  .flex-col\\@${suffix} { flex-direction: column; }\n\n`

    u += `  /* --- Alignment --- */\n`
    u += `  .items-start\\@${suffix}   { align-items: flex-start; }\n`
    u += `  .items-center\\@${suffix}  { align-items: center; }\n`
    u += `  .items-end\\@${suffix}     { align-items: flex-end; }\n\n`
    
    u += `  .justify-start\\@${suffix}   { justify-content: flex-start; }\n`
    u += `  .justify-center\\@${suffix}  { justify-content: center; }\n`
    u += `  .justify-between\\@${suffix} { justify-content: space-between; }\n\n`

    u += `  /* --- Gap --- */\n`
    u += `  .gap-sm\\@${suffix} { gap: var(--space-sm); }\n`
    u += `  .gap-md\\@${suffix} { gap: var(--space-md); }\n`
    u += `  .gap-lg\\@${suffix} { gap: var(--space-lg); }\n`
    u += `  .gap-xl\\@${suffix} { gap: var(--space-xl); }\n\n`

    u += `  /* --- Grid columns (full run, driven by config.columns) --- */\n`
    for (let i = 1; i <= columns; i++) {
      u += `  .grid-cols-${i}\\@${suffix} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }\n`
    }
    u += `\n`

    u += `  /* --- Column span (full run, driven by config.columns) --- */\n`
    for (let i = 1; i <= columns; i++) {
      u += `  .col-span-${i}\\@${suffix} { grid-column: span ${i} / span ${i}; }\n`
    }
    u += `  .col-span-full\\@${suffix} { grid-column: 1 / -1; }\n\n`

    u += `  /* --- Column start (full run, driven by config.columns) --- */\n`
    for (let i = 1; i <= columns; i++) {
      u += `  .col-start-${i}\\@${suffix} { grid-column-start: ${i}; }\n`
    }
    u += `\n`

    u += `  /* --- Text size --- */\n`
    const sizes = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl']
    for (const size of sizes) {
      u += `  .text-${size}\\@${suffix} { font-size: var(--text-size-${size}); }\n`
    }
    return u
  }

  for (const [name, px] of breakpoints) {
    const rem = px / 16
    
    respCss += `/* === @${name} — ${rem}rem / ${px}px === */\n`
    
    // @media
    respCss += `@media (min-width: ${rem}rem) {\n`
    respCss += generateUtilities(name)
    respCss += `}\n\n`

    // @container
    respCss += `@container (min-width: ${rem}rem) {\n`
    respCss += generateUtilities(`c-${name}`)
    respCss += `}\n\n`
  }

  fs.writeFileSync(responsivePath, respCss)
  console.log('✓ Generated properties/responsive.css')
}

// 2. Bundling with Cascade Layers
function bundle(filePath) {
  const dir = path.dirname(filePath)
  const content = fs.readFileSync(filePath, 'utf8')

  // Matches: @import "path" layer(name); or @import "path";
  const importRegex = /@import\s+['"]([^'"]+)['"](?:\s+layer\(([^)]+)\))?\s*;?/g

  return content.replace(importRegex, (_, importPath, layerName) => {
    const fullImportPath = path.resolve(dir, importPath)
    const bundledContent = bundle(fullImportPath)
    if (layerName) {
      return `@layer ${layerName.trim()} {\n${bundledContent}\n}`
    }
    return bundledContent
  })
}

// 3. Minification
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove comments
    .replace(/\r?\n|\t/g, ' ')          // Replace newlines/tabs with spaces
    .replace(/\s+/g, ' ')               // Collapse multiple spaces
    .replace(/\s*([{}|:;,])\s*/g, '$1') // Remove spaces around delimiters
    .trim()
}

// Main execution flow
try {
  compileConfig()

  const entryPath = path.join(__dirname, 'bear.css')
  const bundled = bundle(entryPath)
  const minified = minifyCSS(bundled)

  const distDir = path.resolve(__dirname, '../dist')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir)
  }

  fs.writeFileSync(path.join(distDir, 'bear.css'), minified)
  console.log('✓ built & minified → dist/bear.css')
} catch (err) {
  console.error('✗ Build failed:', err.message)
  process.exit(1)
}