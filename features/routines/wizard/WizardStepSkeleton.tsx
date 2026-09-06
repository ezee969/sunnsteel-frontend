'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Placeholder shown while a lazily-loaded wizard step downloads.
 *
 * Steps 3 (BuildDays) and 4 (ReviewAndCreate) are the heavy ones and are
 * pulled in via `next/dynamic` (TD-09). The user reaches them several
 * interactions after landing on the wizard, so the chunk is normally already
 * cached by then and this is never seen — it only shows on a slow connection.
 */
export const WizardStepSkeleton = () => (
	<div className="space-y-4" aria-busy="true" aria-live="polite">
		<Skeleton className="h-6 w-48" />
		<Skeleton className="h-24 w-full" />
		<Skeleton className="h-24 w-full" />
		<Skeleton className="h-10 w-40" />
	</div>
)
