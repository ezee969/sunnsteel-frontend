'use client'

import type { SharedSessionRecap } from '@sunsteel/contracts'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SessionRecapContent } from '@/features/workout/session-recap'
import { getSharedProfilePath } from '@/lib/utils/profile-sharing'
import { sharedRecapToRecapView } from '@/lib/utils/session-share'

/**
 * The signed-out view of a shared session (SOC-07). It renders only what the
 * owner selected, in the owner's weight unit, and links to their public
 * profile, where profile privacy decides what else is visible.
 */
export function SharedSessionView({ shared }: { shared: SharedSessionRecap }) {
	const { recap, sections } = sharedRecapToRecapView(shared)
	const { owner } = shared
	const ownerName = [owner.name, owner.lastName].filter(Boolean).join(' ')
	const profilePath = getSharedProfilePath(owner.username)
	const finishedOn = new Date(shared.endedAt).toLocaleDateString(undefined, {
		dateStyle: 'long',
	})

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
			<header className="rule-heading space-y-3 pb-6">
				<p className="type-label text-ink-3">Shared workout</p>
				<h1 className="type-page corner-brackets inline-block text-foreground">
					{shared.routineName}
				</h1>
				<p className="type-body-sm text-ink-3">
					{shared.dayName ? `${shared.dayName} · ` : ''}Finished {finishedOn}
				</p>
				<Link
					href={profilePath}
					className="group flex w-fit items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				>
					<Avatar className="h-10 w-10 shrink-0 border border-rule">
						<AvatarImage
							src={owner.avatarUrl || ''}
							alt=""
							className="object-cover"
						/>
						<AvatarFallback className="type-data bg-surface-sunk text-ink-2">
							{owner.name.charAt(0)}
							{owner.lastName?.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<span className="min-w-0">
						<span className="type-panel block text-foreground underline-offset-4 group-hover:underline">
							{ownerName}
						</span>
						<span className="type-body-sm block text-ink-3">
							@{owner.username}
						</span>
					</span>
				</Link>
			</header>

			<section aria-labelledby="shared-recap-heading">
				<h2 id="shared-recap-heading" className="sr-only">
					Session recap
				</h2>
				<SessionRecapContent
					recap={recap}
					sections={sections}
					weightUnit={shared.weightUnit}
				/>
			</section>

			<div>
				<Button asChild variant="outline">
					<Link href={profilePath}>View {owner.name}’s profile</Link>
				</Button>
			</div>
		</div>
	)
}
