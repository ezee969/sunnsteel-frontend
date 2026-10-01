// Composite Renaissance motifs built from the primitives in geom.mjs.
import * as G from './geom.mjs'
const { P, deg, r2 } = G

const mirrorX = (pts, cx) => pts.map(p => P(2 * cx - p.x, p.y))

/** Florentine giglio in a 40 x 44 box, scaled to height h, centred at c. */
export function giglio(c, h, o) {
	const { col, cut } = o
	const k = h / 44
	const T = p => P(c.x + (p.x - 20) * k, c.y + (p.y - 22) * k)
	const poly = segs =>
		G.cubicsToPoly(
			segs.map(s => s.map(([x, y]) => P(x, y))),
			24,
		)
	// central petal
	const centreR = poly([
		[
			[20, 0.5],
			[21.6, 5],
			[25, 11],
			[24.4, 17.5],
		],
		[
			[24.4, 17.5],
			[24, 22],
			[22.2, 24.6],
			[21.6, 27],
		],
	])
	const centre = [...centreR, ...mirrorX(centreR, 20).reverse()]
	// right side petal: rises from the band, curls out and droops to a tip
	const sideR = poly([
		[
			[22.4, 27],
			[26, 24],
			[30.5, 19.5],
			[31.5, 14],
		],
		[
			[31.5, 14],
			[32.2, 10],
			[36.5, 8.6],
			[38.6, 11.4],
		],
		[
			[38.6, 11.4],
			[40.4, 13.8],
			[39, 17.6],
			[36, 19.2],
		],
		[
			[36, 19.2],
			[37.2, 16.6],
			[36.6, 13.6],
			[34.6, 13.6],
		],
		[
			[34.6, 13.6],
			[32.4, 13.6],
			[33, 20.5],
			[24.6, 28],
		],
	])
	// stamen: a stalk between the petals ending in a three-pointed bud
	const stalk = poly([
		[
			[21.8, 26.5],
			[23.5, 21],
			[25.2, 16],
			[27.2, 10.8],
		],
	])
	// band and the lower lobes
	const lowerR = poly([
		[
			[21.4, 30.8],
			[23.6, 33],
			[27.6, 33.6],
			[29.6, 37.4],
		],
		[
			[29.6, 37.4],
			[30.8, 39.8],
			[28.6, 42.6],
			[26.2, 41.2],
		],
		[
			[26.2, 41.2],
			[27.8, 40.6],
			[28.2, 38.8],
			[26.8, 37.6],
		],
		[
			[26.8, 37.6],
			[25, 36],
			[22, 35],
			[20.6, 33.6],
		],
	])
	const toD = pts => G.pathFromPoly(pts.map(T))
	let s = ''
	s += G.path(toD(centre), { fill: col })
	s += G.path(toD(sideR), { fill: col })
	s += G.path(toD(mirrorX(sideR, 20)), { fill: col })
	for (const st of [stalk, mirrorX(stalk, 20)]) {
		s += G.path(
			G.taper(st.map(T), u => (0.9 - 0.5 * u) * k),
			{ fill: col },
		)
		const tip = T(st[st.length - 1])
		const dir = G.norm(G.sub(T(st[st.length - 1]), T(st[st.length - 4])))
		for (const a of [-40, 0, 40]) {
			s += G.leaf({
				at: tip,
				ang: Math.atan2(dir.y, dir.x) + deg(a),
				L: 3.6 * k,
				W: 2.4 * k,
				col,
				cut,
				shade: null,
				outline: 0,
				midrib: false,
				hatch: false,
				petal: true,
			})
		}
	}
	s += G.path(toD([...lowerR, ...mirrorX(lowerR, 20).reverse()]), { fill: col })
	// band
	const b0 = T(P(13.6, 27.2))
	const b1 = T(P(26.4, 31))
	s += `<rect x="${r2(b0.x)}" y="${r2(b0.y)}" width="${r2(b1.x - b0.x)}" height="${r2(b1.y - b0.y)}" rx="${r2(1.2 * k)}" fill="${col}"/>`
	s += G.path(
		`M${r2(T(P(15, 29.1)).x)} ${r2(T(P(15, 29.1)).y)}H${r2(T(P(25, 29.1)).x)}`,
		{ stroke: cut, 'stroke-width': r2(0.55 * k) },
	)
	// engraved line down the central petal
	const vein = G.cubicsToPoly(
		[[P(20, 4), P(20, 10), P(20, 18), P(20, 25)]].map(sg => sg),
	)
	s += G.path(
		G.taper(vein.map(T), u => 0.35 * k * Math.sin(Math.PI * u)),
		{ fill: cut },
	)
	return s
}

/** Bead and reel moulding along y. */
export function beadReel(x0, x1, y, o) {
	const { col, cut, h = 6, step = 16 } = o
	let s = ''
	for (let x = x0 + step / 2; x < x1 - step / 4; x += step) {
		s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(step * 0.3)}" ry="${r2(h * 0.42)}" fill="${col}"/>`
		s += `<ellipse cx="${r2(x - step * 0.08)}" cy="${r2(y - h * 0.15)}" rx="${r2(step * 0.09)}" ry="${r2(h * 0.1)}" fill="${cut}"/>`
		for (const dx of [0.42, 0.58])
			s += `<ellipse cx="${r2(x + step * dx)}" cy="${r2(y)}" rx="${r2(step * 0.045)}" ry="${r2(h * 0.3)}" fill="${col}"/>`
	}
	return s
}

/** Pomegranate, the brocade's motif, in a box of height h centred at c. */
export function pomegranate(c, h, o) {
	const { col, cut } = o
	const k = h / 40
	const T = (x, y) => P(c.x + x * k, c.y + y * k)
	let s = ''
	// leaves flanking
	for (const sd of [-1, 1]) {
		s += G.leaf({
			at: T(sd * 2, 12),
			ang: deg(sd < 0 ? -160 : -20),
			L: 15 * k,
			W: 6 * k,
			bend: 0.18,
			side: sd,
			col,
			cut,
			shade: null,
			outline: 0,
			midrib: true,
			hatch: false,
		})
	}
	// stem
	s += G.path(
		G.taper([T(0, 19), T(0, 13)], () => 0.9 * k, 10),
		{ fill: col },
	)
	// fruit body
	const body = []
	for (let i = 0; i <= 48; i++) {
		const a = -Math.PI / 2 + deg(28) + (i / 48) * (Math.PI * 2 - deg(56))
		body.push(T(Math.cos(a) * 10.5, -1 + Math.sin(a) * 11.5))
	}
	s += G.path(G.pathFromPoly(body), { fill: col })
	// crown
	const crown = [
		T(-5, -11.3),
		T(-6.5, -17),
		T(-3.2, -13.6),
		T(0, -18.5),
		T(3.2, -13.6),
		T(6.5, -17),
		T(5, -11.3),
	]
	s += G.path(G.pathFromPoly(crown), { fill: col })
	// open lens with seeds
	const lens = []
	for (let i = 0; i <= 30; i++) {
		const t = i / 30
		lens.push(T(-6.5 + 13 * t, -1 - Math.sin(Math.PI * t) * 7))
	}
	for (let i = 0; i <= 30; i++) {
		const t = i / 30
		lens.push(T(6.5 - 13 * t, -1 + Math.sin(Math.PI * t) * 7))
	}
	s += G.path(G.pathFromPoly(lens), { fill: cut })
	for (let y = -5; y <= 3; y += 2.6)
		for (let x = -4.5; x <= 4.6; x += 2.6) {
			const xx = x + (Math.round((y + 5) / 2.6) % 2) * 1.3
			const yy = -1 + y * 0.9
			if ((xx / 6.2) ** 2 + ((yy + 1) / 6.2) ** 2 < 0.85)
				s += G.circle(T(xx, yy), 0.95 * k, { fill: col })
		}
	return s
}

/** A crown of five points with pearls and a jewelled band, width w. */
export function crown(c, w, o) {
	const { col, cut } = o
	const k = w / 40
	const T = (x, y) => P(c.x + x * k, c.y + y * k)
	let s = ''
	const pts = [
		T(-17, 6),
		T(-20, -8),
		T(-11, -1),
		T(-6, -12),
		T(0, -3),
		T(6, -12),
		T(11, -1),
		T(20, -8),
		T(17, 6),
	]
	s += G.path(G.pathFromPoly(pts), { fill: col })
	for (const [x, y] of [
		[-20, -9.5],
		[-6, -13.5],
		[6, -13.5],
		[20, -9.5],
	])
		s += G.berry(T(x, y), 1.9 * k, col, cut)
	// central fleuron
	for (const a of [-55, 0, 55])
		s += G.leaf({
			at: T(0, -3),
			ang: deg(-90 + a),
			L: (a ? 7 : 11) * k,
			W: 4 * k,
			col,
			cut,
			shade: null,
			outline: 0,
			midrib: false,
			hatch: false,
			petal: true,
		})
	// band
	const b0 = T(-17.5, 3)
	s += `<rect x="${r2(b0.x)}" y="${r2(b0.y)}" width="${r2(35 * k)}" height="${r2(6 * k)}" rx="${r2(1 * k)}" fill="${col}"/>`
	for (const x of [-11, 0, 11]) {
		const p = T(x, 6)
		s += `<rect x="${r2(p.x - 1.6 * k)}" y="${r2(p.y - 1.6 * k)}" width="${r2(3.2 * k)}" height="${r2(3.2 * k)}" fill="${cut}" transform="rotate(45 ${r2(p.x)} ${r2(p.y)})"/>`
	}
	for (const x of [-5.5, 5.5]) s += G.circle(T(x, 6), 1.1 * k, { fill: cut })
	return s
}

/** Silverpoint fleuron: a lozenge with a pip and hairline tendrils. */
export function fleuron(c, w, o) {
	const { col } = o
	const k = w / 60
	const T = (x, y) => P(c.x + x * k, c.y + y * k)
	let s = ''
	s += G.path(G.pathFromPoly([T(0, -5.5), T(5.5, 0), T(0, 5.5), T(-5.5, 0)]), {
		fill: 'none',
		stroke: col,
		'stroke-width': 1,
	})
	s += G.circle(T(0, 0), 1.5 * k, { fill: col })
	for (const sd of [-1, 1]) {
		const line = [T(sd * 6.5, 0), T(sd * 14, 0)]
		const sp = G.spiral(
			T(sd * 18.5, -2.6),
			3.6 * k,
			0.6 * k,
			Math.PI / 2 + (sd < 0 ? 0 : 0),
			-sd * Math.PI * 1.6,
			50,
		)
		const sp2 = G.spiral(
			T(sd * 24, 2.4),
			3 * k,
			0.5 * k,
			-Math.PI / 2,
			sd * Math.PI * 1.5,
			50,
		)
		s += G.path(
			G.taper([...line, ...sp], u => 0.55 * (1 - 0.6 * u) + 0.15, 90),
			{ fill: col },
		)
		s += G.path(
			G.taper(
				[T(sd * 15.5, 0.9), ...sp2],
				u => 0.45 * (1 - 0.6 * u) + 0.12,
				60,
			),
			{ fill: col },
		)
		s += G.circle(T(sd * 29, 0), 0.9 * k, { fill: col })
	}
	return s
}
