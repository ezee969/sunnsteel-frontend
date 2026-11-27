import { ArrowUp, Check } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { PHONE_CLOCK } from './site-parts'

/**
 * SITE-01 §12.2 and §33.8: the live-session phone on the hero's lower edge, an
 * original frame (never a manufacturer's). Synthetic data, named as an
 * example for assistive technology (the frame itself is `aria-hidden`); no
 * visible "Example" mark since the owner's review of 2026-11-22.
 *
 * Its script (plan §12.2, under 5 seconds): the heavier third set is ticked,
 * the rest bar appears and counts down, and the record that set made rises
 * under the phone -- then the phone rests on that state, which is also what
 * the server sends and what reduced motion shows. It runs once at first
 * paint in CSS, then the motion runtime replays it while the phone stays in
 * view and each time it comes back (`data-play-when`, `data-loop`). What is
 * done or earned takes the site's gold (§33.13).
 */
const SETS = [
	{ number: 1, kg: 80 },
	{ number: 2, kg: 80 },
	{ number: 3, kg: 85 },
]
const RECORD = SETS[SETS.length - 1]

export async function HeroPhone() {
	const t = await getTranslations('site.hero')
	return (
		<figure
			aria-label={t('phoneLabel')}
			data-tilt=""
			data-play-when="0.5"
			data-loop="9000"
			className="site-phone"
		>
			<div aria-hidden="true" className="site-phone-frame">
				<div className="flex items-center justify-between text-[9px] leading-none text-ink-2">
					<span className="site-device-clock">{PHONE_CLOCK}</span>
					<span className="flex items-center gap-1">
						<span className="flex gap-0.5">
							{[0, 1, 2].map(dot => (
								<span key={dot} className="size-[3px] rounded-full bg-ink-2" />
							))}
						</span>
						<span className="h-[7px] w-[5px] bg-ink-2" />
					</span>
				</div>
				<p className="site-phone-title">{t('exercise')}</p>
				<p className="type-label mt-[14px] text-[8px] text-ink-2">
					{t('live')}
				</p>
				<ol className="mt-[10px] flex flex-col gap-1.5">
					{SETS.map(set => (
						<li
							key={set.number}
							className="site-phone-set flex h-[34px] items-center justify-between border border-rule px-2.5 font-mono text-xs"
						>
							<span>
								{set.number}&nbsp;&nbsp; {set.kg} kg × 5
								<span className="sr-only">
									{t('setDone', { number: set.number })}
								</span>
							</span>
							<Check
								className={
									set === RECORD ? 'sx-hero-tick size-3.5' : 'size-3.5'
								}
								aria-hidden
							/>
						</li>
					))}
				</ol>
				<div className="sx-hero-rest mt-[26px] border-t border-rule-faint pt-3">
					<p className="type-label text-[8px] text-ink-2">{t('rest')}</p>
					<div className="mt-2 flex items-center gap-2.5 text-[11px]">
						<span className="relative h-[3px] flex-1 bg-rule">
							<span className="site-phone-rest" />
						</span>
						<span
							className="font-mono"
							data-count-from="90"
							data-count-to="84"
							data-count-ms="1600"
							data-count-delay="1700"
						>
							1:24
						</span>
					</div>
				</div>
			</div>
			<div aria-hidden="true" className="site-record">
				<ArrowUp className="size-5 shrink-0 text-honour" strokeWidth={2.2} />
				<div className="text-[13px] leading-snug">
					{t('recordCard', { exercise: t('exercise') })}
					<b className="mt-0.5 block text-[15px] font-normal">
						{RECORD.kg} kg × 5
					</b>
				</div>
			</div>
		</figure>
	)
}
