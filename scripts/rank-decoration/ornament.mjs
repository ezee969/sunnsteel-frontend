// Second-generation motifs: richer, larger, with three tones.
import * as G from './geom.mjs'
const { P, add, mul, deg, r2 } = G

// deterministic jitter
export function rng(seed) {
	let s = seed >>> 0
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0
		return s / 4294967296
	}
}

/** Running dog done properly: the line leaves the baseline, rises and curls forward. */
export function runningDog(x0, x1, yb, h, o) {
	const { col, period = 26, weight = 1.5, light } = o
	const r0 = h * 0.5
	let s = ''
	let prev = x0
	for (let cx = x0 + period; cx < x1 - r0; cx += period) {
		const c = P(cx, yb - r0)
		const Lp = P(c.x - r0, c.y)
		const start = P(prev, yb)
		const rise = G.cubicsToPoly(
			[
				[
					start,
					P(start.x + (Lp.x - start.x) * 0.7, yb),
					P(Lp.x, yb - r0 * 0.2),
					Lp,
				],
			],
			30,
		)
		const sp = G.spiral(c, r0, r0 * 0.12, Math.PI, Math.PI * 1.7, 90)
		const poly = [...rise, ...sp.slice(1)]
		if (light) {
			// the wave's body, a flat light tone under the line
			const body = [
				...rise,
				...G.spiral(c, r0, r0 * 0.55, Math.PI, Math.PI * 1.5, 40).slice(1),
				P(c.x + r0 * 0.1, yb),
			]
			s += G.path(G.pathFromPoly(body), { fill: col, 'fill-opacity': light })
		}
		s += G.path(
			G.taper(
				poly,
				u =>
					weight * (u < 0.35 ? 0.6 + u : 1 - (0.75 * (u - 0.35)) / 0.65) + 0.15,
				160,
			),
			{ fill: col },
		)
		prev = cx
	}
	s += G.path(`M${r2(x0)} ${r2(yb + weight * 0.4)}H${r2(prev)}`, {
		stroke: col,
		'stroke-width': weight * 0.8,
	})
	return s
}

/** A twisted cord around a circle. */
export function cordRing(c, R, o) {
	const { col, cut, w = 3.2 } = o
	const n = Math.round((2 * Math.PI * R) / (w * 1.25))
	let s = G.circle(c, R, { fill: 'none', stroke: col, 'stroke-width': w })
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2
		const p = P(c.x + R * Math.cos(a), c.y + R * Math.sin(a))
		const t = P(-Math.sin(a), Math.cos(a))
		const nn = P(Math.cos(a), Math.sin(a))
		const d1 = add(p, add(mul(nn, w / 2), mul(t, -w * 0.35)))
		const d2 = add(p, add(mul(nn, -w / 2), mul(t, w * 0.35)))
		s += G.path(`M${r2(d1.x)} ${r2(d1.y)}L${r2(d2.x)} ${r2(d2.y)}`, {
			stroke: cut,
			'stroke-width': Math.max(0.5, w * 0.18),
			'stroke-linecap': 'round',
		})
	}
	return s
}

/**
 * Acanthus leaf: a curling blade with paired lobes, each lobe a fan of three
 * pointed leaflets; local frame base at origin, pointing along ang.
 */
export function acanthus(o) {
	const {
		at,
		ang,
		L,
		W,
		curl = 0.25,
		lobes = 4,
		col,
		cut,
		shade,
		flip = 1,
		tipCurl = 0,
	} = o
	const rib = []
	for (let i = 0; i <= 40; i++) {
		const u = i / 40
		rib.push(P(u * L, flip * curl * L * u * u))
	}
	if (tipCurl) {
		const end = rib[rib.length - 1]
		const sp = G.spiral(
			P(end.x - 0, end.y + flip * L * 0.09),
			L * 0.09,
			L * 0.02,
			(-flip * Math.PI) / 2,
			flip * Math.PI * 1.3,
			30,
		)
		rib.push(...sp.slice(1))
	}
	const X = p => add(at, G.rot(p, ang))
	const ribW = rib.map(X)
	const rs = G.resample(ribW, 120)
	let back = ''
	let front = ''
	for (let j = 0; j < lobes; j++) {
		const u = 0.12 + (0.72 * j) / lobes
		const q = rs[Math.round(u * (rs.length - 1))]
		const ta = Math.atan2(q.t.y, q.t.x)
		const ll = W * (1 - 0.55 * u)
		for (const sd of [1, -1]) {
			const spread = deg(58 - 26 * u)
			const dir = ta + sd * spread
			const base = add(q.p, mul(G.perp(q.t), sd * W * 0.08 * (1 - u)))
			const fan = [
				[-24, 0.66],
				[0, 1],
				[24, 0.66],
			]
			let lobe = ''
			for (const [da, k] of fan) {
				lobe += G.leaf({
					at: base,
					ang: dir + deg(da) * sd + deg(10) * sd * flip,
					L: ll * k,
					W: ll * k * 0.52,
					bend: 0.14,
					side: -sd * flip,
					col,
					cut,
					shade: sd === flip ? shade : null,
					shadeOp: 0.28,
					hatch: false,
					outline: Math.max(0.45, L / 110),
					midrib: k === 1,
				})
			}
			if (sd === flip) back += lobe
			else front += lobe
		}
	}
	// the blade
	const blade = G.taper(
		ribW,
		u => W * 0.22 * Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.04)) + 0.3,
		120,
	)
	let s =
		back +
		G.path(blade, {
			fill: col,
			stroke: cut,
			'stroke-width': Math.max(0.5, L / 120),
		}) +
		front
	// rib groove
	s += G.path(
		G.taper(
			ribW.slice(2, Math.round(ribW.length * 0.9)),
			u => Math.max(0.15, L / 160) * (1 - u) + 0.1,
			80,
		),
		{ fill: cut },
	)
	return s
}

/** Five-petal flower with a turned boss, for the ends of scrolls. */
export function flower(c, r, o) {
	const { col, cut, shade, n = 5, ang = -Math.PI / 2 } = o
	let s = ''
	for (let i = 0; i < n; i++) {
		const a = ang + (i / n) * Math.PI * 2
		s += G.leaf({
			at: c,
			ang: a,
			L: r,
			W: r * 0.78,
			petal: true,
			col,
			cut,
			shade,
			shadeOp: 0.22,
			hatch: false,
			outline: Math.max(0.5, r / 14),
			midrib: false,
		})
	}
	for (let i = 0; i < n; i++) {
		const a = ang + ((i + 0.5) / n) * Math.PI * 2
		s += G.leaf({
			at: c,
			ang: a,
			L: r * 0.55,
			W: r * 0.3,
			col,
			cut,
			shade: null,
			hatch: false,
			outline: 0.5,
			midrib: false,
		})
	}
	s += G.circle(c, r * 0.3, {
		fill: col,
		stroke: cut,
		'stroke-width': Math.max(0.6, r / 16),
	})
	s += G.circle(c, r * 0.14, { fill: cut })
	return s
}

/**
 * A scroll: a tapered stem from `from` along a lead-in curve into a spiral,
 * dressed with an acanthus sheath at its root and a flower or bud at its eye.
 */
export function scroll(o) {
	const {
		from,
		c,
		r0,
		dir = 1,
		startAng,
		sweep = 1.6,
		stem = 2,
		col,
		cut,
		shade,
		end = 'flower',
		sheath = true,
		leaves = 2,
		lead,
	} = o
	const sp = G.spiral(c, r0, r0 * 0.22, startAng, dir * Math.PI * sweep, 80)
	const leadPts = lead ? G.cubicsToPoly([lead], 40) : [from, sp[0]]
	const poly = [...leadPts, ...sp.slice(1)]
	let s = G.path(
		G.taper(poly, u => stem * (1 - 0.78 * u) + 0.25, 160),
		{ fill: col },
	)
	const rs = G.resample(poly, 100)
	for (let i = 0; i < leaves; i++) {
		const q = rs[Math.round((0.32 + i * 0.2) * 99)]
		const out = Math.atan2(q.t.y, q.t.x) - dir * deg(50)
		s += G.leaf({
			at: q.p,
			ang: out,
			L: r0 * 0.75,
			W: r0 * 0.3,
			bend: 0.15,
			side: dir,
			col,
			cut,
			shade,
			hatch: false,
			outline: 0.5,
		})
	}
	const eye = sp[sp.length - 1]
	if (end === 'flower') s += flower(eye, r0 * 0.42, { col, cut, shade })
	else s += G.berry(eye, r0 * 0.16, col, cut)
	if (sheath) {
		const q = rs[6]
		s += acanthus({
			at: rs[1].p,
			ang: Math.atan2(q.t.y, q.t.x),
			L: r0 * 1.7,
			W: r0 * 0.85,
			curl: 0.22,
			lobes: 3,
			flip: -dir,
			col,
			cut,
			shade,
		})
	}
	return s
}

/** Garland swag between a and b: bunched laurel, berries and ribbon wraps. */
export function garland(a, b, dip, o) {
	const { col, cut, shade, size = 14, seed = 7, wraps = 3 } = o
	const rnd = rng(seed)
	const mid = P((a.x + b.x) / 2, Math.max(a.y, b.y) + dip)
	const curve = G.cubicsToPoly(
		[
			[
				a,
				P(a.x + (mid.x - a.x) * 0.3, mid.y + dip * 0.05),
				P(b.x - (b.x - mid.x) * 0.3, mid.y + dip * 0.05),
				b,
			],
		],
		160,
	)
	const rs = G.resample(curve, 400)
	const n = Math.round(rs.total / (size * 0.36))
	let s = ''
	const items = []
	for (let i = 0; i < n; i++) {
		const u = (i + 0.5) / n
		const q = rs[Math.round(u * (rs.length - 1))]
		const fat = 0.5 + 0.5 * Math.sin(Math.PI * u)
		const toward = u < 0.5 ? 1 : -1
		const ta = Math.atan2(q.t.y, q.t.x) + (toward < 0 ? Math.PI : 0)
		for (const [sd, spread] of [
			[1, 58],
			[-1, 58],
			[1, 26],
			[-1, 26],
		]) {
			const L = size * fat * (0.8 + 0.35 * rnd())
			items.push({
				z: rnd(),
				leaf: {
					at: add(q.p, mul(G.perp(q.t), sd * size * 0.08)),
					ang: ta + sd * deg(spread + 8 * (rnd() - 0.5)),
					L,
					W: L * 0.42,
					bend: 0.08,
					side: -sd,
					col,
					cut,
					shade,
					hatch: false,
					outline: 0.55,
				},
			})
		}
		if (i % 3 === 1) {
			const off = (rnd() - 0.5) * size * 0.6 * fat
			for (let k = 0; k < 3; k++)
				items.push({
					z: 0.99,
					berry: {
						c: add(
							q.p,
							add(
								mul(G.perp(q.t), off + (k - 1) * size * 0.16),
								mul(q.t, (k % 2) * size * 0.12),
							),
						),
						r: size * 0.12 * fat + 0.7,
					},
				})
		}
	}
	items.sort((x, y) => x.z - y.z)
	for (const it of items)
		s += it.leaf ? G.leaf(it.leaf) : G.berry(it.berry.c, it.berry.r, col, cut)
	// ribbon wraps
	for (let k = 1; k <= wraps; k++) {
		const u = k / (wraps + 1)
		const q = rs[Math.round(u * (rs.length - 1))]
		const fat = 0.5 + 0.5 * Math.sin(Math.PI * u)
		const hw = size * 0.9 * fat
		const nn = G.perp(q.t)
		const skew = mul(q.t, size * 0.25)
		const w = 3.2
		const pts = [
			add(add(q.p, mul(nn, hw)), skew),
			add(add(q.p, mul(nn, hw)), add(skew, mul(q.t, w))),
			add(add(q.p, mul(nn, -hw)), add(mul(skew, -1), mul(q.t, w))),
			add(add(q.p, mul(nn, -hw)), mul(skew, -1)),
		]
		s += G.path(G.pathFromPoly(pts), {
			fill: col,
			stroke: cut,
			'stroke-width': 0.7,
		})
	}
	return s
}

/** Radiant aureole: straight and flaming rays alternating. */
export function aureole(c, r0, r1, n, o) {
	const { col } = o
	let s = ''
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2 - Math.PI / 2
		const dir = P(Math.cos(a), Math.sin(a))
		if (i % 2 === 0) {
			const p0 = add(c, mul(dir, r0))
			const p1 = add(c, mul(dir, r1))
			s += G.path(
				G.taper([p0, p1], u => 1.6 * (1 - u) + 0.1, 20),
				{ fill: col },
			)
		} else {
			const pts = []
			for (let k = 0; k <= 40; k++) {
				const t = k / 40
				const rr = r0 + (r1 * 0.86 - r0) * t
				const wob = Math.sin(t * Math.PI * 3) * 2.2 * (1 - t * 0.3)
				pts.push(add(add(c, mul(dir, rr)), mul(G.perp(dir), wob)))
			}
			s += G.path(
				G.taper(pts, u => 1.1 * (1 - u) + 0.1, 60),
				{ fill: col },
			)
		}
	}
	return s
}

/** A banderole (scroll of ribbon) with turned-back ends. */
export function banderoleTails(c, o, k = 1) {
	const { col, cut, shade } = o
	let s = ''
	for (const sd of [-1, 1]) {
		const poly = G.cubicsToPoly([
			[
				c,
				P(c.x + sd * 10 * k, c.y + 4 * k),
				P(c.x + sd * 22 * k, c.y + 18 * k),
				P(c.x + sd * 40 * k, c.y + 14 * k),
			],
		])
		s += G.ribbon(poly, 7 * k, { col, cut, shade })
	}
	for (const sd of [-1, 1]) {
		s += `<ellipse cx="${r2(c.x + sd * 7 * k)}" cy="${r2(c.y - 2 * k)}" rx="${r2(7.5 * k)}" ry="${r2(4.2 * k)}" fill="${col}" stroke="${cut}" stroke-width="0.7" transform="rotate(${sd * -18} ${r2(c.x + sd * 7 * k)} ${r2(c.y - 2 * k)})"/>`
		s += `<ellipse cx="${r2(c.x + sd * 7 * k)}" cy="${r2(c.y - 2 * k)}" rx="${r2(4 * k)}" ry="${r2(1.6 * k)}" fill="${cut}" transform="rotate(${sd * -18} ${r2(c.x + sd * 7 * k)} ${r2(c.y - 2 * k)})"/>`
	}
	s += G.circle(c, 3.6 * k, { fill: col, stroke: cut, 'stroke-width': 0.8 })
	return s
}
