'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CloneSharedRoutine } from '@/features/routines/components/CloneSharedRoutine'
import { SharedRoutineView } from '@/features/routines/components/SharedRoutineView'
import { useMemberRoutine } from '@/lib/api/hooks/useRoutineSharing'
import { HttpError } from '@/lib/api/services/httpClient'

interface MemberRoutineViewProps {
	identifier: string
	routineId: string
	profileHref: string
}

/**
 * One member's routine, opened from their profile. A routine this viewer may
 * not read answers 404, exactly as it does through a link, so this page cannot
 * tell a narrowed routine apart from one that never existed either.
 */
export function MemberRoutineView({
	identifier,
	routineId,
	profileHref,
}: MemberRoutineViewProps) {
	const { data, error, isLoading, refetch } = useMemberRoutine(
		identifier,
		routineId,
	)

	const back = (
		<Button asChild variant="ghost" size="sm">
			<Link href={profileHref}>
				<ArrowLeft className="size-4" aria-hidden /> Back to profile
			</Link>
		</Button>
	)

	if (isLoading) {
		return (
			<div className="space-y-6" aria-busy="true" aria-label="Loading routine">
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (!data) {
		const isGone = error instanceof HttpError && error.status === 404
		return (
			<div className="space-y-3">
				{back}
				<h1 className="type-section text-foreground">
					{isGone ? 'Routine unavailable' : 'Could not load this routine'}
				</h1>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{isGone
						? 'It is no longer shared, or it never was.'
						: 'Check your connection and try again.'}
				</p>
				{!isGone ? (
					<Button type="button" variant="outline" onClick={() => refetch()}>
						Try again
					</Button>
				) : null}
			</div>
		)
	}

	return (
		<div className="space-y-10">
			{back}
			<SharedRoutineView routine={data} />
			<CloneSharedRoutine
				source={{ routineId }}
				routineName={data.setup.name}
			/>
		</div>
	)
}
