import { ACTIVITY_REACTIONS, type ProfileVisibility } from '@sunsteel/contracts'
import { Bell, Check } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import { LANDING_FACTS, PLAN_TEMPLATE } from '@/lib/site/landing-examples'
import { PRIVACY_SECTION_LABEL_KEYS } from '@/lib/utils/privacy-overview'
import { templateText } from '@/lib/utils/routine-templates'

import { ExampleMark, SiteSectionHeading } from './site-parts'

/**
 * SITE-01 §12.9: training is better with people, and free, without looking
 * like a feed to post to. Each scene's panel rests on the final state of its
 * fragment (the motion phase plays them in turn); the reactions, the partner
 * alert, the privacy rows and the clone action are the app's own words.
 * Partner encouragement never appears here (the owner, 2026-11-21).
 */
const REACTION_LABEL = {
	STRENGTH: 'reactionStrength',
	DISCIPLINE: 'reactionDiscipline',
	RESPECT: 'reactionRespect',
	INSPIRING: 'reactionInspiring',
} as const
const REACTION_COUNTS = { STRENGTH: 3, DISCIPLINE: 1, RESPECT: 2, INSPIRING: 1 }
const PRIVACY_ROWS: Array<{
	key: 'records' | 'workoutHistory' | 'rank'
	value: ProfileVisibility
}> = [
	{ key: 'records', value: 'FOLLOWERS' },
	{ key: 'workoutHistory', value: 'PRIVATE' },
	{ key: 'rank', value: 'PUBLIC' },
]
const AUDIENCES: ProfileVisibility[] = ['PUBLIC', 'FOLLOWERS', 'PRIVATE']

function Initials({ children }: { children: ReactNode }) {
	return <span className="site-initials type-label">{children}</span>
}

function Scene({
	eyebrow,
	title,
	body,
	example,
	children,
}: {
	eyebrow: string
	title: string
	body: string
	example: string
	children: ReactNode
}) {
	return (
		<li className="site-scene">
			<p className="type-label text-ink-3">{eyebrow}</p>
			<h3 className="type-panel">{title}</h3>
			<p className="type-body-sm site-body mt-0">{body}</p>
			<div aria-hidden="true" className="site-card site-scene-panel">
				<ExampleMark label={example} />
				{children}
			</div>
		</li>
	)
}

export async function SitePeople() {
	const t = await getTranslations('site.people')
	const tMock = await getTranslations('site.mock')
	const tActivity = await getTranslations('social.activity')
	const tNotifications = await getTranslations('social.notifications')
	const tPartners = await getTranslations('settings.trainingPartners')
	const tSharing = await getTranslations('routines.sharing')
	const tTemplates = await getTranslations('routines.templates')
	const tPrivacy = await getTranslations('settings.privacyOverview')
	const locale = (await getLocale()) as Locale
	const example = tMock('example')
	const name = t('name')
	const push = tTemplates('days.push')
	const parts = new Intl.ListFormat(intlLocale(locale), {
		type: 'conjunction',
	}).format([
		tPartners('permission.activity.label'),
		tPartners('permission.progress.label'),
	])

	return (
		<section aria-labelledby="people-heading" className="site-section">
			<SiteSectionHeading id="people-heading">
				{t('heading')}
			</SiteSectionHeading>
			<p className="type-site-lead site-body">{t('subline')}</p>
			<ul className="site-scenes">
				<Scene
					eyebrow={t('activity.eyebrow')}
					title={t('activity.title')}
					body={t('activity.body', { reactions: ACTIVITY_REACTIONS.length })}
					example={example}
				>
					<div className="site-entry">
						<Initials>{t('initials')}</Initials>
						<p className="type-body-sm">
							{t('activity.entry', { name, day: push, records: 3 })}
						</p>
					</div>
					<ul className="site-reactions">
						{ACTIVITY_REACTIONS.map(reaction => (
							<li
								key={reaction}
								data-chosen={reaction === 'STRENGTH' || undefined}
							>
								{tActivity(REACTION_LABEL[reaction])}
								<span className="type-data">{REACTION_COUNTS[reaction]}</span>
							</li>
						))}
					</ul>
				</Scene>

				<Scene
					eyebrow={t('partners.eyebrow')}
					title={t('partners.title')}
					body={t('partners.body', { max: LANDING_FACTS.partnersMax })}
					example={example}
				>
					<div className="site-entry">
						<Initials>{t('initials')}</Initials>
						<div className="min-w-0">
							<p className="type-panel">{name}</p>
							<p className="type-body-sm text-ink-2">
								{t('partners.shares', { parts })}
							</p>
						</div>
					</div>
					<div className="site-notification">
						<Bell className="mt-0.5 size-4 shrink-0" />
						<div className="min-w-0">
							<p className="type-panel">
								{tNotifications('partnerSessionTitle', { name })}
							</p>
							<p className="type-body-sm text-ink-2">
								{tNotifications('partnerSessionDetail', { workout: push })}
							</p>
						</div>
					</div>
				</Scene>

				<Scene
					eyebrow={t('messages.eyebrow')}
					title={t('messages.title')}
					body={t('messages.body')}
					example={example}
				>
					<div className="site-entry">
						<Initials>{t('initials')}</Initials>
						<div className="min-w-0 flex-1">
							<p className="type-panel">{name}</p>
							<p className="type-body-sm">{t('messages.sample')}</p>
							<div className="site-routine-card">
								<p className="type-panel">
									{templateText(PLAN_TEMPLATE, tTemplates).name}
								</p>
								<p className="type-body-sm text-ink-3">
									{tTemplates('size', {
										count: PLAN_TEMPLATE.days.reduce(
											(total, day) => total + day.exercises.length,
											0,
										),
									})}
								</p>
								<span className="type-action site-outline-mock">
									{tSharing('cloneThisRoutine')}
								</span>
							</div>
						</div>
					</div>
					<p className="type-body-sm inline-flex items-center gap-1.5">
						<Check className="size-4" />
						{t('messages.copied')}
					</p>
				</Scene>
			</ul>

			<div className="site-privacy">
				<div>
					<h3 className="type-panel">{t('privacy.title')}</h3>
					<p className="type-body site-body">
						{t('privacy.body', { count: LANDING_FACTS.privacyParts })}
					</p>
				</div>
				<ul aria-hidden="true" className="site-privacy-rows">
					{PRIVACY_ROWS.map(row => (
						<li key={row.key} className="site-privacy-row">
							<span className="type-body-sm">
								{tPrivacy(PRIVACY_SECTION_LABEL_KEYS[row.key])}
							</span>
							<span className="site-segmented">
								{AUDIENCES.map(audience => (
									<span
										key={audience}
										data-on={audience === row.value || undefined}
										className="type-action"
									>
										{tPrivacy(`audience.${audience}`)}
									</span>
								))}
							</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	)
}
