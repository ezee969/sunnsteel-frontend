// Geometry and ornament primitives for the ACH-11 rank decoration.
// Everything is generated from curves, so the same code can later emit the
// repository's SVG assets reproducibly.

export const r2 = n => Math.round(n * 10) / 10
export const P = (x, y) => ({ x, y })
export const add = (a, b) => P(a.x + b.x, a.y + b.y)
export const sub = (a, b) => P(a.x - b.x, a.y - b.y)
export const mul = (a, k) => P(a.x * k, a.y * k)
export const len = a => Math.hypot(a.x, a.y)
export const norm = a => {
	const l = len(a) || 1
	return P(a.x / l, a.y / l)
}
export const perp = a => P(-a.y, a.x)
export const rot = (a, ang) => {
	const c = Math.cos(ang)
	const s = Math.sin(ang)
	return P(a.x * c - a.y * s, a.x * s + a.y * c)
}
export const deg = d => (d * Math.PI) / 180
export const lerp = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)

export function cubic(p0, p1, p2, p3, t) {
	const u = 1 - t
	return P(
		u * u * u * p0.x +
			3 * u * u * t * p1.x +
			3 * u * t * t * p2.x +
			t * t * t * p3.x,
		u * u * u * p0.y +
			3 * u * u * t * p1.y +
			3 * u * t * t * p2.y +
			t * t * t * p3.y,
	)
}

/** Dense polyline from cubic segments [[p0,p1,p2,p3], ...]. */
export function cubicsToPoly(segs, per = 60) {
	const out = []
	segs.forEach((s, i) => {
		for (let k = i === 0 ? 0 : 1; k <= per; k++) out.push(cubic(...s, k / per))
	})
	return out
}

/** Resample a polyline uniformly by arc length; adds tangent and u (0..1). */
export function resample(poly, n) {
	const cum = [0]
	for (let i = 1; i < poly.length; i++)
		cum.push(cum[i - 1] + len(sub(poly[i], poly[i - 1])))
	const total = cum[cum.length - 1]
	const out = []
	let j = 0
	for (let k = 0; k < n; k++) {
		const target = (total * k) / (n - 1)
		while (j < cum.length - 2 && cum[j + 1] < target) j++
		const seg = cum[j + 1] - cum[j] || 1
		const t = (target - cum[j]) / seg
		out.push({ p: lerp(poly[j], poly[j + 1], t), u: k / (n - 1) })
	}
	for (let k = 0; k < n; k++) {
		const a = out[Math.max(0, k - 1)].p
		const b = out[Math.min(n - 1, k + 1)].p
		out[k].t = norm(sub(b, a))
	}
	out.total = total
	return out
}

function rdp(pts, eps) {
	if (pts.length < 3) return pts
	const a = pts[0]
	const b = pts[pts.length - 1]
	const ab = sub(b, a)
	const l = len(ab)
	if (l < 1e-6) {
		// closed run: split at the point farthest from the start
		let far = 1
		for (let i = 1; i < pts.length - 1; i++)
			if (len(sub(pts[i], a)) > len(sub(pts[far], a))) far = i
		return [
			...rdp(pts.slice(0, far + 1), eps).slice(0, -1),
			...rdp(pts.slice(far), eps),
		]
	}
	let dmax = 0
	let idx = 0
	for (let i = 1; i < pts.length - 1; i++) {
		const d = Math.abs(ab.x * (a.y - pts[i].y) - (a.x - pts[i].x) * ab.y) / l
		if (d > dmax) {
			dmax = d
			idx = i
		}
	}
	if (dmax <= eps) return [a, b]
	return [
		...rdp(pts.slice(0, idx + 1), eps).slice(0, -1),
		...rdp(pts.slice(idx), eps),
	]
}
export const EPS = { v: 0.1 }
export const pathFromPoly = (pts, close = true) => {
	const q = rdp(pts, EPS.v)
	return (
		'M' + q.map(p => `${r2(p.x)} ${r2(p.y)}`).join('L') + (close ? 'Z' : '')
	)
}

/** A stroke whose half-width follows w(u): a filled outline, so ends taper. */
export function taper(poly, w, n = 90) {
	const s = resample(poly, n)
	const left = []
	const right = []
	for (const q of s) {
		const nn = perp(q.t)
		const hw = w(q.u)
		left.push(add(q.p, mul(nn, hw)))
		right.push(add(q.p, mul(nn, -hw)))
	}
	return pathFromPoly([...left, ...right.reverse()])
}

/** Archimedean-ish spiral as a polyline. ang in radians, screen coords. */
export function spiral(c, r0, r1, a0, sweep, n = 120) {
	const pts = []
	for (let i = 0; i <= n; i++) {
		const t = i / n
		const r = r0 + (r1 - r0) * Math.pow(t, 0.85)
		const a = a0 + sweep * t
		pts.push(P(c.x + r * Math.cos(a), c.y + r * Math.sin(a)))
	}
	return pts
}

const el = (tag, attrs, inner = '') => {
	const a = Object.entries(attrs)
		.filter(([, v]) => v !== undefined && v !== null)
		.map(([k, v]) => `${k}="${typeof v === 'number' ? r2(v) : v}"`)
		.join(' ')
	return inner ? `<${tag} ${a}>${inner}</${tag}>` : `<${tag} ${a}/>`
}
export const path = (d, attrs = {}) => el('path', { d, ...attrs })
export const circle = (c, r, attrs = {}) =>
	el('circle', { cx: c.x, cy: c.y, r, ...attrs })
export const g = (inner, attrs = {}) =>
	`<g${Object.entries(attrs)
		.map(([k, v]) => ` ${k}="${v}"`)
		.join('')}>${inner}</g>`

/**
 * One leaf. Local frame: base at origin, tip at (L, 0); then bent, rotated
 * and placed. Two tones (lit and shaded halves), a cut midrib and, when large
 * enough, engraved hatching on the shaded half.
 */
export function leaf(o) {
	const {
		at,
		ang,
		L,
		W,
		bend = 0,
		col,
		cut,
		shade,
		shadeOp = 0.32,
		hatch = L > 16,
		outline = 0.6,
		side = 1,
		petal = false,
		midrib = true,
	} = o
	const xf = p => {
		const u = p.x / L
		return add(at, rot(P(p.x, p.y + side * bend * L * u * u), ang))
	}
	const c = (x, y) => xf(P(x * L, y * W))
	const f = q => `${r2(q.x)} ${r2(q.y)}`
	// upper edge base -> tip, lower edge tip -> base, as cubics
	const up = petal
		? [c(0.02, -0.62), c(0.96, -0.78)]
		: [c(0.16, -0.6), c(0.62, -0.62)]
	const lo = petal
		? [c(0.96, 0.7), c(0.02, 0.56)]
		: [c(0.62, 0.54), c(0.16, 0.52)]
	const B = xf(P(0, 0))
	const T = xf(P(L, 0))
	const outlineD = `M${f(B)}C${f(up[0])} ${f(up[1])} ${f(T)}C${f(lo[0])} ${f(lo[1])} ${f(B)}Z`
	let s = path(outlineD, {
		fill: col,
		stroke: outline ? cut : undefined,
		'stroke-width': outline || undefined,
		'stroke-linejoin': 'round',
	})
	if (shade) {
		const M1 = xf(P(L * 0.5, 0))
		s += path(`M${f(T)}C${f(lo[0])} ${f(lo[1])} ${f(B)}Q${f(M1)} ${f(T)}Z`, {
			fill: shade,
			'fill-opacity': shadeOp,
		})
	}
	if (hatch && shade) {
		let h = ''
		for (let u = 0.22; u < 0.78; u += 0.11) {
			const hw = W * 0.5 * Math.sin(Math.PI * u)
			const a = xf(P(u * L, hw * 0.15))
			const b2 = xf(P(u * L + hw * 0.5, hw * 0.72))
			h += `M${f(a)}L${f(b2)}`
		}
		s += path(h, {
			fill: 'none',
			stroke: shade,
			'stroke-opacity': 0.5,
			'stroke-width': Math.max(0.35, L / 70),
			'stroke-linecap': 'round',
		})
	}
	if (!midrib) return s
	const r0 = xf(P(L * 0.04, -W * 0.04))
	const r1 = xf(P(L * 0.04, W * 0.04))
	const r2p = xf(P(L * 0.86, 0))
	const rm = xf(P(L * 0.45, 0))
	s += path(`M${f(r0)}Q${f(rm)} ${f(r2p)}Q${f(rm)} ${f(r1)}Z`, { fill: cut })
	return s
}

/** Berry with a cut highlight. */
export function berry(c, r, col, cut) {
	return (
		circle(c, r, { fill: col }) +
		circle(add(c, P(-r * 0.35, -r * 0.35)), r * 0.3, { fill: cut })
	)
}

/**
 * Laurel along a polyline: alternating leaves angled forward, tapering to the
 * tip, a tapered stem and occasional berries.
 */
export function laurel(poly, o) {
	const {
		count = 9,
		Lmax = 18,
		Lmin = 9,
		Wr = 0.42,
		spread = 38,
		col,
		cut,
		shade,
		stem = 1.1,
		berries = true,
		tipLeaf = true,
		start = 0.06,
		bend = 0.08,
		both = false,
	} = o
	const s = resample(poly, 200)
	let out = path(
		taper(poly, u => stem * (1 - 0.6 * u) + 0.15),
		{ fill: col },
	)
	const leaves = []
	for (let i = 0; i < count; i++) {
		const u = start + ((0.94 - start) * i) / Math.max(1, count - 1)
		const q = s[Math.round(u * (s.length - 1))]
		const L = Lmax + (Lmin - Lmax) * u
		const sides = both ? [1, -1] : [i % 2 === 0 ? 1 : -1]
		for (const sd of sides) {
			const ang = Math.atan2(q.t.y, q.t.x) + sd * deg(spread)
			leaves.push({
				at: q.p,
				ang,
				L,
				W: L * Wr,
				bend,
				side: -sd,
				col,
				cut,
				shade,
			})
			if (berries && i % 3 === 1 && sd === sides[0]) {
				const bc = add(q.p, mul(rot(q.t, -sd * deg(70)), L * 0.32))
				leaves.push({ berry: true, c: bc, r: L * 0.13 })
			}
		}
	}
	if (tipLeaf) {
		const q = s[s.length - 1]
		leaves.push({
			at: q.p,
			ang: Math.atan2(q.t.y, q.t.x),
			L: Lmin * 1.05,
			W: Lmin * 1.05 * Wr,
			bend: 0,
			col,
			cut,
			shade,
		})
	}
	for (const l of leaves) out += l.berry ? berry(l.c, l.r, col, cut) : leaf(l)
	return out
}

/** Layered rosette: two petal rings and a boss. */
export function rosette(c, r, o) {
	const { n = 8, col, cut, shade, inner = true } = o
	let s = ''
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2 - Math.PI / 2
		s += leaf({
			at: add(c, P(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18)),
			ang: a,
			L: r * 0.82,
			W: r * 0.46,
			col,
			cut,
			shade,
			hatch: false,
			outline: 0.6,
			petal: true,
		})
	}
	if (inner)
		for (let i = 0; i < n; i++) {
			const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2
			s += leaf({
				at: c,
				ang: a,
				L: r * 0.6,
				W: r * 0.36,
				col,
				cut,
				shade,
				hatch: false,
				outline: 0.6,
				petal: true,
			})
		}
	s += circle(c, r * 0.26, { fill: col, stroke: cut, 'stroke-width': 0.6 })
	const dots = Math.max(6, Math.round(r * 0.9))
	for (let i = 0; i < dots; i++) {
		const a = (i / dots) * Math.PI * 2
		s += circle(
			add(c, P(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18)),
			Math.max(0.35, r * 0.03),
			{ fill: cut },
		)
	}
	s += circle(c, r * 0.07, { fill: cut })
	return s
}

/** Eight-pointed star (the Scrovegni vault's). */
export function star8(c, r, o) {
	const { col, cut, inner = true, rot: ro = 0 } = o
	const pts = []
	for (let i = 0; i < 16; i++) {
		const a = (i / 16) * Math.PI * 2 - Math.PI / 2 + ro
		const rr = i % 2 === 0 ? r : r * 0.42
		pts.push(P(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr))
	}
	let s = path(pathFromPoly(pts), { fill: col })
	if (inner && r > 4) {
		// facet cuts: a line from each point to the centre, like a cut jewel
		let d = ''
		for (let i = 0; i < 16; i += 2) {
			const a = (i / 16) * Math.PI * 2 - Math.PI / 2 + ro
			d += `M${r2(c.x)} ${r2(c.y)}L${r2(c.x + Math.cos(a) * r * 0.8)} ${r2(c.y + Math.sin(a) * r * 0.8)}`
		}
		s += path(d, {
			stroke: cut,
			'stroke-width': Math.max(0.35, r * 0.05),
			'stroke-opacity': 0.8,
		})
		s += circle(c, r * 0.12, { fill: cut })
	}
	return s
}

/** Pearls along a circle. */
export function pearlRing(c, R, n, pr, col, cut) {
	let s = ''
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2
		const p = add(c, P(Math.cos(a) * R, Math.sin(a) * R))
		s += circle(p, pr, { fill: col })
		if (pr > 1.3)
			s += circle(add(p, P(-pr * 0.3, -pr * 0.3)), pr * 0.3, { fill: cut })
	}
	return s
}

/** A ribbon along a polyline, with a swallowtail end. */
export function ribbon(poly, w, o) {
	const { col, cut, shade, notch = true } = o
	const s = resample(poly, 80)
	const L = []
	const R = []
	for (const q of s) {
		const nn = perp(q.t)
		L.push(add(q.p, mul(nn, w / 2)))
		R.push(add(q.p, mul(nn, -w / 2)))
	}
	const end = s[s.length - 1]
	const tip = notch ? [add(end.p, mul(end.t, -w * 0.7))] : []
	let out = path(pathFromPoly([...L, ...tip, ...R.reverse()]), {
		fill: col,
		stroke: cut,
		'stroke-width': 0.5,
	})
	// a fold: the first third in shade
	const k = Math.round(s.length * 0.35)
	out += path(pathFromPoly([...L.slice(0, k), ...R.slice(R.length - k)]), {
		fill: shade,
		'fill-opacity': 0.3,
	})
	return out
}
