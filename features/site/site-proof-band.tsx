import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import { proofCells } from '@/lib/site/proof-figures'

/**
 * SITE-01 §12.3: the hero's dark foot. Four ruled cells -- figures in the
 * site numeral rank, labels in the label rank. A production build shows true
 * reserve facts in place of the mock usage figures; anywhere else those cells
 * say they are mock.
 */
export async function SiteProofBand() {
	const t = await getTranslations('site.proof')
	const locale = await getLocale()
	const format = numberFormatter(locale as Locale, {})
	const cells = proofCells(process.env.VERCEL_ENV === 'production')

	return (
		<section aria-label={t('label')} className="site-proof">
			<ul className="site-proof-row">
				{cells.map(cell => {
					const value =
						cell.kind === 'floor'
							? `${format.format(cell.value)}+`
							: format.format(cell.value)
					const label = t(cell.label)
					return (
						<li key={cell.label} className="site-proof-cell">
							<span className="type-site-numeral">{value}</span>
							<span className="type-label site-proof-label">{label}</span>
							{cell.kind === 'number' && cell.mock ? (
								<span className="site-proof-mock">{t('mockTag')}</span>
							) : null}
						</li>
					)
				})}
			</ul>
		</section>
	)
}
