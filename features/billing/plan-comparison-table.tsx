import { useTranslations } from 'next-intl'

import { PLAN_ROWS } from '@/lib/utils/plans'

/**
 * BILL-02 (design system §29.4): Free and Pro compared, row by row, in the
 * order of the owner's Pro split. Shared by `/plans` and the public site
 * (SITE-01 §12.19, §12.20), so the two can never differ; it reads its words
 * with `useTranslations`, which works on the server and in the browser.
 */
export function PlanComparisonTable() {
	const t = useTranslations('billing.plans')
	return (
		<table className="w-full border-collapse">
			<caption className="sr-only">{t('tableCaption')}</caption>
			<thead className="max-sm:sr-only">
				<tr className="border-b border-rule">
					<th scope="col" className="type-label py-2 pr-3 text-left text-ink-3">
						{t('capability')}
					</th>
					<th
						scope="col"
						className="type-label w-1/4 px-3 py-2 text-left text-ink-3"
					>
						{t('free')}
					</th>
					<th
						scope="col"
						className="type-label w-1/4 py-2 pl-3 text-left text-ink-3"
					>
						{t('pro')}
					</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-rule-faint">
				{PLAN_ROWS.map(row => {
					const free = row.worded
						? t(`rows.${row.key}.free` as 'rows.strength.free')
						: t('none')
					const pro = row.worded
						? t(`rows.${row.key}.pro` as 'rows.strength.pro')
						: t('yes')
					return (
						<tr
							key={row.key}
							className="grid grid-cols-2 gap-x-3 py-3 sm:table-row sm:py-0"
						>
							<th
								scope="row"
								className="type-body col-span-2 pb-1 text-left font-normal text-foreground sm:py-3 sm:pr-3"
							>
								{t(`rows.${row.key}.name` as 'rows.strength.name')}
							</th>
							<td className="type-body-sm text-ink-2 sm:px-3 sm:py-3">
								<span className="type-label block text-ink-3 sm:hidden">
									{t('free')}
								</span>
								{free}
							</td>
							<td className="type-body-sm text-foreground sm:py-3 sm:pl-3">
								<span className="type-label block text-ink-3 sm:hidden">
									{t('pro')}
								</span>
								{pro}
							</td>
						</tr>
					)
				})}
			</tbody>
		</table>
	)
}
