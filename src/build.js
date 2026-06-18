// build.js — zero dependency bundler
const fs   = require('fs')
const path = require('path')
 
function bundle(filePath) {
  const dir     = path.dirname(filePath)
  const content = fs.readFileSync(filePath, 'utf8')
 
  return content.replace(/@import\s+['"](.+?)['"]\s*;?/g, (_, importPath) => {
    return bundle(path.join(dir, importPath))
  })
}
 
const output = bundle('./src/bear.css')
fs.writeFileSync('./dist/bear.css', output)
console.log('✓ built → dist/bear.css')
 