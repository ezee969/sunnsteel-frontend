import { ArrowUp, Check } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/**
 * SITE-01 §12.2 and §33.8: the live-session phone on the hero's lower edge, an
 * original frame (never a manufacturer's) resting on the state its script ends
 * on -- three sets done, the rest bar, the record. Synthetic data, marked
 * "Example" where the comp has the status bar's clock; `aria-hidden`, with the
 * region named for assistive technology instead.
 */
const SETS = [1, 2, 3]

export async function HeroPhone() {
	const t = await getTranslations('site.hero')
	return (
		<figure aria-label={t('phoneLabel')} className="site-phone">
			<div aria-hidden="true" className="site-phone-frame">
				<div className="flex items-center justify-between text-[9px] leading-none text-ink-2">
					<span className="type-label text-[8px] text-ink-2">
						{t('example')}
					</span>
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
							key={set}
							className="flex h-[34px] items-center justify-between border border-rule px-2.5 font-mono text-xs"
						>
							<span>
								{set}&nbsp;&nbsp; 80 kg × 5
								<span className="sr-only">{t('setDone', { number: set })}</span>
							</span>
							<Check className="size-3.5" aria-hidden />
						</li>
					))}
				</ol>
				<div className="mt-[26px] border-t border-rule-faint pt-3">
					<p className="type-label text-[8px] text-ink-2">{t('rest')}</p>
					<div className="mt-2 flex items-center gap-2.5 text-[11px]">
						<span className="relative h-[3px] flex-1 bg-rule">
							<span className="absolute inset-y-0 left-0 w-3/5 bg-foreground" />
						</span>
						<span className="font-mono">1:24</span>
					</div>
				</div>
			</div>
			<div aria-hidden="true" className="site-record">
				<ArrowUp className="size-5 shrink-0 text-honour" strokeWidth={2.2} />
				<div className="text-[13px] leading-snug">
					{t('recordCard', { exercise: t('exercise') })}
					<b className="mt-0.5 block text-[15px] font-normal">85 kg × 5</b>
				</div>
			</div>
		</figure>
	)
}
