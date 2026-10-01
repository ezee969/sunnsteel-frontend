'use client'

import {
	type CSSProperties,
	type ReactNode,
	type RefObject,
	useEffect,
	useState,
} from 'react'

import { cn } from '@/lib/utils'
import type {
	RankDecoration,
	RankDecorationSlug,
} from '@/lib/utils/rank-decoration'

/*
 * ACH-11, design system §24. The ornament is generated
 * (scripts/generate-rank-decoration.mjs): pieces are SVG markup in placeholder
 * colours that globals.css maps to the rank's tokens, tiles are luminance
 * masks painted in the pigment. Each rank's module is its own chunk, so a
 * profile loads only the rank it shows. Everything here is decorative: it is
 * aria-hidden, never interactive and never carries the rank alone - the crest
 * and the rank name beside the name do (§19.2 rule 3).
 */

interface Piece {
	w: number
	h: number
	svg: string
}
interface Tile {
	w: number
	h: number
	uri: string
}
export interface RankDecorationAssets {
	pieces: Record<string, Piece>
	tiles: Record<string, Tile>
}

const LOADERS: Record<RankDecorationSlug, () => Promise<unknown>> = {
	initiate: () => import('./generated/initiate.json'),
	apprentice: () => import('./generated/apprentice.json'),
	artisan: () => import('./generated/artisan.json'),
	maestro: () => import('./generated/maestro.json'),
	virtuoso: () => import('./generated/virtuoso.json'),
	laureate: () => import('./generated/laureate.json'),
}
const loaded = new Map<RankDecorationSlug, RankDecorationAssets>()

/** The rank's generated assets, or null until its chunk has arrived. */
export function useRankDecorationAssets(
	slug: RankDecorationSlug | undefined,
): RankDecorationAssets | null {
	const [state, setState] = useState<{
		slug: RankDecorationSlug
		assets: RankDecorationAssets
	} | null>(null)
	useEffect(() => {
		if (!slug || loaded.has(slug)) return
		let live = true
		LOADERS[slug]()
			.then(mod => {
				const assets = ((mod as { default?: unknown }).default ??
					mod) as RankDecorationAssets
				loaded.set(slug, assets)
				if (live) setState({ slug, assets })
			})
			// A chunk that fails to load leaves the header plain, never broken.
			.catch(() => {})
		return () => {
			live = false
		}
	}, [slug])
	if (!slug) return null
	return loaded.get(slug) ?? (state?.slug === slug ? state.assets : null)
}

/**
 * Plays the entrance once the ornament has arrived, and marks the header
 * while it is on screen so the ambient motion runs only then (§24.4). Both
 * are attributes set here rather than React props, so a re-render of the
 * profile never restarts or stops them.
 */
export function useRankDecorationMotion(
	ref: RefObject<HTMLElement | null>,
	ready: boolean,
) {
	useEffect(() => {
		const el = ref.current
		if (!el || !ready) return
		el.setAttribute('data-playing', '')
		// Mark it at once when it is already on screen, without waiting for the
		// observer's first report.
		const box = el.getBoundingClientRect()
		el.toggleAttribute(
			'data-inview',
			box.bottom > 0 && box.top < window.innerHeight,
		)
		if (typeof IntersectionObserver === 'undefined') {
			el.setAttribute('data-inview', '')
			return
		}
		const io = new IntersectionObserver(
			entries => {
				for (const entry of entries)
					el.toggleAttribute('data-inview', entry.isIntersecting)
			},
			{ threshold: 0.2 },
		)
		io.observe(el)
		return () => io.disconnect()
	}, [ref, ready])
}

function PieceSvg({
	piece,
	part,
	className,
	style,
}: {
	piece: Piece
	part?: string
	className?: string
	style?: CSSProperties
}) {
	return (
		<svg
			viewBox={`0 0 ${piece.w} ${piece.h}`}
			width={piece.w}
			height={piece.h}
			data-part={part}
			className={cn('rank-deco-piece', className)}
			style={style}
			aria-hidden="true"
			focusable="false"
			dangerouslySetInnerHTML={{ __html: piece.svg }}
		/>
	)
}

function TileLayer({
	tile,
	className,
	repeat = 'repeat',
	offset = 0,
}: {
	tile: Tile
	className?: string
	repeat?: 'repeat' | 'repeat-x' | 'repeat-y'
	/** Shifts the pattern along its run, in tiles. */
	offset?: number
}) {
	const shift = `${tile.w * offset}px 0`
	return (
		<div
			className={cn('rank-deco-paint absolute', className)}
			style={
				{
					maskImage: tile.uri,
					maskSize: `${tile.w}px ${tile.h}px`,
					maskRepeat: repeat,
					maskPosition:
						repeat === 'repeat-y' ? `0 ${tile.h * offset}px` : shift,
					'--rank-roll': `${tile.w}px`,
				} as CSSProperties
			}
		/>
	)
}

function Line({ className }: { className: string }) {
	return <div className={cn('rank-deco-line absolute', className)} />
}

/** The same corner piece at all four corners, mirrored into place. */
function Corners({
	top,
	bottom = top,
	inset = 0,
	className,
}: {
	top: Piece
	bottom?: Piece
	inset?: number
	className?: string
}) {
	return (
		<div data-part="corners" className={cn('absolute inset-0', className)}>
			<PieceSvg piece={top} style={{ left: inset, top: inset }} />
			<PieceSvg
				piece={top}
				style={{ right: inset, top: inset, transform: 'scaleX(-1)' }}
			/>
			<PieceSvg
				piece={bottom}
				style={{ left: inset, bottom: inset, transform: 'scaleY(-1)' }}
			/>
			<PieceSvg
				piece={bottom}
				style={{ right: inset, bottom: inset, transform: 'scale(-1)' }}
			/>
		</div>
	)
}

const WIDE = 'hidden @min-[600px]:block'
const COMPACT = '@min-[600px]:hidden'

/**
 * The header's frame, corners, head and ground for the rank: absolutely
 * placed over the header section, which is the container its wide and
 * compact pieces answer to.
 */
export function RankHeaderDecoration({
	decoration,
	assets,
}: {
	decoration: RankDecoration
	assets: RankDecorationAssets
}) {
	const p = assets.pieces
	const t = assets.tiles
	let layers: ReactNode = null
	switch (decoration.tier) {
		case 0:
			layers = (
				<>
					<div
						data-part="frame"
						className="rank-deco-line absolute inset-x-0 bottom-0 h-[3px] border-y"
					/>
					<PieceSvg
						piece={p.fleuron}
						part="frame"
						style={{ left: 'calc(50% - 70px)', bottom: -6.5 }}
					/>
				</>
			)
			break
		case 1:
			layers = (
				<>
					<div
						data-part="frame"
						className="rank-deco-line absolute inset-x-0 bottom-0 h-[3px] border-y"
					/>
					<div
						data-part="frame"
						className="absolute inset-x-3 bottom-[5px] h-4"
					>
						<TileLayer
							tile={t.band}
							repeat="repeat-x"
							className="rank-deco-roll inset-0"
						/>
					</div>
					<div data-part="corners" className="absolute inset-0">
						<PieceSvg piece={p.boss} style={{ left: 0, bottom: 8 }} />
						<PieceSvg piece={p.boss} style={{ right: 0, bottom: 8 }} />
					</div>
				</>
			)
			break
		case 2:
			layers = (
				<>
					<div className="rank-deco-base absolute inset-0" />
					<div data-part="ground" className="rank-deco-ground absolute inset-3">
						<TileLayer tile={t.ground} className="inset-0" />
					</div>
					<div data-part="frame" className="absolute inset-0">
						<Line className="inset-0 border-[1.5px]" />
						<Line className="inset-[7.5px] border-[0.75px]" />
						<TileLayer
							tile={t.band}
							repeat="repeat-x"
							className="inset-x-[84px] bottom-[13px] h-2"
						/>
					</div>
					<Corners top={p.corner} className={WIDE} />
					<Corners top={p.cornerCompact} className={COMPACT} />
				</>
			)
			break
		case 3:
			layers = (
				<>
					<div className="rank-deco-base absolute inset-0" />
					<div
						data-part="ground"
						className="rank-deco-ground absolute inset-[26px]"
					>
						<TileLayer tile={t.ground} className="inset-0" />
					</div>
					<div data-part="frame" className="absolute inset-0">
						<Line className="inset-0 border-[1.5px]" />
						<Line className="inset-[5.5px] border-[0.75px]" />
					</div>
					<Corners top={p.corner} bottom={p.cornerBottom} className={WIDE} />
					<Corners
						top={p.cornerCompact}
						bottom={p.cornerBottomCompact}
						className={COMPACT}
					/>
					<PieceSvg
						piece={p.head}
						part="head"
						style={{ left: 'calc(50% - 100px)', top: 0 }}
					/>
				</>
			)
			break
		case 4:
			layers = (
				<>
					<div className="rank-deco-base absolute inset-0" />
					<div
						data-part="ground"
						className="rank-deco-ground absolute inset-x-[30px] inset-y-9"
					>
						<TileLayer tile={t.ground} className="inset-0" />
						<TileLayer
							tile={t.twinkleA}
							className="rank-deco-twinkle inset-0"
						/>
						<TileLayer
							tile={t.twinkleB}
							className="rank-deco-twinkle-late inset-0"
						/>
					</div>
					<div data-part="frame" className="absolute inset-0">
						<VaultBands band={32} tile={t.band} className={WIDE} />
						<VaultBands band={26} tile={t.bandCompact} className={COMPACT} />
						<Line className="inset-y-0 left-0 border-l-[1.5px]" />
						<Line className="inset-y-0 right-0 border-r-[1.5px]" />
						<Line className="inset-y-8 left-1.5 border-l-[0.75px]" />
						<Line className="inset-y-8 right-1.5 border-r-[0.75px]" />
					</div>
					<Corners top={p.block} className={WIDE} />
					<Corners top={p.blockCompact} className={COMPACT} />
					<PieceSvg
						piece={p.head}
						part="head"
						className={WIDE}
						style={{ left: 'calc(50% - 90px)', top: 0 }}
					/>
					<PieceSvg
						piece={p.head}
						part="head"
						className={COMPACT}
						style={{ left: 'calc(50% - 90px)', top: -6 }}
					/>
				</>
			)
			break
		default:
			layers = (
				<>
					<div className="rank-deco-base absolute inset-0" />
					<div
						data-part="ground"
						className="rank-deco-ground absolute inset-[34px] @min-[600px]:inset-11"
					>
						<TileLayer tile={t.ground} className="inset-0" />
					</div>
					<div data-part="frame" className="absolute inset-0">
						<IlluminatedBorder
							band={38}
							tile={t.band}
							vertical={t.bandVertical}
							className={WIDE}
						/>
						<IlluminatedBorder
							band={28}
							tile={t.bandCompact}
							vertical={t.bandVerticalCompact}
							className={COMPACT}
						/>
					</div>
					<Corners top={p.medallion} inset={-8.6} className={WIDE} />
					<Corners top={p.medallionCompact} inset={-7.4} className={COMPACT} />
					<PieceSvg
						piece={p.head}
						part="head"
						className={WIDE}
						style={{ left: 'calc(50% - 120px)', top: 0 }}
					/>
					<PieceSvg
						piece={p.head}
						part="head"
						className={COMPACT}
						style={{ left: 'calc(50% - 120px)', top: -5 }}
					/>
					{/* Festoons hang under the head only where they fit beside it. */}
					<div
						data-part="garland"
						className="absolute inset-0 hidden @min-[760px]:block"
					>
						<PieceSvg piece={p.garland} style={{ left: 78, top: 35 }} />
						<PieceSvg
							piece={p.garland}
							style={{ right: 78, top: 35, transform: 'scaleX(-1)' }}
						/>
						<PieceSvg
							piece={p.garland}
							className="hidden @min-[1020px]:block"
							style={{ left: 228, top: 35 }}
						/>
						<PieceSvg
							piece={p.garland}
							className="hidden @min-[1020px]:block"
							style={{ right: 228, top: 35, transform: 'scaleX(-1)' }}
						/>
					</div>
				</>
			)
	}
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0"
			data-rank-decoration={decoration.slug}
		>
			{layers}
		</div>
	)
}

/** Virtuoso's rinceau bands at the head and the foot, on a pigment field. */
function VaultBands({
	band,
	tile,
	className,
}: {
	band: number
	tile: Tile
	className: string
}) {
	return (
		<div className={cn('absolute inset-0', className)}>
			{(['top', 'bottom'] as const).map((edge, i) => (
				<div
					key={edge}
					className="absolute inset-x-0"
					style={{ [edge]: 0, height: band }}
				>
					<div className="rank-deco-field absolute inset-0" />
					<Line className="inset-0 border-y-[1.5px]" />
					<Line className="inset-x-0 inset-y-1 border-y-[0.75px]" />
					<div
						className="absolute inset-y-0"
						style={{ left: band, right: band }}
					>
						<TileLayer
							tile={tile}
							repeat="repeat-x"
							offset={i * 0.5}
							className="inset-0"
						/>
					</div>
				</div>
			))}
		</div>
	)
}

/** Laureate's border: rinceaux on a pigment field round all four sides. */
function IlluminatedBorder({
	band,
	tile,
	vertical,
	className,
}: {
	band: number
	tile: Tile
	vertical: Tile
	className: string
}) {
	const run = band + 18
	return (
		<div className={cn('absolute inset-0', className)}>
			<div
				className="rank-deco-band absolute inset-0"
				style={{ borderWidth: band, borderStyle: 'solid' }}
			/>
			<Line className="inset-0 border-[1.5px]" />
			<Line className="inset-[4.5px] border-[0.75px]" />
			<div
				className="rank-deco-line absolute border-[1.5px]"
				style={{ inset: band - 1.5 }}
			/>
			<div
				className="rank-deco-line absolute border-[0.75px]"
				style={{ inset: band + 3 }}
			/>
			<div
				className="absolute"
				style={{ top: 0, left: run, right: run, height: band }}
			>
				<TileLayer tile={tile} repeat="repeat-x" className="inset-0" />
			</div>
			<div
				className="absolute"
				style={{ bottom: 0, left: run, right: run, height: band }}
			>
				<TileLayer
					tile={tile}
					repeat="repeat-x"
					offset={0.5}
					className="inset-0"
				/>
			</div>
			<div
				className="absolute"
				style={{ left: 0, top: run, bottom: run, width: band }}
			>
				<TileLayer tile={vertical} repeat="repeat-y" className="inset-0" />
			</div>
			<div
				className="absolute"
				style={{ right: 0, top: run, bottom: run, width: band }}
			>
				<TileLayer
					tile={vertical}
					repeat="repeat-y"
					offset={0.5}
					className="inset-0"
				/>
			</div>
		</div>
	)
}

/**
 * The portrait's ornament, centred on the avatar it surrounds: the aureole
 * behind it (Laureate only) and the ring in front. Pieces are drawn round a
 * 96px avatar and scale with the avatar's box.
 */
export function RankPortraitOrnament({
	assets,
	layer,
}: {
	assets: RankDecorationAssets | null
	layer: 'behind' | 'front'
}) {
	const piece =
		layer === 'behind' ? assets?.pieces.aureole : assets?.pieces.ring
	if (!piece) return null
	const k = 100 / 96
	return (
		<PieceSvg
			piece={piece}
			part={layer === 'behind' ? 'aureole' : 'ring'}
			className="pointer-events-none"
			style={{
				width: `${piece.w * k}%`,
				height: `${piece.h * k}%`,
				left: `${(-(piece.w - 96) / 2) * k}%`,
				top: `${(-(piece.h - 96) / 2) * k}%`,
			}}
		/>
	)
}
