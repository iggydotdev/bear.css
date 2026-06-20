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
  scaleCss += `/* Automatically generated from config in src/primitives/index.css — DO NOT EDIT DIRECTLY */\n\n`
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
  typeCss += `/* Automatically generated from config in src/primitives/index.css — DO NOT EDIT DIRECTLY */\n\n`
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