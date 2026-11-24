import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { RouteError } from '@/components/layout/RouteError'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
	const t = await getTranslations('core.notFound')

	return (
		<main className="ledger-page space-y-2 py-10 md:py-16">
			{/* The number is this block's headline, so it keeps the large-numeral
			    rank (§5.3); the inscription below it is the page's heading. */}
			<p className="type-numeral text-ink-3" aria-hidden>
				404
			</p>
			<RouteError title={t('title')} description={t('description')}>
				<Button asChild>
					<Link href="/">{t('goHome')}</Link>
				</Button>
			</RouteError>
		</main>
	)
}
