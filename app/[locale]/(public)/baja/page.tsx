'use client'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'
import { ConsumerRequestForm } from '@/features/legal/consumer-request-form'
import { PlanCard } from '@/features/settings/plan-card'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

/**
 * BILL-07: the botón de baja. A signed-in member cancels here at once, with
 * the same Cancel subscription Settings offers; anyone else asks without an
 * account and gets a code, and the owner cancels it in Mercado Pago.
 */
export default function CancellationPage() {
	const t = useTranslations('billing.cancellationPage')
	const { session, isLoading } = useSupabaseAuth()

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
			<div className="flex flex-col gap-3">
				<h1 className="type-page">{t('title')}</h1>
				<p className="type-body max-w-[68ch]">
					{session ? t('introSignedIn') : t('introSignedOut')}
				</p>
			</div>
			{isLoading ? (
				<div role="status" aria-busy="true" aria-label={t('loading')}>
					<Skeleton className="h-32 w-full" />
				</div>
			) : session ? (
				<PlanCard />
			) : (
				<>
					<p className="type-body-sm text-ink-3 max-w-[68ch]">
						{t('signInInstead')}
					</p>
					<ConsumerRequestForm kind="CANCELLATION" />
				</>
			)}
		</div>
	)
}
