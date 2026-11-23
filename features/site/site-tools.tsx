import { ArrowRight, ArrowUp, Bell, Check } from 'lucide-react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import {
	LANDING_FACTS,
	LEDGER_RANGE,
	LEDGER_ROWS,
} from '@/lib/site/landing-examples'
import { formatWeight } from '@/lib/utils/weight-unit'

import { motionVars, SiteCard, SiteSectionHeading } from './site-parts'

/**
 * SITE-01 §12.5: the tools that make a workout easier, as a bento -- the
 * progression ledger large, rest, supersets and swapping small. Each mock-up
 * rests on its final state; the motion phase plays them as one sequence.
 * The ledger is the server's double progression (a test runs it through the
 * rule), and the rest card's lines are the server's own words.
 */
function ToolText({
	eyebrow,
	title,
	body,
	large = false,
	children,
}: {
	eyebrow: string
	title: string
	body: string
	large?: boolean
	children?: ReactNode
}) {
	return (
		<div className="site-tool-text">
			<p className="type-label text-ink-3">{eyebrow}</p>
			<h3 className="type-panel">{title}</h3>
			<p
				className={
					large ? 'type-site-lead site-body' : 'type-body-sm site-body'
				}
			>
				{body}
			</p>
			{children}
		</div>
	)
}

export async function SiteTools() {
	const t = await getTranslations('site.tools')
	const tExercises = await getTranslations('catalog.exercises')
	const tRounds = await getTranslations('workout.rounds')
	const tGroup = await getTranslations('workout.exerciseGroup')
	const locale = (await getLocale()) as Locale
	const kg = (value: number) => formatWeight(value, 'KG', locale)
	const step = kg(LANDING_FACTS.step)
	const bench = exerciseLabel('Bench Press', tExercises)

	return (
		<section aria-labelledby="tools-heading" className="site-section">
			<SiteSectionHeading id="tools-heading">{t('heading')}</SiteSectionHeading>
			{/* Desktop plays the four scripts as one sequence (each card's --seq is
			    its start); phones play each card on its own. */}
			<div
				className="site-bento"
				data-reveal="stagger"
				data-play-when="0.3"
				data-loop="10000"
				data-play-media="(min-width: 1024px)"
			>
				<SiteCard
					as="article"
					className="site-tool site-tool-large"
					data-play-when="0.5"
					data-loop="6500"
					data-play-media="(max-width: 1023px)"
					style={motionVars({ '--seq': '0s' })}
				>
					<ToolText
						eyebrow={t('progression.eyebrow')}
						title={t('progression.title')}
						body={t('progression.body', { step })}
						large
					>
						<Link
							href="/features/progression"
							className="type-action site-link"
						>
							{t('progression.link')}
							<ArrowRight className="size-4" aria-hidden />
						</Link>
					</ToolText>
					<div
						aria-hidden="true"
						data-tilt=""
						className="dark site-mock site-ledger"
					>
						<div>
							<p className="type-body-sm text-ink-2">
								{t('progression.range', {
									exercise: bench,
									min: LEDGER_RANGE.min,
									max: LEDGER_RANGE.max,
									step,
								})}
							</p>
						</div>
						<table className="site-ledger-table">
							<thead>
								<tr className="type-label text-ink-3">
									<th>{t('progression.workout')}</th>
									<th>{t('progression.weight')}</th>
									<th>{t('progression.reps')}</th>
								</tr>
							</thead>
							<tbody>
								{LEDGER_ROWS.map((row, index) => {
									const rise =
										index > 0 && row.weightKg > LEDGER_ROWS[index - 1].weightKg
									return (
										<tr
											key={index}
											data-rise={rise || undefined}
											className="sx-ledger"
											style={motionVars({ '--i': index })}
										>
											<td className="type-data">{index + 1}</td>
											<td className="type-data">{kg(row.weightKg)}</td>
											<td className="type-data">
												{rise ? (
													<span className="inline-flex items-center gap-1.5">
														<ArrowUp className="size-3.5" strokeWidth={2.2} />
														{t('progression.rise', { step })}
													</span>
												) : (
													<span className="flex gap-3">
														{row.reps.map((rep, set) => (
															<span
																key={set}
																className="inline-flex items-center gap-1"
															>
																{rep}
																{rep >= LEDGER_RANGE.max ? (
																	<Check className="size-3" strokeWidth={2.4} />
																) : null}
															</span>
														))}
													</span>
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</SiteCard>

				<SiteCard
					as="article"
					className="site-tool"
					data-play-when="0.5"
					data-loop="6500"
					data-play-media="(max-width: 1023px)"
					style={motionVars({ '--seq': '2.1s' })}
				>
					<ToolText
						eyebrow={t('rest.eyebrow')}
						title={t('rest.title')}
						body={t('rest.body')}
					/>
					<div
						aria-hidden="true"
						data-tilt=""
						className="dark site-mock site-rest"
					>
						<div className="site-notification sx-notify">
							<Bell className="mt-0.5 size-4 shrink-0" />
							<div className="min-w-0">
								<p className="flex justify-between gap-2 text-[11px] text-ink-3">
									<span>{t('rest.app')}</span>
									<span>{t('rest.now')}</span>
								</p>
								<p className="type-panel">{t('rest.notifyTitle')}</p>
								<p className="type-body-sm text-ink-2">
									{t('rest.notifyBody', { exercise: bench })}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<span className="relative h-[3px] flex-1 bg-rule">
								<span className="site-rest-fill sx-drain" />
							</span>
							<span
								className="type-data"
								data-count-from="90"
								data-count-to="0"
								data-count-ms="2400"
								data-count-delay="200"
							>
								0:00
							</span>
						</div>
					</div>
				</SiteCard>

				<SiteCard
					as="article"
					className="site-tool"
					data-play-when="0.5"
					data-loop="6500"
					data-play-media="(max-width: 1023px)"
					style={motionVars({ '--seq': '5.1s' })}
				>
					<ToolText
						eyebrow={t('supersets.eyebrow')}
						title={t('supersets.title')}
						body={t('supersets.body', { max: LANDING_FACTS.groupMax })}
					/>
					<div aria-hidden="true" data-tilt="" className="dark site-mock">
						<p className="flex items-center justify-between">
							<span className="type-label text-ink-2">
								{tRounds('groupLabel', { kind: 'SUPERSET', letter: 'A' })}
							</span>
							<span className="type-data text-ink-2">
								{tRounds('roundOfTotal', { round: 3, rounds: 3 })}
							</span>
						</p>
						<ul className="site-superset">
							{['Barbell Curl', 'Tricep Pushdown'].map((name, index) => (
								<li
									key={name}
									className="site-screen-row sx-round"
									style={motionVars({ '--i': index })}
								>
									<span className="type-data text-ink-3">A{index + 1}</span>
									<span className="flex-1 truncate">
										{exerciseLabel(name, tExercises)}
									</span>
									<Check className="size-3.5" />
								</li>
							))}
						</ul>
					</div>
				</SiteCard>

				<SiteCard
					as="article"
					className="site-tool"
					data-play-when="0.5"
					data-loop="6500"
					data-play-media="(max-width: 1023px)"
					style={motionVars({ '--seq': '6.1s' })}
				>
					<ToolText
						eyebrow={t('swap.eyebrow')}
						title={t('swap.title')}
						body={t('swap.body')}
					/>
					<div aria-hidden="true" data-tilt="" className="dark site-mock">
						<div className="site-screen-row sx-swap">
							<div className="min-w-0">
								<p className="type-panel">
									{exerciseLabel('Hack Squat', tExercises)}
								</p>
								<p className="type-body-sm text-ink-3">
									{tGroup('swappedFrom', {
										name: exerciseLabel('Leg Press', tExercises),
									})}
								</p>
							</div>
							<span className="type-data shrink-0 text-ink-2">3 × 10–12</span>
						</div>
					</div>
				</SiteCard>
			</div>
		</section>
	)
}
