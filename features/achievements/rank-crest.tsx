'use client'

import { useId } from 'react'

import { cn } from '@/lib/utils'
import { rankCrestColorClass, rankCrestTier } from '@/lib/utils/rank-identity'

/*
 * ACH-09 crest geometry, design system §19.3. One testa di cavallo shield - the
 * Italian Renaissance horse-head shield - at a fixed place in a 24-unit box;
 * each rank adds to it, so the ladder reads from the silhouette alone:
 * Initiate a single point, Apprentice a tinted field and a chevron, Artisan a
 * solid field with a bordure, a palla and the chevron cut into it, Maestro
 * laurel sprigs tied at the base, Virtuoso a star, Laureate a jewelled crown
 * and the full wreath. The sprigs and star were generated once from curves and
 * are stored as plain paths; the right sprig is the left one mirrored.
 */
const SHIELD =
	'M6.5 6C8.3 6.9 10.2 5.6 12 5.6C13.8 5.6 15.7 6.9 17.5 6C16.8 8.3 16.6 9.7 17.2 12C17.9 15 16.6 19 12 21.4C7.4 19 6.1 15 6.8 12C7.4 9.7 7.2 8.3 6.5 6Z'
const SPRIG_STEM = 'M14 23.6C7.2 23.2 2.6 19 2.7 12.8'
const SPRIG_STEM_FULL = `${SPRIG_STEM}C2.8 9.6 3.6 7.2 5.4 5.2`
const SPRIG_LEAVES =
	'M6.78 21.22Q5.33 20.52 3.99 21.42Q5.44 22.12 6.78 21.22ZM4.13 18.36Q3.06 17.15 1.48 17.46Q2.55 18.67 4.13 18.36ZM2.86 14.94Q2.3 13.43 0.72 13.14Q1.28 14.66 2.86 14.94Z'
const SPRIG_TIP = 'M2.7 12.8Q3.52 11.41 2.75 10Q1.92 11.39 2.7 12.8Z'
const SPRIG_LEAVES_FULL =
	'M3.08 9.72Q3.09 8.08 1.76 7.13Q1.75 8.77 3.08 9.72ZM4.44 6.45Q5 4.92 4.08 3.57Q3.51 5.11 4.44 6.45ZM5.4 5.2Q6.93 4.69 7.27 3.12Q5.74 3.62 5.4 5.2Z'
const STAR =
	'M12 0.6L12.47 1.85L13.81 1.91L12.76 2.75L13.12 4.04L12 3.3L10.88 4.04L11.24 2.75L10.19 1.91L11.53 1.85Z'
const CROWN = 'M7.6 4.5L7 1.9L9.6 3.2L12 1.3L14.4 3.2L17 1.9L16.4 4.5Z'

function Sprig({ full }: { full: boolean }) {
	return (
		<>
			<path
				d={full ? SPRIG_STEM_FULL : SPRIG_STEM}
				stroke="currentColor"
				strokeWidth={1.3}
				strokeLinecap="round"
			/>
			<path
				d={
					full
						? `${SPRIG_LEAVES}${SPRIG_LEAVES_FULL}`
						: SPRIG_LEAVES + SPRIG_TIP
				}
				fill="currentColor"
			/>
		</>
	)
}

interface RankCrestProps {
	/** The contract's stable rank ID (`INITIATE` … `LAUREATE`). */
	rankId: string
	/**
	 * False for a rank the member does not hold yet (the next rank), which is
	 * drawn in ink-3 rather than its pigment (§19.2 rule 4).
	 */
	reached?: boolean
	className?: string
}

/**
 * The rank crest. Always decorative: every call site prints the rank name
 * beside it, so colour and silhouette never carry the rank alone (§19.2).
 * An ID the ladder does not know renders nothing.
 */
export function RankCrest({
	rankId,
	reached = true,
	className,
}: RankCrestProps) {
	const maskId = `rank-crest-${useId().replace(/:/g, '')}`
	const tier = rankCrestTier(rankId)
	if (tier < 0) return null

	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			focusable="false"
			data-rank={rankId}
			className={cn(
				'size-6 shrink-0',
				rankCrestColorClass(rankId, reached),
				className,
			)}
		>
			{tier === 0 ? (
				<>
					<path
						d={SHIELD}
						stroke="currentColor"
						strokeWidth={1.6}
						strokeLinejoin="round"
					/>
					<circle cx="12" cy="13.4" r="1.4" fill="currentColor" />
				</>
			) : tier === 1 ? (
				<>
					<path
						d={SHIELD}
						fill="currentColor"
						fillOpacity={0.22}
						stroke="currentColor"
						strokeWidth={1.6}
						strokeLinejoin="round"
					/>
					<path
						d="M9 16.4L12 13.4L15 16.4"
						stroke="currentColor"
						strokeWidth={1.8}
					/>
				</>
			) : (
				<>
					<defs>
						<mask
							id={maskId}
							maskUnits="userSpaceOnUse"
							x="0"
							y="0"
							width="24"
							height="24"
						>
							<path
								d={SHIELD}
								fill="#fff"
								stroke="#fff"
								strokeWidth={1.6}
								strokeLinejoin="round"
							/>
							<path
								d={SHIELD}
								stroke="#000"
								strokeWidth={1.4}
								transform="translate(12 13.5) scale(0.7) translate(-12 -13.5)"
							/>
							<path
								d="M9.6 16L12 13.6L14.4 16"
								stroke="#000"
								strokeWidth={1.6}
							/>
							<circle cx="12" cy="10.4" r="1.1" fill="#000" />
						</mask>
					</defs>
					<path
						d={SHIELD}
						fill="currentColor"
						stroke="currentColor"
						strokeWidth={1.6}
						strokeLinejoin="round"
						mask={`url(#${maskId})`}
					/>
				</>
			)}
			{tier >= 3 ? (
				<>
					<Sprig full={tier === 5} />
					<g transform="matrix(-1 0 0 1 24 0)">
						<Sprig full={tier === 5} />
					</g>
					<circle cx="12" cy="23.1" r="0.9" fill="currentColor" />
				</>
			) : null}
			{tier === 4 ? <path d={STAR} fill="currentColor" /> : null}
			{tier === 5 ? (
				<>
					<path d={CROWN} fill="currentColor" />
					<circle cx="7" cy="1.5" r="0.7" fill="currentColor" />
					<circle cx="12" cy="0.9" r="0.7" fill="currentColor" />
					<circle cx="17" cy="1.5" r="0.7" fill="currentColor" />
				</>
			) : null}
		</svg>
	)
}
