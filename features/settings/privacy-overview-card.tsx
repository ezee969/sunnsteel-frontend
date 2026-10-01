'use client'

import type { ProfileVisibility, UserProfile } from '@sunsteel/contracts'
import { Eye, Globe, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	alwaysVisibleProfileItems,
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
	const t = useTranslations('settings.privacyOverview')
	const groups = getPrivacyAudienceGroups(
		t,
		profile.privacySettings,
		profile.username,
	)
	const pendingRules = getPendingPrivacyRules(t, profile.privacySettings)
	const discovery = getDiscoverySummary(t, profile.discoverySettings)

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Eye className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>{t('title')}</CardTitle>
				</div>
				{/* UX-17 (§23.4): one line shown, the full text one tap away. */}
				<Explanation summary={t('descriptionSummary')}>
					<p>{t('description')}</p>
				</Explanation>
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
										{t('alwaysShown', {
											items: alwaysVisibleProfileItems(t).join(' · '),
										})}
									</p>
								) : null}
								<p className="type-body-sm text-foreground">
									{group.sections.length > 0
										? group.sections.join(' · ')
										: t('noSections')}
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
						{t('memberSearch')}
					</h3>
					<dl className="type-body-sm grid max-w-[480px] grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
						{discovery.map(item => (
							<div key={item.label} className="contents">
								<dt className="text-ink-3">{item.label}</dt>
								<dd className="text-foreground">{item.value}</dd>
							</div>
						))}
					</dl>
					<Explanation summary={t('searchNoteSummary')}>
						<p>{t('searchNote')}</p>
					</Explanation>
				</section>

				<p className="type-body-sm text-ink-3">
					{t('savedForLater', {
						rules: pendingRules
							.map(rule => `${rule.label} (${rule.audience})`)
							.join(' · '),
					})}
				</p>

				<div>
					<Button asChild variant="outline" size="sm">
						<Link
							href={getSharedProfilePath(profile.username)}
							target="_blank"
							rel="noopener noreferrer"
						>
							{t('preview')}
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
