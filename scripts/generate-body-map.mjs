// PROG-15: writes the body map's figure, front and back, to
// features/body-map/generated/body-map.json (typed by body-map-geometry.ts)
// from the right-half drawing in
// scripts/body-map/geometry.mjs: the arm turned out, the figure widened for it
// and every shape mirrored. Run with `npm run body-map:generate`; never
// hand-edit the output.
//
// `--preview <file.png>` also renders both views in both themes with a sample
// week, for reviewing the drawing; nothing it writes ships.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
	ARM_ANGLE,
	ARM_MUSCLES,
	ARM_PIVOT,
	BACK,
	DETAILS,
	FRONT,
	HEIGHT,
	OUTLINE_ARM,
	OUTLINE_BOTTOM,
	OUTLINE_TOP,
	WIDTH,
} from './body-map/geometry.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'features', 'body-map', 'generated', 'body-map.json')

/** The drawing is authored 200 wide; open arms need this much more per side. */
const MARGIN = 42
const BOX = WIDTH + 2 * MARGIN

const r = n => String(Math.round(n * 10) / 10)

/** Path data (absolute M, C, L and Z only) as a list of commands. */
const parse = d => {
	const tokens = d.match(/[MCLZ]|-?\d+(?:\.\d+)?/g)
	const commands = []
	for (let i = 0; i < tokens.length;) {
		const op = tokens[i++]
		const count = { M: 2, L: 2, C: 6, Z: 0 }[op]
		if (count === undefined) throw new Error(`unsupported command ${op}`)
		commands.push([op, ...tokens.slice(i, i + count).map(Number)])
		i += count
	}
	return commands
}

const mapPoints = (command, fn) => {
	const [op, ...v] = command
	const out = [op]
	for (let i = 0; i < v.length; i += 2) out.push(...fn(v[i], v[i + 1]))
	return out
}

const angle = (ARM_ANGLE * Math.PI) / 180
const turn = (x, y) => {
	const dx = x - ARM_PIVOT[0]
	const dy = y - ARM_PIVOT[1]
	return [
		ARM_PIVOT[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
		ARM_PIVOT[1] + dx * Math.sin(angle) + dy * Math.cos(angle),
	]
}
const turnArm = commands => commands.map(c => mapPoints(c, turn))
const shift = commands =>
	commands.map(c => mapPoints(c, (x, y) => [x + MARGIN, y]))
const mirror = commands =>
	commands.map(c => mapPoints(c, (x, y) => [BOX - x, y]))

const toD = commands =>
	commands
		.map(([op, ...v]) => (op === 'Z' ? 'Z' : `${op}${v.map(r).join(' ')}`))
		.join('')

/** The outline's left half, walked from the crotch back up to the head. */
const reversed = half => {
	const points = [half[0].slice(1)]
	for (const c of half.slice(1)) points.push(c.slice(-2))
	const out = []
	for (let i = half.length - 1; i >= 1; i--) {
		const c = half[i]
		const start = points[i - 1]
		out.push(
			c[0] === 'C'
				? ['C', c[3], c[4], c[1], c[2], start[0], start[1]]
				: ['L', start[0], start[1]],
		)
	}
	return out
}

const top = parse(OUTLINE_TOP)
// The deltoid's last control point and end belong to the arm.
const deltoid = top[top.length - 1]
const [c2x, c2y] = turn(deltoid[3], deltoid[4])
const [ex, ey] = turn(deltoid[5], deltoid[6])
top[top.length - 1] = ['C', deltoid[1], deltoid[2], c2x, c2y, ex, ey]
const half = shift([
	...top,
	...turnArm(parse(OUTLINE_ARM)),
	...parse(OUTLINE_BOTTOM),
])
const outline = toD([...half, ...mirror(reversed(half)), ['Z']])

const both = commands => {
	const right = shift(commands)
	return toD(right) + toD(mirror(right))
}

const regions = view =>
	Object.entries(view).map(([muscle, plates]) => {
		const onArm = ARM_MUSCLES.includes(muscle)
		return {
			muscle,
			d: plates
				.map(parse)
				.map(plate => both(onArm ? turnArm(plate) : plate))
				.join(''),
		}
	})

const details = list =>
	list.map(({ d, arm }) => both(arm ? turnArm(parse(d)) : parse(d))).join('')

const front = regions(FRONT)
const back = regions(BACK)
const frontDetails = details(DETAILS.FRONT)
const backDetails = details(DETAILS.BACK)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
	OUT,
	`${JSON.stringify(
		{
			viewBox: `0 0 ${BOX} ${HEIGHT}`,
			outline,
			front,
			back,
			frontDetails,
			backDetails,
		},
		null,
		'	',
	)}
`,
)
console.log(`wrote ${OUT}`)

const previewAt = process.argv.indexOf('--preview')
if (previewAt !== -1) {
	const file = process.argv[previewAt + 1]
	const { default: sharp } = await import('sharp')
	const themes = [
		{ ground: '#f6f2ea', body: '#d9d3c7', ink: '#3a3128' },
		{ ground: '#211d19', body: '#3b352f', ink: '#ede8df' },
	]
	const mix = (a, b, t) => {
		const pa = a.match(/\w\w/g).map(h => parseInt(h, 16))
		const pb = b.match(/\w\w/g).map(h => parseInt(h, 16))
		return `#${pa
			.map((v, i) =>
				Math.round(v + (pb[i] - v) * t)
					.toString(16)
					.padStart(2, '0'),
			)
			.join('')}`
	}
	const shares = [0, 0.22, 0.4, 0.58, 0.78, 1]
	// A plausible week, in completed-set equivalents, banded as the app bands it.
	const week = {
		PECTORAL: 12,
		ANTERIOR_DELTOIDS: 9,
		MEDIAL_DELTOIDS: 6,
		REAR_DELTOIDS: 4,
		TRICEPS: 8,
		BICEPS: 6,
		FOREARMS: 2,
		LATISSIMUS_DORSI: 11,
		TERES_MAJOR_MINOR: 4,
		TRAPEZIUS: 3,
		ERECTOR_SPINAE: 2,
		CORE: 4,
		QUADRICEPS: 16,
		HAMSTRINGS: 7,
		GLUTES: 9,
		ADDUCTOR: 3,
		CALVES: 0,
	}
	const level = muscle => {
		const sets = week[muscle] ?? 0
		if (sets <= 0) return 0
		return 1 + [5, 10, 15, 20].filter(edge => sets >= edge).length
	}
	const seam =
		'stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"'
	const figure = (theme, view, lines, dx) => `
		<g transform="translate(${dx} 0)">
			<path d="${outline}" fill="${theme.body}"/>
			${view
				.map(
					({ muscle, d }) =>
						`<path d="${d}" fill="${mix(theme.body, theme.ink, shares[level(muscle)])}" stroke="${theme.ground}" ${seam}/>`,
				)
				.join('')}
			<path d="${lines}" fill="none" stroke="${theme.ground}" ${seam}/>
		</g>`
	const panel = 2 * BOX
	const panels = themes
		.map(
			(theme, i) => `
		<g transform="translate(${i * panel} 0)">
			<rect width="${panel}" height="${HEIGHT}" fill="${theme.ground}"/>
			${figure(theme, front, frontDetails, 0)}
			${figure(theme, back, backDetails, BOX)}
		</g>`,
		)
		.join('')
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${2 * panel}" height="${HEIGHT}" viewBox="0 0 ${2 * panel} ${HEIGHT}">${panels}</svg>`
	await sharp(Buffer.from(svg), { density: 216 }).png().toFile(file)
	console.log(`preview ${file}`)
}
