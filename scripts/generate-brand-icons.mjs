/**
 * Generates every app icon from the brand mark (design system §18.2), so the
 * favicon, the installed PWA and the shell header all show the same glyph.
 *
 *   node scripts/generate-brand-icons.mjs
 *
 * The geometry is copied from `SunnsteelMark` in
 * components/brand/sunnsteel-lockup.tsx; change both together. Colours are the
 * Night theme's --background and --foreground (§4.2) as sRGB hex, the same
 * values the manifest and the viewport theme colour already use.
 *
 * sharp is a transitive dependency of next, so nothing is installed for this.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import sharp from 'sharp'

const GROUND = '#0f0c08' // Night --background
const INK = '#eeebe4' // Night --foreground
const INK_LIGHT = '#231d17' // Stone --foreground, for the SVG favicon

const MARK = `
	<circle cx="12" cy="7" r="4.5" />
	<path d="M3 18h18" />
	<path d="M8 14v8M16 14v8" />
	<path d="M4 16v4M20 16v4" />`

// The mark's inked extent in its 24-unit box: x 3-21, y 1.5-22.
const MARK_HEIGHT = 20.5
const MARK_CENTRE = { x: 12, y: 11.75 }

/** A square tile of `size` with the mark `fraction` of its height, centred. */
function tile(size, fraction, radius = 0) {
	const k = (fraction * size) / MARK_HEIGHT
	const tx = size / 2 - MARK_CENTRE.x * k
	const ty = size / 2 - MARK_CENTRE.y * k
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
	<rect width="${size}" height="${size}" rx="${radius}" fill="${GROUND}" />
	<g transform="translate(${tx} ${ty}) scale(${k})" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="butt">${MARK}
	</g>
</svg>`
}

const png = (svg, size) =>
	sharp(Buffer.from(svg), { density: 72 })
		.resize(size, size)
		.png({ compressionLevel: 9 })
		.toBuffer()

/** An ICO whose entries are embedded PNGs (supported everywhere since Vista). */
function ico(images) {
	const header = Buffer.alloc(6 + images.length * 16)
	header.writeUInt16LE(0, 0)
	header.writeUInt16LE(1, 2)
	header.writeUInt16LE(images.length, 4)
	let offset = header.length
	images.forEach(({ size, data }, i) => {
		const entry = 6 + i * 16
		header.writeUInt8(size >= 256 ? 0 : size, entry)
		header.writeUInt8(size >= 256 ? 0 : size, entry + 1)
		header.writeUInt8(0, entry + 2)
		header.writeUInt8(0, entry + 3)
		header.writeUInt16LE(1, entry + 4)
		header.writeUInt16LE(32, entry + 6)
		header.writeUInt32LE(data.length, entry + 8)
		header.writeUInt32LE(offset, entry + 12)
		offset += data.length
	})
	return Buffer.concat([header, ...images.map(image => image.data)])
}

const root = join(import.meta.dirname, '..')
const out = path => join(root, path)

// Full-bleed squares: the platform applies its own corner mask.
writeFileSync(out('public/icon-192.png'), await png(tile(192, 0.62), 192))
writeFileSync(out('public/icon-512.png'), await png(tile(512, 0.62), 512))
writeFileSync(
	out('public/apple-touch-icon.png'),
	await png(tile(180, 0.6), 180),
)
// Maskable: the mark's corners stay inside the 80% safe circle with room over.
writeFileSync(
	out('public/icon-512-maskable.png'),
	await png(tile(512, 0.5), 512),
)

// The .ico keeps the dark tile, so the mark reads on light and dark tab strips.
const icoSizes = [16, 32, 48]
const icoImages = await Promise.all(
	icoSizes.map(async size => ({
		size,
		data: await png(tile(size, 0.78, size * 0.18), size),
	})),
)
writeFileSync(out('app/favicon.ico'), ico(icoImages))

// The SVG favicon is the header mark itself: no tile, ink per colour scheme.
writeFileSync(
	out('public/icon.svg'),
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="1.5 1.25 21 21">
	<style>
		g { stroke: ${INK_LIGHT}; }
		@media (prefers-color-scheme: dark) { g { stroke: ${INK}; } }
	</style>
	<g fill="none" stroke-width="2" stroke-linecap="butt">${MARK}
	</g>
</svg>
`,
)

console.log('Brand icons written.')
