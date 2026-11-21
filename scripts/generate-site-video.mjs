/**
 * Cuts, grades and encodes the public site's background videos (SITE-01, plan
 * §7.2, §12.2 and §12.12) from the licensed stock masters, with their posters.
 *
 *   node scripts/generate-site-video.mjs [--out <dir>] [--sheets]
 *
 * The masters are Mixkit's 4K files (Mixkit Stock Video Free License), kept
 * outside every repository in `../site-footage/mixkit` (override with
 * SITE_FOOTAGE_DIR); only what this script writes is committed. It needs
 * `ffmpeg` with libx264, libsvtav1 and libwebp on the PATH (or FFMPEG).
 *
 * Every cut is graded to black and white with deeper blacks. Grain is not
 * baked in: per-frame noise multiplies a clip's size, so the site lays it over
 * the video in CSS instead.
 *
 * `--sheets` writes a contact sheet per master (one frame a second) to the
 * output folder instead, for choosing the seconds each cut uses.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MASTERS = resolve(
	ROOT,
	process.env.SITE_FOOTAGE_DIR ?? '../site-footage/mixkit',
)
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'

const args = process.argv.slice(2)
const OUT = resolve(
	ROOT,
	args.includes('--out')
		? args[args.indexOf('--out') + 1]
		: 'public/site/video',
)

/** The masters, by Mixkit id, all 4096x2160 at 25 fps. */
const MASTER = {
	cableFly: 'mixkit-100546-cable-fly-2160.mp4',
	latPulldown: 'mixkit-100549-lat-pulldown-2160.mp4',
	seatedRow: 'mixkit-100550-seated-cable-row-2160.mp4',
	womanPulldown: 'mixkit-100523-woman-pulldown-2160.mp4',
	backAtMachine: 'mixkit-100540-back-at-machine-2160.mp4',
}
const SOURCE = { width: 4096, height: 2160 }

/**
 * A cut: `start` and `length` in seconds of its master; `subject`, the
 * subject's centre as a fraction of the master's width; `zoom`, how much of
 * the master the frame keeps (1 is all of its height); `flip` mirrors it so
 * the subject lands where the layout needs it.
 */
const HERO_DESKTOP = [
	{ master: 'cableFly', start: 1, length: 3, subject: 0.48, zoom: 1.3 },
	{ master: 'latPulldown', start: 2.5, length: 2.8, subject: 0.45, zoom: 1.3 },
	{
		master: 'womanPulldown',
		start: 0.6,
		length: 2.6,
		subject: 0.42,
		zoom: 1.3,
		flip: true,
	},
	{
		master: 'seatedRow',
		start: 4.5,
		length: 2.8,
		subject: 0.3,
		zoom: 1.3,
		flip: true,
	},
]
/**
 * A single shot that loops: the script finds, between `from` and `to`, the
 * stretch of `min` to `max` seconds that ends where it began -- the same pose
 * moving the same way -- and cuts there, so the loop has no visible seam. A
 * crossfade was tried and rejected: two arms at different speeds ghost.
 */
const HERO_PHONE = {
	master: 'cableFly',
	from: 0.5,
	to: 14,
	min: 7,
	max: 10,
	subject: 0.42,
}
// Never past 15 s: the model then turns to a pose.
const CLOSING = {
	master: 'backAtMachine',
	from: 0,
	to: 15,
	min: 6,
	max: 12,
	subject: 0.45,
}
const FPS = 25

/** Where the subject sits in the output frame (plan §12.2: the right two thirds). */
const DESKTOP_SUBJECT_AT = 0.66

/** The grade: black and white, a touch more contrast, blacks pulled down. */
const GRADE = 'format=gray,eq=contrast=1.12:brightness=-0.035:gamma=0.94'

function ffmpeg(argv) {
	const run = spawnSync(
		FFMPEG,
		['-hide_banner', '-loglevel', 'error', '-y', ...argv],
		{ maxBuffer: 256 * 1024 * 1024 },
	)
	if (run.status !== 0) {
		throw new Error(`ffmpeg failed: ${argv.join(' ')}\n${run.stderr}`)
	}
	return run.stdout
}

/** The best loop in a shot's window: { start, length } in seconds. */
function findLoop({ master, from, to, min, max }) {
	const [w, h] = [64, 36]
	const raw = ffmpeg([
		'-ss',
		String(from),
		'-t',
		String(to - from),
		'-i',
		join(MASTERS, MASTER[master]),
		'-vf',
		`fps=${FPS},scale=${w}:${h},format=gray`,
		'-f',
		'rawvideo',
		'-',
	])
	const size = w * h
	const frames = Math.floor(raw.length / size)
	const distance = (a, b) => {
		let sum = 0
		for (let p = 0; p < size; p++) {
			const d = raw[a * size + p] - raw[b * size + p]
			sum += d * d
		}
		return sum
	}
	// Frame j must look like frame i, and the frames around them alike too, so
	// the motion through the cut keeps its direction and speed.
	let best = { score: Infinity, i: 0, j: 0 }
	for (let i = 2; i < frames - 2; i++) {
		for (let j = i + min * FPS; j <= Math.min(i + max * FPS, frames - 3); j++) {
			const score =
				distance(i, j) + distance(i - 2, j - 2) + distance(i + 2, j + 2)
			if (score < best.score) best = { score, i, j }
		}
	}
	// The clip is frames i .. j-1; frame j is frame i again when it loops.
	return {
		start: from + best.i / FPS,
		length: (best.j - best.i) / FPS,
	}
}

/** The crop that puts `subject` at `at` of a `ratio` (w/h) frame, `zoom` in. */
function crop({ subject, zoom = 1, flip = false }, ratio, at) {
	const height = Math.round(SOURCE.height / zoom / 2) * 2
	const width = Math.round((height * ratio) / 2) * 2
	const centre = (flip ? 1 - subject : subject) * SOURCE.width
	const x = Math.min(
		Math.max(Math.round(centre - at * width), 0),
		SOURCE.width - width,
	)
	const y = Math.round((SOURCE.height - height) / 2)
	return `${flip ? 'hflip,' : ''}crop=${width}:${height}:${x}:${y}`
}

const input = cut => [
	'-ss',
	String(cut.start),
	'-t',
	String(cut.length),
	'-i',
	join(MASTERS, MASTER[cut.master]),
]

/** Encodes one filter graph's [v] to MP4 (H.264) and WebM (AV1). */
function encode(inputs, graph, name, { mp4Rate, av1Crf }) {
	const base = join(OUT, name)
	ffmpeg([
		...inputs,
		'-filter_complex',
		graph,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libx264',
		'-preset',
		'slow',
		'-profile:v',
		'high',
		'-pix_fmt',
		'yuv420p',
		'-b:v',
		mp4Rate,
		'-maxrate',
		mp4Rate,
		'-bufsize',
		mp4Rate,
		'-movflags',
		'+faststart',
		`${base}.mp4`,
	])
	ffmpeg([
		...inputs,
		'-filter_complex',
		graph,
		'-map',
		'[v]',
		'-an',
		'-c:v',
		'libsvtav1',
		'-preset',
		'5',
		'-crf',
		String(av1Crf),
		'-pix_fmt',
		'yuv420p',
		`${base}.webm`,
	])
}

/** The first frame of a written clip, as AVIF and WebP under `maxKb`. */
async function poster(clip, name, maxKb, resize) {
	const png = ffmpeg([
		'-i',
		join(OUT, clip),
		'-frames:v',
		'1',
		'-f',
		'image2pipe',
		'-c:v',
		'png',
		'-',
	])
	let image = sharp(png)
	if (resize)
		image = image.resize(resize.width, resize.height, { fit: 'cover' })
	for (const [format, options] of [
		['avif', { quality: 50, effort: 6 }],
		['webp', { quality: 72, effort: 6 }],
	]) {
		let quality = options.quality
		for (;;) {
			const buffer = await image
				.clone()
				[format]({ ...options, quality })
				.toBuffer()
			if (buffer.length <= maxKb * 1024 || quality <= 30) {
				writeFileSync(join(OUT, `${name}.${format}`), buffer)
				break
			}
			quality -= 6
		}
	}
}

function heroDesktop() {
	const inputs = HERO_DESKTOP.flatMap(input)
	const parts = HERO_DESKTOP.map(
		(cut, i) =>
			`[${i}:v]${crop(cut, 16 / 9, DESKTOP_SUBJECT_AT)},scale=1920:1080:flags=lanczos,${GRADE},setsar=1,fps=25[c${i}]`,
	)
	const graph = `${parts.join(';')};${HERO_DESKTOP.map((_, i) => `[c${i}]`).join('')}concat=n=${HERO_DESKTOP.length}:v=1:a=0[v]`
	encode(inputs, graph, 'hero-desktop', { mp4Rate: '2600k', av1Crf: 40 })
}

/** A single shot cut on its matching frames (`findLoop`). */
function loop(shot, ratio, at, size, name, rates) {
	const cut = { ...shot, ...findLoop(shot) }
	console.log(
		name,
		`loops ${cut.start.toFixed(2)}s + ${cut.length.toFixed(2)}s`,
	)
	const graph = `[0:v]${crop(cut, ratio, at)},scale=${size}:flags=lanczos,${GRADE},setsar=1,fps=${FPS}[v]`
	encode(input(cut), graph, name, rates)
}

function sheets() {
	for (const [key, file] of Object.entries(MASTER)) {
		ffmpeg([
			'-i',
			join(MASTERS, file),
			'-vf',
			`fps=1,scale=480:-2,${GRADE},drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=4x5`,
			'-frames:v',
			'1',
			join(OUT, `sheet-${key}.png`),
		])
	}
}

mkdirSync(OUT, { recursive: true })
if (args.includes('--sheets')) {
	sheets()
} else {
	heroDesktop()
	loop(HERO_PHONE, 9 / 16, 0.5, '720:1280', 'hero-phone', {
		mp4Rate: '520k',
		av1Crf: 46,
	})
	loop(CLOSING, 16 / 9, 0.62, '1920:1080', 'closing-desktop', {
		mp4Rate: '1400k',
		av1Crf: 44,
	})
	await poster('hero-desktop.mp4', 'hero-desktop-poster', 150)
	await poster('hero-phone.mp4', 'hero-phone-poster', 60)
	await poster('closing-desktop.mp4', 'closing-desktop-poster', 120)
	await poster('closing-desktop.mp4', 'closing-phone-poster', 60, {
		width: 720,
		height: 1280,
	})
	for (const name of ['hero-desktop', 'hero-phone', 'closing-desktop'].flatMap(
		n => [`${n}.mp4`, `${n}.webm`],
	)) {
		console.log(
			name,
			`${(statSync(join(OUT, name)).size / 1048576).toFixed(2)} MB`,
		)
	}
}
