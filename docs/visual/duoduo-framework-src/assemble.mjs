// Inline the Vite build (dist/assets/*.css, *.js) into one HTML fragment for the Artifact tool.
// The fragment has no <!doctype>, <html>, <head> or <body>: the Artifact tool adds them at publish time.
// Usage: node assemble.mjs <fragment.html> [preview.html]
import fs from 'node:fs'

const dir = 'dist/assets/'
const files = fs.readdirSync(dir)
const css = fs.readFileSync(dir + files.find(x => x.endsWith('.css')), 'utf8')
const js = fs.readFileSync(dir + files.find(x => x.endsWith('.js')), 'utf8').replace(/<\/script/gi, '<\\/script')
const frag = `<title>duoduo 运作原理</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500;700;900&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
fs.writeFileSync(process.argv[2], frag)
if (process.argv[3]) {
  fs.writeFileSync(process.argv[3], '<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">' + frag + '</body></html>')
}
console.log(`${process.argv[2]}: ${frag.length} chars`)
