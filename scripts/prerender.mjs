import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const template = readFileSync(resolve(root, 'dist/index.html'), 'utf8')
const { render } = await import(resolve(root, 'dist-ssr/entry-server.js'))

const html = template.replace('<!--app-html-->', render())
writeFileSync(resolve(root, 'dist/index.html'), html)
console.log('prerendered dist/index.html (%d KB)', Math.round(html.length / 1024))
