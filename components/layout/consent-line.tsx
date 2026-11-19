import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { LEGAL_PATHS } from '@/lib/legal/legal-facts'
import { cn } from '@/lib/utils'

const linkClass = 'underline underline-offset-4 hover:text-foreground'

/**
 * BILL-07: what a member accepts by acting, with the texts one click away:
 * the terms and privacy policy on sign-up, the terms and refund policy before
 * subscribing.
 */
export function ConsentLine({
	kind,
	className,
}: {
	kind: 'signup' | 'checkout'
	className?: string
}) {
	const t = useTranslations('core.consent')
	const links = {
		terms: (chunks: React.ReactNode) => (
			<Link href={LEGAL_PATHS.terms} className={linkClass}>
				{chunks}
			</Link>
		),
		privacy: (chunks: React.ReactNode) => (
			<Link href={LEGAL_PATHS.privacy} className={linkClass}>
				{chunks}
			</Link>
		),
		refunds: (chunks: React.ReactNode) => (
			<Link href={LEGAL_PATHS.refunds} className={linkClass}>
				{chunks}
			</Link>
		),
	}
	return (
		<p className={cn('type-body-sm max-w-[68ch] text-ink-3', className)}>
			{kind === 'signup' ? t.rich('signup', links) : t.rich('checkout', links)}
		</p>
	)
}
