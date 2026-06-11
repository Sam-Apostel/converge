/**
 * Generates all favicon / PWA icon assets from the Converge brand mark.
 *
 * The on-screen logo (`src/components/converge-logo.tsx`) uses a real CSS
 * `backdrop-filter` for its glass, which can't be rasterised. This script
 * renders a *baked* SVG that approximates the frosted glass with gradients so
 * it survives flattening to PNG/ICO.
 *
 * Run:  bun run generate-icons
 */
import { Resvg } from '@resvg/resvg-js'
import pngToIco from 'png-to-ico'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public')
mkdirSync(out, { recursive: true })

// --- brand geometry (64×64 design space) -----------------------------------
const ARC =
  'M51.447,50.491c0.556,0.528 0.839,1.282 0.767,2.046c-0.071,0.763 -0.489,1.452 -1.134,1.867c-4.262,2.604 -9.307,4.126 -14.715,4.126c-15.117,0 -27.39,-11.888 -27.39,-26.53c0,-14.642 12.273,-26.53 27.39,-26.53c5.408,-0 10.453,1.522 14.701,4.147c0.638,0.411 1.052,1.093 1.123,1.849c0.071,0.756 -0.209,1.502 -0.759,2.025c-1.905,1.845 -4.633,4.438 -6.227,5.953c-0.756,0.719 -1.88,0.892 -2.817,0.435c-1.815,-0.873 -3.861,-1.351 -6.021,-1.351c-7.677,-0 -13.909,6.037 -13.909,13.472c0,7.435 6.232,13.472 13.909,13.472c2.16,0 4.206,-0.478 6.03,-1.331c0.93,-0.453 2.043,-0.281 2.792,0.431c1.61,1.499 4.338,4.092 6.26,5.919Z'
const SHOULDERS =
  'M51.481,50.523c0.547,0.52 0.826,1.262 0.756,2.014c-0.07,0.751 -0.48,1.43 -1.114,1.84c-4.271,2.621 -9.331,4.153 -14.758,4.153c-5.428,0 -10.488,-1.532 -14.746,-4.174c-0.627,-0.406 -1.034,-1.077 -1.103,-1.822c-0.069,-0.744 0.207,-1.479 0.749,-1.994c1.914,-1.852 4.678,-4.479 6.279,-6.001c0.746,-0.709 1.854,-0.879 2.779,-0.427c1.82,0.878 3.873,1.36 6.042,1.36c2.168,0 4.221,-0.482 6.051,-1.34c0.916,-0.449 2.014,-0.28 2.754,0.423c1.616,1.506 4.38,4.133 6.311,5.968Z'

export const THEME_COLOR = '#2a4eac'
export const BACKGROUND_COLOR = '#1f3f97'

/**
 * Build the baked icon SVG.
 * @param glyphScale  shrink the mark toward centre (1 = full bleed). Maskable
 *                    icons need the glyph inside the central 80% safe zone.
 * @param bleed       paint the blue tile to the edges (PWA / apple). When false
 *                    the background is transparent (unused, kept for clarity).
 */
function iconSvg(glyphScale = 0.9, bleed = true): string {
  const t = `translate(32,32) scale(${glyphScale}) translate(-32,-32)`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="22%" cy="14%" r="125%">
      <stop offset="0%" stop-color="#7e9ce4"/>
      <stop offset="42%" stop-color="#4a6fcf"/>
      <stop offset="78%" stop-color="#2a4eac"/>
      <stop offset="100%" stop-color="#1f3f97"/>
    </radialGradient>
    <clipPath id="arc"><path d="${ARC}"/></clipPath>
    <linearGradient id="frost" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eef3ff" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="#dbe6ff" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#c7d6ff" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="tint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff1a8" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffd400" stop-opacity="0.34"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="0.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="64" height="64" fill="${bleed ? 'url(#bg)' : 'none'}"/>
  ${
    bleed
      ? `<g fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="0.4">
    <circle cx="22" cy="28" r="20"/><circle cx="22" cy="28" r="34"/><circle cx="22" cy="28" r="48"/>
    <path d="M21.5 -4 V68 M-4 28.5 H68 M43 -4 V68 M-4 52 H68"/>
  </g>`
      : ''
  }

  <g transform="${t}">
    <!-- frosted glass C -->
    <g clip-path="url(#arc)">
      <path d="${ARC}" fill="url(#frost)"/>
      <path d="${ARC}" fill="url(#tint)"/>
      <path d="${ARC}" fill="none" stroke="#fff6b0" stroke-width="2.4" stroke-opacity="0.55" filter="url(#glow)"/>
      <path d="${ARC}" fill="url(#sheen)"/>
      <path d="${ARC}" fill="none" stroke="#ffe865" stroke-width="0.5" stroke-opacity="0.7"/>
    </g>
    <!-- person -->
    <g fill="#ffdf00" filter="url(#bloom)">
      <ellipse cx="36.365" cy="32" rx="8.902" ry="8.623"/>
      <path d="${SHOULDERS}"/>
    </g>
  </g>
</svg>`
}

function render(svg: string, size: number): Buffer {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  return r.render().asPng()
}

function png(name: string, size: number, glyphScale: number) {
  const buf = render(iconSvg(glyphScale), size)
  writeFileSync(join(out, name), buf)
  console.log(`  ${name}  (${size}×${size})`)
}

console.log('Generating Converge icons →', out)

// Scalable favicon + PWA SVG icon
writeFileSync(join(out, 'favicon.svg'), iconSvg(0.92))
console.log('  favicon.svg')

// Standard maskable/any PWA icons
png('icon-192.png', 192, 0.9)
png('icon-512.png', 512, 0.9)
png('icon-192-maskable.png', 192, 0.72)
png('icon-512-maskable.png', 512, 0.72)

// Apple touch icon (opaque, iOS rounds the corners itself)
png('apple-touch-icon.png', 180, 0.82)

// PWA install / store screenshots are optional; multi-res favicon.ico:
const icoSizes = [16, 32, 48]
const icoPngs = icoSizes.map((s) => render(iconSvg(0.98), s))
const ico = await pngToIco(icoPngs)
writeFileSync(join(out, 'favicon.ico'), ico)
console.log('  favicon.ico  (16/32/48)')

console.log('Done.')
