'use client'

import type { ProfileVisibility, UserProfile } from '@sunsteel/contracts'
import { Eye, Globe, Lock, Users } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	ALWAYS_VISIBLE_PROFILE_ITEMS,
	getDiscoverySummary,
	getPendingPrivacyRules,
	getPrivacyAudienceGroups,
} from '@/lib/utils/privacy-overview'
import { getSharedProfilePath } from '@/lib/utils/profile-sharing'

const AUDIENCE_ICONS: Record<ProfileVisibility, typeof Globe> = {
	PUBLIC: Globe,
	FOLLOWERS: Users,
	PRIVATE: Lock,
}

type PrivacyOverviewCardProps = {
	profile: Pick<
		UserProfile,
		'username' | 'privacySettings' | 'discoverySettings'
	>
}

/**
 * TRUST-02: a read-only summary of who can see what and where, derived from
 * the saved settings (not the unsaved selectors below it). Audience is carried
 * by an icon plus a text label, never by colour (§4.3 rule 8).
 */
export function PrivacyOverviewCard({ profile }: PrivacyOverviewCardProps) {
	const groups = getPrivacyAudienceGroups(
		profile.privacySettings,
		profile.username,
	)
	const pendingRules = getPendingPrivacyRules(profile.privacySettings)
	const discovery = getDiscoverySummary(profile.discoverySettings)

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Eye className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Privacy Overview</CardTitle>
				</div>
				<CardDescription>
					What other people can see right now, based on your saved settings.
					Your email is never shown to anyone.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="divide-y divide-rule">
					{groups.map(group => {
						const Icon = AUDIENCE_ICONS[group.audience]
						const headingId = `privacy-overview-${group.audience.toLowerCase()}`
						return (
							<section
								key={group.audience}
								aria-labelledby={headingId}
								className="space-y-1 py-4 first:pt-0"
							>
								<h3
									id={headingId}
									className="type-panel flex items-center gap-2 text-foreground"
								>
									<Icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
									{group.title}
								</h3>
								<p className="type-body-sm text-ink-3">{group.surfaces}</p>
								{group.audience === 'PUBLIC' ? (
									<p className="type-body-sm text-ink-2">
										Always shown: {ALWAYS_VISIBLE_PROFILE_ITEMS.join(' · ')}
									</p>
								) : null}
								<p className="type-body-sm text-foreground">
									{group.sections.length > 0
										? group.sections.join(' · ')
										: 'No profile sections.'}
								</p>
							</section>
						)
					})}
				</div>

				<section
					aria-labelledby="privacy-overview-discovery"
					className="space-y-2"
				>
					<h3
						id="privacy-overview-discovery"
						className="type-panel text-foreground"
					>
						Member search
					</h3>
					<dl className="type-body-sm grid max-w-[480px] grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
						{discovery.map(item => (
							<div key={item.label} className="contents">
								<dt className="text-ink-3">{item.label}</dt>
								<dd className="text-foreground">{item.value}</dd>
							</div>
						))}
					</dl>
					<p className="type-body-sm text-ink-3">
						Search controls who can find you. Anyone with your link can still
						open your profile and see what is allowed above.
					</p>
				</section>

				<p className="type-body-sm text-ink-3">
					Saved for later:{' '}
					{pendingRules
						.map(rule => `${rule.label} (${rule.audience})`)
						.join(' · ')}
					. Nothing from these sections is shown on profiles yet.
				</p>

				<div>
					<Button asChild variant="outline" size="sm">
						<Link
							href={getSharedProfilePath(profile.username)}
							target="_blank"
							rel="noopener noreferrer"
						>
							Preview public profile
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
