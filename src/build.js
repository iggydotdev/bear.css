// build.js — zero dependency bundler
const fs   = require('fs')
const path = require('path')

function bundle(filePath) {
  const dir     = path.dirname(filePath)
  const content = fs.readFileSync(filePath, 'utf8')

  // Matches both:
  //   @import "path";
  //   @import "path" layer(name);
  return content.replace(
    /@import\s+['"](.+?)['"]\s*(?:layer\([^)]*\)\s*)?;?/g,
    (_, importPath) => bundle(path.join(dir, importPath))
  )
}

const output = bundle('./src/bear.css')
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist')
}
fs.writeFileSync('./dist/bear.css', output)
console.log('✓ built → dist/bear.css')