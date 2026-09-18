'use client'

import type { CloneRoutineRequest } from '@sunsteel/contracts'
import { Copy, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useCloneRoutine } from '@/lib/api/hooks/useRoutineSharing'
import {
	CLONE_ROUTINE_NOTE,
	CLONE_ROUTINE_PRIVACY_NOTE,
} from '@/lib/utils/routine-sharing'

interface CloneSharedRoutineProps {
	/** Exactly one source, matching the read the viewer arrived through. */
	source: CloneRoutineRequest
	routineName: string
}

/**
 * ROUT-05. The reader's own copy of a routine they were allowed to read. It
 * says what a clone is before making one, because "clone" alone leaves open
 * whether the two routines stay linked and who sees the edits: they do not,
 * and nobody but the new owner does.
 */
export function CloneSharedRoutine({
	source,
	routineName,
}: CloneSharedRoutineProps) {
	const router = useRouter()
	const { push } = useToast()
	const clone = useCloneRoutine()

	const run = () => {
		clone.mutate(source, {
			onSuccess: routine => {
				push({
					title: 'Routine cloned',
					description: `${routine.name} is now one of your routines.`,
					variant: 'success',
				})
				router.push(`/routines/${routine.id}`)
			},
			onError: error => {
				push({
					title: 'Could not clone this routine',
					description: error.message,
					variant: 'destructive',
				})
			},
		})
	}

	return (
		<section aria-labelledby="clone-routine" className="space-y-3">
			<h2
				id="clone-routine"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Copy className="h-4 w-4 text-ink-3" aria-hidden />
				Make it yours
			</h2>
			<p className="type-body-sm max-w-[68ch] text-ink-2">
				{CLONE_ROUTINE_NOTE}
			</p>
			<p className="type-body-sm max-w-[68ch] text-ink-3">
				{CLONE_ROUTINE_PRIVACY_NOTE}
			</p>
			<Button
				type="button"
				onClick={run}
				disabled={clone.isPending}
				aria-label={`Clone ${routineName}`}
			>
				{clone.isPending ? (
					<Loader2 className="size-4 animate-spin" aria-hidden />
				) : null}
				Clone this routine
			</Button>
		</section>
	)
}
