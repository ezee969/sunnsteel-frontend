'use client'

import { useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EnforcementRecord } from '@/features/moderation/enforcement-record'
import { ReportQueue } from '@/features/moderation/report-queue'
import { useUser } from '@/lib/api/hooks/useUser'
import { MODERATION_QUEUE_SCOPE } from '@/lib/utils/moderation'

type ModerationView = 'queue' | 'record'

/**
 * TRUST-04. The page renders nothing for an account without the flag, and the
 * sidebar does not offer it either; the server answers 404 on every route
 * regardless, so this is presentation rather than the control.
 */
export default function ModerationPage() {
	const { user, isLoading } = useUser()
	const [view, setView] = useState<ModerationView>('queue')

	if (isLoading) return <Skeleton className="h-40" />
	if (!user?.isModerator) {
		return (
			<div className="mx-auto max-w-4xl">
				<p className="type-body-sm text-ink-3">Page not found.</p>
			</div>
		)
	}

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Moderation</>}
				subtitle={<>{MODERATION_QUEUE_SCOPE}</>}
			/>
			<div role="group" aria-label="Moderation view" className="flex gap-1">
				{(['queue', 'record'] as const).map(option => (
					<Button
						key={option}
						type="button"
						size="sm"
						variant={view === option ? 'secondary' : 'ghost'}
						aria-pressed={view === option}
						onClick={() => setView(option)}
					>
						{option === 'queue' ? 'Reports' : 'Record'}
					</Button>
				))}
			</div>
			{view === 'queue' ? <ReportQueue /> : <EnforcementRecord />}
		</div>
	)
}
