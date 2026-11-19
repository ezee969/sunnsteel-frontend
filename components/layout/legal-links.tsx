import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { LEGAL_PATHS } from '@/lib/legal/legal-facts'
import { cn } from '@/lib/utils'
import { CONSUMER_REQUEST_PATHS } from '@/lib/utils/consumer-requests'

/**
 * BILL-07: the terms, privacy and refund texts, and the botón de
 * arrepentimiento and the botón de baja, which Argentina's consumer law asks
 * an online seller to show where a visitor first lands. Spanish names the
 * buttons as the law does in both languages.
 */
export function LegalLinks({ className }: { className?: string }) {
	const t = useTranslations('core.legalLinks')
	return (
		<nav
			aria-label={t('label')}
			className={cn(
				'flex flex-wrap gap-x-4 gap-y-1 type-body-sm text-ink-3',
				className,
			)}
		>
			<Link
				href={LEGAL_PATHS.terms}
				className="underline underline-offset-4 hover:text-foreground"
			>
				{t('terms')}
			</Link>
			<Link
				href={LEGAL_PATHS.privacy}
				className="underline underline-offset-4 hover:text-foreground"
			>
				{t('privacy')}
			</Link>
			<Link
				href={LEGAL_PATHS.refunds}
				className="underline underline-offset-4 hover:text-foreground"
			>
				{t('refunds')}
			</Link>
			<Link
				href={CONSUMER_REQUEST_PATHS.REVOCATION}
				className="underline underline-offset-4 hover:text-foreground"
			>
				{t('revocation')}
			</Link>
			<Link
				href={CONSUMER_REQUEST_PATHS.CANCELLATION}
				className="underline underline-offset-4 hover:text-foreground"
			>
				{t('cancellation')}
			</Link>
		</nav>
	)
}
