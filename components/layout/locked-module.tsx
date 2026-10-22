import type { FeatureKey } from '@sunsteel/contracts'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * BILL-02 (design system §29.1): a capability the account's plan does not
 * include, said where the section's content would be. It sits on the module's
 * ruled ground like `EmptyModule` (§28.6): the capability's name beside a lock
 * glyph, one sentence of what it does, "Available in Pro" and an outline
 * Compare plans link. Ink only -- never a blurred preview, sample data or
 * urgency -- and never a region's filled control.
 */
export function LockedModule({
	feature,
	className,
}: {
	feature: FeatureKey
	className?: string
}) {
	const t = useTranslations('billing')
	const name = t(`features.${feature}.name` as 'features.TRAINING_SIGNALS.name')
	return (
		<div
			className={cn('max-w-[68ch] space-y-1 py-3', className)}
			data-locked-feature={feature}
		>
			<p className="type-panel flex items-center gap-2 text-foreground">
				<Lock aria-hidden className="size-4 shrink-0 text-ink-2" />
				{name}
			</p>
			<p className="type-body-sm text-ink-3">
				{t(
					`features.${feature}.description` as 'features.TRAINING_SIGNALS.description',
				)}
			</p>
			<p className="type-label text-ink-2">{t('locked.availableInPro')}</p>
			<div className="pt-2">
				<Button asChild variant="outline" size="sm">
					<Link href="/plans">{t('locked.comparePlans')}</Link>
				</Button>
			</div>
		</div>
	)
}

/**
 * §29.3: a limit reached. One line in place of the control that would add one
 * more, and a text link to the plans.
 */
export function PlanLimitNote({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	const t = useTranslations('billing.locked')
	return (
		<p className={cn('type-body-sm text-ink-3', className)}>
			<Lock
				aria-hidden
				className="mr-1.5 inline size-3.5 align-[-2px] text-ink-2"
			/>
			{children}{' '}
			<Link
				href="/plans"
				className="text-foreground underline underline-offset-4 hover:text-ink-2"
			>
				{t('comparePlans')}
			</Link>
		</p>
	)
}

/** §29.2: an option in a choice that the plan does not include. */
export function LockedOptionLabel({ label }: { label: string }) {
	const t = useTranslations('billing.locked')
	return (
		<>
			<Lock aria-hidden className="size-3.5" />
			<span aria-hidden>{label}</span>
			<span className="sr-only">{t('lockedOption', { label })}</span>
		</>
	)
}
