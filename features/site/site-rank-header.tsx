'use client'

import { useEffect, useRef } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RankCrest } from '@/features/achievements/rank-crest'
import {
	RankHeaderDecoration,
	RankPortraitOrnament,
	useRankDecorationAssets,
	useRankDecorationMotion,
} from '@/features/profile/rank-decoration/rank-decoration'
import {
	RANK_HEADER_PADDING,
	RANK_PORTRAIT_MARGIN,
} from '@/features/profile/rank-decoration/rank-header-layout'
import { cn } from '@/lib/utils'
import { rankDecoration } from '@/lib/utils/rank-decoration'

/**
 * SITE-01 §12.7: the profile header as a profile draws it, dressed in a rank
 * (§24), for "Your name" with the initials avatar -- the one place outside a
 * profile where a decoration appears, shown on a phone's screen as a member
 * sees it. Its module loads with JavaScript, so without it the header stands
 * undecorated. `aria-hidden`: the section's text says what it shows. The
 * ranks phone draws all six at once, one shown (`active`): only that one's
 * decoration plays.
 */
export function SiteRankHeader({
	rankId,
	rankName,
	rankDescription,
	name,
	handle,
	initials,
	active = true,
}: {
	rankId: string
	rankName: string
	rankDescription: string
	name: string
	handle: string
	initials: string
	active?: boolean
}) {
	const decoration = rankDecoration({ id: rankId })
	const assets = useRankDecorationAssets(decoration?.slug)
	const ref = useRef<HTMLElement>(null)
	useRankDecorationMotion(ref, assets !== null && active)
	// The hook only starts the motion; a header put away stops it again.
	useEffect(() => {
		if (!active) ref.current?.removeAttribute('data-playing')
	}, [active])
	const tier = decoration?.tier ?? 0

	return (
		<div aria-hidden="true" className="site-rank-header">
			<section
				ref={ref}
				className={cn(
					'bg-background',
					decoration ? 'rank-deco relative @container' : 'pb-6',
				)}
				style={decoration?.style}
				data-rank-tier={decoration?.tier}
			>
				{decoration && assets ? (
					<RankHeaderDecoration decoration={decoration} assets={assets} />
				) : null}
				<div
					className={cn(
						'relative flex flex-col gap-5 @max-[600px]:gap-4 @min-[860px]:flex-row @min-[860px]:items-end',
						RANK_HEADER_PADDING[tier],
					)}
				>
					<div
						className={cn(
							'relative size-16 shrink-0 @min-[600px]:size-24',
							RANK_PORTRAIT_MARGIN[tier],
						)}
					>
						<RankPortraitOrnament assets={assets} layer="behind" />
						<Avatar className="h-full w-full border border-rule">
							<AvatarFallback className="type-numeral bg-surface-sunk text-ink-2">
								{initials}
							</AvatarFallback>
						</Avatar>
						<RankPortraitOrnament assets={assets} layer="front" />
					</div>
					<div className="min-w-0 flex-1 space-y-1">
						<p className="type-page corner-brackets inline-block text-foreground">
							{name}
						</p>
						<p className="flex items-center gap-2 pt-1">
							<RankCrest rankId={rankId} className="size-7" />
							<span className="type-panel text-foreground">{rankName}</span>
						</p>
						<p className="type-data text-ink-3">{handle}</p>
						<p className="type-body-sm text-ink-2">{rankDescription}</p>
					</div>
				</div>
			</section>
		</div>
	)
}
