// ACH-11 (design system §24): draws each rank's profile-header decoration and
// writes one JSON module per rank to features/profile/rank-decoration/generated/.
// Run with `npm run rank-decoration:generate`; never hand-edit the output.
//
// Two kinds of asset come out of it:
// - pieces: inline SVG markup in placeholder colours (#010101 the rank
//   pigment, #020202 the ground the ornament is cut into, #030303 shading),
//   which globals.css maps to tokens, so a token change needs no regeneration;
// - tiles: repeating bands and grounds as luminance masks (white = pigment,
//   black = nothing), painted in the pigment by CSS.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as G from './rank-decoration/geom.mjs'
import * as M from './rank-decoration/motifs.mjs'
import * as N from './rank-decoration/ornament.mjs'

const { P, deg, r2 } = G
const OUT = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'features',
	'profile',
	'rank-decoration',
	'generated',
)

const col = '#010101'
const cut = '#020202'
const shade = '#030303'
const o = { col, cut, shade, field: 0.12 }
const mask = { col: '#fff', cut: '#000', shade: null }

/** The avatar the portrait pieces are drawn around: 96px, as on desktop. */
const AR = 48

// ---- shared helpers

const spin = inner => `<g class="spin">${inner}</g>`

function piece(w, h, svg, extra = {}) {
	return { w: r2(w), h: r2(h), svg, ...extra }
}

/** A seamless tile: the motif is drawn at every position and its eight neighbours, clipped by the viewBox. */
function tile(w, h, positions, draw) {
	let s = `<rect width="${r2(w)}" height="${r2(h)}" fill="#000"/>`
	for (const [x, y, ...rest] of positions)
		for (const dx of [-w, 0, w])
			for (const dy of [-h, 0, h]) s += draw(P(x + dx, y + dy), ...rest)
	return tileOf(w, h, s)
}

function tileOf(w, h, inner) {
	const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${r2(w)}" height="${r2(h)}" viewBox="0 0 ${r2(w)} ${r2(h)}">${inner}</svg>`
	return {
		w: r2(w),
		h: r2(h),
		uri: `url("data:image/svg+xml,${encodeURIComponent(doc)}")`,
	}
}

function wreath(
	c,
	R,
	oo,
	{ both = false, top = 18, count = 11, size = 14, start = 14 } = {},
) {
	let s = ''
	for (const sd of [-1, 1]) {
		const pts = []
		const a0 = deg(90 - start)
		const a1 = deg(-90 + top)
		for (let i = 0; i <= 60; i++) {
			const a = a0 + (a1 - a0) * (i / 60)
			pts.push(
				P(
					c.x + R * Math.cos(sd > 0 ? a : Math.PI - a),
					c.y + R * Math.sin(sd > 0 ? a : Math.PI - a),
				),
			)
		}
		s += G.laurel(pts, {
			count,
			Lmax: size,
			Lmin: size * 0.6,
			spread: 36,
			col: oo.col,
			cut: oo.cut,
			shade: oo.shade,
			stem: 1.5,
			both,
			bend: 0.1,
		})
	}
	return s
}

function rinceau(x0, x1, yc, h, oo, phase = 0) {
	const { col: c, cut: k, shade: sh } = oo
	const period = h * 3.6
	const A = h * 0.18
	let s = ''
	const pts = []
	for (let x = x0; x <= x1; x += 1)
		pts.push(P(x, yc + A * Math.sin(((x - x0) / period) * Math.PI * 2 + phase)))
	s += G.path(
		G.taper(pts, () => h * 0.045, 300),
		{ fill: c },
	)
	let n = 0
	for (
		let x = x0 + period * 0.12;
		x < x1 - period * 0.42;
		x += period / 2, n++
	) {
		const sd = n % 2 === 0 ? -1 : 1
		const by = yc + A * Math.sin(((x - x0) / period) * Math.PI * 2 + phase)
		const r0 = h * 0.26
		const cc = P(x + period * 0.2, by + sd * h * 0.1)
		const a0 = sd < 0 ? Math.PI * 0.8 : -Math.PI * 0.8
		const sp = G.spiral(cc, r0, r0 * 0.25, a0, sd * Math.PI * 1.5, 60)
		s += G.path(
			G.taper([P(x, by), ...sp], u => h * 0.04 * (1 - 0.7 * u) + 0.15, 80),
			{ fill: c },
		)
		const eye = sp[sp.length - 1]
		if (n % 2 === 0) s += N.flower(eye, h * 0.17, { col: c, cut: k, shade: sh })
		else s += G.berry(eye, h * 0.06, c, k)
		s += G.leaf({
			at: P(x + 1, by),
			ang: deg(sd < 0 ? -150 : 150),
			L: h * 0.42,
			W: h * 0.17,
			bend: 0.12,
			side: -sd,
			col: c,
			cut: k,
			shade: sh,
			hatch: false,
			outline: 0.5,
		})
		s += G.leaf({
			at: P(x + 1, by),
			ang: deg(sd < 0 ? -110 : 110),
			L: h * 0.3,
			W: h * 0.12,
			bend: 0.12,
			side: -sd,
			col: c,
			cut: k,
			shade: sh,
			hatch: false,
			outline: 0.5,
		})
		const m = sp[Math.round(sp.length * 0.28)]
		s += G.leaf({
			at: m,
			ang: Math.atan2(m.y - cc.y, m.x - cc.x) + deg(sd * 30),
			L: h * 0.3,
			W: h * 0.13,
			bend: 0.1,
			side: sd,
			col: c,
			cut: k,
			shade: sh,
			hatch: false,
			outline: 0.45,
		})
	}
	return s
}

/** A rinceau band tile one period wide, `band` tall; vertical when `vertical`. */
function rinceauTile(band, vertical = false) {
	const h = band - (band > 30 ? 10 : 8)
	const period = h * 3.6
	const inner = `<rect width="${vertical ? band : r2(period)}" height="${vertical ? r2(period) : band}" fill="#000"/>`
	const art = rinceau(-period, 2 * period, band / 2, h, mask)
	return vertical
		? tileOf(
				band,
				period,
				inner + `<g transform="matrix(0 1 -1 0 ${band} 0)">${art}</g>`,
			)
		: tileOf(period, band, inner + art)
}

// ---- corner pieces

function strapCorner(k) {
	const T = (x, y) => P(x * k, y * k)
	const c = T(24, 24)
	const band = (d, w) =>
		G.path(d, {
			fill: 'none',
			stroke: cut,
			'stroke-width': w + 4,
			'stroke-linejoin': 'round',
		}) +
		G.path(d, {
			fill: 'none',
			stroke: col,
			'stroke-width': w,
			'stroke-linejoin': 'round',
		}) +
		G.path(d, {
			fill: 'none',
			stroke: cut,
			'stroke-width': 0.8,
			'stroke-linejoin': 'round',
		})
	const a0 = 13 * k
	const sq = [
		P(c.x - a0, c.y - a0),
		P(c.x + a0, c.y - a0),
		P(c.x + a0, c.y + a0),
		P(c.x - a0, c.y + a0),
	]
	const dd = a0 * Math.SQRT2
	const lz = [
		P(c.x, c.y - dd),
		P(c.x + dd, c.y),
		P(c.x, c.y + dd),
		P(c.x - dd, c.y),
	]
	let knot = band(G.pathFromPoly(sq), 3.4) + band(G.pathFromPoly(lz), 3.4)
	const e = dd - a0
	const g4 = 4.2 * k
	for (const [x0, y0, x1, y1] of [
		[a0, -e - g4, a0, -e + g4],
		[e - g4, a0, e + g4, a0],
		[-a0, e - g4, -a0, e + g4],
		[-e - g4, -a0, -e + g4, -a0],
	])
		knot += band(
			`M${r2(c.x + x0)} ${r2(c.y + y0)}L${r2(c.x + x1)} ${r2(c.y + y1)}`,
			3.4,
		)
	const R = 15.5 * k * 0.42
	knot += band(
		`M${r2(c.x - R)} ${r2(c.y)}a${r2(R)} ${r2(R)} 0 1 0 ${r2(2 * R)} 0a${r2(R)} ${r2(R)} 0 1 0 ${r2(-2 * R)} 0`,
		2.2,
	)
	knot += G.circle(c, 6.4 * k * 0.8, {
		fill: col,
		stroke: cut,
		'stroke-width': 0.8,
	})
	knot += G.circle(G.add(c, P(-1.6 * k, -1.6 * k)), 1.4 * k, { fill: cut })
	let s = spin(knot)
	for (const p of [T(60, 7.5), T(7.5, 60)])
		s += G.circle(p, 6 * k * 0.8, { fill: cut }) + N.flower(p, 5 * k * 0.8, o)
	const tip = P(c.x + a0 + 1.5, c.y + a0 + 1.5)
	s += G.leaf({
		at: tip,
		ang: deg(45),
		L: 15 * k,
		W: 6.5 * k,
		col,
		cut,
		shade,
		hatch: false,
		outline: 0.6,
	})
	for (const sd of [-1, 1])
		s += G.leaf({
			at: tip,
			ang: deg(45 + sd * 48),
			L: 10 * k,
			W: 4.6 * k,
			col,
			cut,
			shade,
			hatch: false,
			outline: 0.6,
		})
	return piece(66 * k, 66 * k, s)
}

function acanthusCorner(long, short) {
	let s = ''
	s += N.scroll({
		from: P(30, 16),
		c: P(long - 34, 34),
		r0: 18,
		dir: 1,
		startAng: -Math.PI / 2 - 0.2,
		sweep: 1.55,
		stem: 2.6,
		col,
		cut,
		shade,
		end: 'flower',
		leaves: 2,
		lead: [P(28, 15), P(60, 6), P(long - 70, 10), P(long - 37.5, 16.3)],
	})
	s += N.scroll({
		from: P(16, 30),
		c: P(32, short - 22),
		r0: 13,
		dir: -1,
		startAng: Math.PI + 0.2,
		sweep: 1.5,
		stem: 2.2,
		col,
		cut,
		shade,
		end: 'bud',
		leaves: 1,
		lead: [P(15, 28), P(7, 42), P(10, short - 44), P(19.1, short - 22)],
	})
	s += G.circle(P(18, 18), 17, { fill: cut })
	s += spin(N.flower(P(18, 18), 15, { col, cut, shade, n: 6 }))
	return piece(long + 6, short + 6, s)
}

// ---- the six ranks

function initiate() {
	const fleuron = `<rect x="6" y="3" width="128" height="10" fill="${cut}"/><g class="breathe">${M.fleuron(P(70, 8), 124, o)}</g>`
	const c = P(57, 57)
	let r = G.circle(c, AR + 5, { fill: 'none', stroke: col, 'stroke-width': 1 })
	for (let i = 0; i < 4; i++) {
		const a = (i * Math.PI) / 2
		const p = P(c.x + Math.cos(a) * (AR + 5), c.y + Math.sin(a) * (AR + 5))
		r += `<rect x="${r2(p.x - 2.6)}" y="${r2(p.y - 2.6)}" width="5.2" height="5.2" fill="${col}" stroke="${cut}" stroke-width="1" transform="rotate(45 ${r2(p.x)} ${r2(p.y)})"/>`
	}
	return {
		pieces: {
			fleuron: piece(140, 16, fleuron),
			ring: piece(114, 114, spin(r)),
		},
		tiles: {},
	}
}

function apprentice() {
	const c = P(61, 61)
	const ring =
		spin(N.cordRing(c, AR + 6, { col, cut, w: 3.4 })) +
		G.circle(c, AR + 11.5, { fill: 'none', stroke: col, 'stroke-width': 0.8 })
	const wave = tileOf(
		26,
		16,
		`<rect width="26" height="16" fill="#000"/>${N.runningDog(-52, 78, 14.5, 14, { col: '#fff', period: 26, weight: 1.6, light: 0.2 })}`,
	)
	return {
		pieces: {
			boss: piece(10, 10, G.berry(P(5, 5), 4, col, cut)),
			ring: piece(122, 122, ring),
		},
		tiles: { band: wave },
	}
}

function artisan() {
	const c = P(64, 64)
	let pr = G.pearlRing(c, AR + 9, 44, 2.3, col, cut)
	for (let i = 0; i < 4; i++) {
		const a = (i * Math.PI) / 2 + Math.PI / 4
		const p = P(c.x + Math.cos(a) * (AR + 9), c.y + Math.sin(a) * (AR + 9))
		pr += G.circle(p, 5.5, { fill: cut }) + G.berry(p, 4.6, col, cut)
	}
	const ring =
		G.circle(c, AR + 4, { fill: 'none', stroke: col, 'stroke-width': 0.8 }) +
		G.circle(c, AR + 14, { fill: 'none', stroke: col, 'stroke-width': 0.8 }) +
		spin(pr)
	const lozenge = p => {
		let s = G.path(
			`M${r2(p.x)} ${r2(p.y - 10.8)}L${r2(p.x + 15)} ${r2(p.y)}L${r2(p.x)} ${r2(p.y + 10.8)}L${r2(p.x - 15)} ${r2(p.y)}Z`,
			{ fill: 'none', stroke: '#fff', 'stroke-width': 0.7 },
		)
		for (let i = 0; i < 4; i++)
			s += G.circle(G.add(p, G.rot(P(1.6, 0), (i * Math.PI) / 2)), 1.2, {
				fill: '#fff',
			})
		return s
	}
	return {
		pieces: {
			corner: strapCorner(1.35),
			cornerCompact: strapCorner(1.05),
			ring: piece(128, 128, ring),
		},
		tiles: {
			ground: tile(
				30,
				43.2,
				[
					[15, 10.8],
					[0, 32.4],
				],
				lozenge,
			),
			band: tileOf(
				20,
				8,
				`<rect width="20" height="8" fill="#000"/>${M.beadReel(-20, 40, 4, { ...mask, h: 8, step: 20 })}`,
			),
		},
	}
}

function maestro() {
	const cc = P(100, 22)
	let head = `<ellipse cx="${cc.x}" cy="${cc.y}" rx="44" ry="25" fill="${cut}"/>`
	head += `<ellipse cx="${cc.x}" cy="${cc.y}" rx="40" ry="21" fill="${col}" class="field2" stroke="${col}" stroke-width="1.5"/>`
	head += `<ellipse cx="${cc.x}" cy="${cc.y}" rx="36" ry="17.5" fill="none" stroke="${col}" stroke-width="0.6"/>`
	head += M.giglio(P(cc.x, cc.y + 0.5), 32, o)
	for (const sd of [-1, 1])
		head += N.acanthus({
			at: P(cc.x + sd * 42, cc.y + 2),
			ang: sd < 0 ? Math.PI - deg(8) : deg(8),
			L: 46,
			W: 20,
			curl: 0.18,
			lobes: 3,
			flip: sd < 0 ? 1 : -1,
			col,
			cut,
			shade,
		})
	const c = P(86, 86)
	const ring =
		G.circle(c, AR + 4, { fill: 'none', stroke: col, 'stroke-width': 1.3 }) +
		spin(G.pearlRing(c, AR + 8.5, 46, 1.7, col, cut)) +
		wreath(c, AR + 18, o, { top: 40, count: 9, size: 17 }) +
		N.banderoleTails(P(c.x, c.y + AR + 18), o, 0.75)
	return {
		pieces: {
			corner: acanthusCorner(190, 96),
			cornerBottom: acanthusCorner(130, 80),
			cornerCompact: acanthusCorner(120, 70),
			cornerBottomCompact: acanthusCorner(90, 60),
			head: piece(200, 50, head),
			ring: piece(172, 172, ring),
		},
		tiles: {
			ground: tile(
				58,
				88,
				[
					[29, 22],
					[0, 66],
				],
				p => M.giglio(p, 18, { col: '#fff', cut: '#000' }),
			),
		},
	}
}

function virtuoso() {
	const block = b =>
		piece(
			b,
			b,
			`<rect width="${b}" height="${b}" fill="${cut}"/><rect width="${b}" height="${b}" fill="${col}" class="field2" stroke="${col}" stroke-width="1.5"/>${G.star8(P(b / 2, b / 2), b * 0.36, o)}`,
		)
	const cc = P(90, 36)
	let head = ''
	for (const sd of [-1, 1])
		head += N.acanthus({
			at: P(cc.x + sd * 26, cc.y + 6),
			ang: sd < 0 ? Math.PI - deg(12) : deg(12),
			L: 58,
			W: 24,
			curl: 0.2,
			lobes: 3,
			flip: sd < 0 ? 1 : -1,
			col,
			cut,
			shade,
			tipCurl: 1,
		})
	head += G.circle(cc, 30, { fill: cut })
	head += spin(N.aureole(cc, 20, 30, 32, { col }))
	head += G.circle(cc, 20, { fill: cut, stroke: col, 'stroke-width': 1.4 })
	head += `<circle cx="${cc.x}" cy="${cc.y}" r="20" fill="${col}" class="field2"/>`
	head += G.star8(cc, 15, o)
	const c = P(85, 85)
	let ring =
		G.circle(c, AR + 4, { fill: 'none', stroke: col, 'stroke-width': 1.3 }) +
		G.pearlRing(c, AR + 8.5, 48, 1.8, col, cut)
	ring += wreath(c, AR + 19, o, { top: 15, count: 12, size: 16 })
	ring +=
		G.circle(P(c.x, c.y - AR - 21), 11, { fill: cut }) +
		G.star8(P(c.x, c.y - AR - 21), 11, o)
	ring += N.banderoleTails(P(c.x, c.y + AR + 19), o, 0.8)
	const star = (p, r) =>
		G.star8(p, r, { col: '#fff', cut: '#000', inner: false })
	return {
		pieces: {
			block: block(32),
			blockCompact: block(26),
			head: piece(180, 70, head),
			ring: piece(170, 170, ring),
		},
		tiles: {
			ground: tile(
				92,
				76,
				[
					[23, 19, 5.6],
					[46, 57, 4.2],
				],
				star,
			),
			twinkleA: tile(92, 76, [[69, 19, 5.6]], star),
			twinkleB: tile(92, 76, [[0, 57, 4.2]], star),
			band: rinceauTile(32),
			bandCompact: rinceauTile(26),
		},
	}
}

function laureate() {
	const medallion = band => {
		const R = band * 0.62
		const c = P(R + 4, R + 4)
		let s = G.circle(c, R + 3, { fill: cut })
		s += `<circle cx="${r2(c.x)}" cy="${r2(c.y)}" r="${r2(R)}" fill="${col}" class="field2" stroke="${col}" stroke-width="1.6"/>`
		s += G.pearlRing(c, R - 4.5, Math.round(R * 1.6), 1.5, col, cut)
		s += spin(N.flower(c, R * 0.62, { col, cut, shade, n: 6 }))
		return piece(2 * R + 8, 2 * R + 8, s)
	}
	const cc = P(120, 25)
	let head = ''
	for (const sd of [-1, 1])
		head += N.acanthus({
			at: P(cc.x + sd * 50, cc.y + 6),
			ang: sd < 0 ? Math.PI - deg(10) : deg(10),
			L: 64,
			W: 26,
			curl: 0.2,
			lobes: 3,
			flip: sd < 0 ? 1 : -1,
			col,
			cut,
			shade,
			tipCurl: 1,
		})
	head += `<ellipse cx="${cc.x}" cy="${cc.y}" rx="54" ry="30" fill="${cut}"/>`
	head += `<ellipse cx="${cc.x}" cy="${cc.y}" rx="50" ry="26.5" fill="${col}" class="field2" stroke="${col}" stroke-width="1.6"/>`
	head += `<ellipse cx="${cc.x}" cy="${cc.y}" rx="45" ry="21.5" fill="none" stroke="${col}" stroke-width="0.6"/>`
	head += M.crown(P(cc.x, cc.y + 3), 44, o)
	for (const sd of [-1, 1])
		head += G.laurel(
			G.cubicsToPoly([
				[
					P(cc.x + sd * 6, cc.y + 19),
					P(cc.x + sd * 24, cc.y + 21),
					P(cc.x + sd * 40, cc.y + 12),
					P(cc.x + sd * 42, cc.y - 8),
				],
			]),
			{ count: 7, Lmax: 10, Lmin: 6, col, cut, shade, stem: 1, berries: false },
		)
	// one festoon between two hang points 150px apart
	const a = P(8, 8)
	const b = P(158, 8)
	let swag = N.garland(a, b, 26, { ...o, size: 13, seed: 11, wraps: 2 })
	for (const p of [a, b]) {
		swag += G.ribbon(
			G.cubicsToPoly([
				[
					P(p.x, p.y + 2),
					P(p.x + 4, p.y + 12),
					P(p.x - 4, p.y + 24),
					P(p.x + 1, p.y + 36),
				],
			]),
			5,
			o,
		)
		swag += G.circle(p, 7.5, { fill: cut }) + N.flower(p, 7, o)
	}
	const c = P(104, 104)
	const aureole = spin(
		`<g class="breathe">${N.aureole(c, AR + 16, AR + 56, 48, { col })}</g>`,
	)
	let ring =
		G.circle(c, AR + 3.5, { fill: 'none', stroke: col, 'stroke-width': 1.6 }) +
		N.cordRing(c, AR + 8.5, { col, cut, w: 3 }) +
		G.pearlRing(c, AR + 13.5, 56, 1.6, col, cut)
	ring += wreath(c, AR + 24, o, { both: true, top: 22, count: 12, size: 15 })
	ring +=
		G.circle(P(c.x, c.y - AR - 30), 16, { fill: cut }) +
		M.crown(P(c.x, c.y - AR - 29), 34, o)
	ring += N.banderoleTails(P(c.x, c.y + AR + 24), o, 1)
	return {
		pieces: {
			medallion: medallion(38),
			medallionCompact: medallion(28),
			head: piece(240, 64, head),
			garland: piece(166, 70, swag),
			aureole: piece(208, 208, aureole),
			ring: piece(208, 208, ring),
		},
		tiles: {
			ground: tile(
				84,
				152,
				[
					[42, 38],
					[0, 114],
				],
				p => M.pomegranate(p, 42, { col: '#fff', cut: '#000' }),
			),
			band: rinceauTile(38),
			bandVertical: rinceauTile(38, true),
			bandCompact: rinceauTile(28),
			bandVerticalCompact: rinceauTile(28, true),
		},
	}
}

const RANKS = { initiate, apprentice, artisan, maestro, virtuoso, laureate }

mkdirSync(OUT, { recursive: true })
for (const [slug, build] of Object.entries(RANKS)) {
	const data = build()
	const file = join(OUT, `${slug}.json`)
	writeFileSync(file, JSON.stringify(data) + '\n')
	console.log(
		`${slug}.json  ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`,
	)
}
