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
  const typePath = path.join(__dirname, 'primitives/type.css')
  const ratio = config['type-scale-ratio']
  const formatRem = (val) => Number(val.toFixed(3)) + 'rem'

  let typeCss = `/* type.css — raw type scale, never used directly in HTML */\n`
  typeCss += `/* Automatically generated from config in bear.config.js — DO NOT EDIT DIRECTLY */\n\n`
  typeCss += `:root {\n`
  typeCss += `  --primitive-text-xs:   ${formatRem(1 / (ratio * ratio))};\n`
  typeCss += `  --primitive-text-sm:   ${formatRem(1 / ratio)};\n`
  typeCss += `  --primitive-text-base: 1rem;\n`
  typeCss += `  --primitive-text-md:   ${formatRem(ratio)};\n`
  typeCss += `  --primitive-text-lg:   ${formatRem(ratio * ratio)};\n`
  typeCss += `  --primitive-text-xl:   ${formatRem(ratio * ratio * ratio)};\n`
  typeCss += `  --primitive-text-2xl:  ${formatRem(ratio * ratio * ratio * ratio)};\n`
  typeCss += `  --primitive-text-3xl:  ${formatRem(ratio * ratio * ratio * ratio * ratio)};\n`
  typeCss += `}\n`
  fs.writeFileSync(typePath, typeCss)
  console.log('✓ Generated primitives/type.css')

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

    u += `  /* --- Grid columns --- */\n`
    for (const cols of [1, 2, 3, 4, 6, 12]) {
      u += `  .grid-cols-${cols}\\@${suffix} { grid-template-columns: repeat(${cols}, minmax(0, 1fr)); }\n`
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