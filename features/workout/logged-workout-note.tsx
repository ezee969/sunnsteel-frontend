'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useRemoveLoggedWorkout } from '@/lib/api/hooks/useWorkoutSession'

/**
 * LIVE-23: a workout logged after it happened says so on its page, and is
 * the one kind of workout its owner can remove. Editing is removing and
 * logging it again.
 */
export function LoggedWorkoutNote({ sessionId }: { sessionId: string }) {
	const t = useTranslations('workout.loggedWorkout')
	const router = useRouter()
	const { push } = useToast()
	const errorText = useApiErrorMessage()
	const remove = useRemoveLoggedWorkout()
	const [confirming, setConfirming] = useState(false)
	const [problem, setProblem] = useState<string | null>(null)

	return (
		<section
			aria-labelledby="logged-workout-heading"
			className="space-y-3 border-y border-rule py-4"
		>
			<h2 id="logged-workout-heading" className="type-panel text-foreground">
				{t('title')}
			</h2>
			<p className="type-body-sm text-ink-2">{t('body')}</p>
			<Button
				type="button"
				variant="outline"
				onClick={() => {
					setProblem(null)
					setConfirming(true)
				}}
			>
				{t('remove')}
			</Button>
			<AlertDialog
				open={confirming}
				onOpenChange={open => {
					if (!remove.isPending) setConfirming(open)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('removeQuestion')}</AlertDialogTitle>
						<AlertDialogDescription>{t('removeBody')}</AlertDialogDescription>
					</AlertDialogHeader>
					{problem ? (
						<p role="alert" className="type-body-sm text-ink">
							{problem}
						</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={remove.isPending}>
							{t('keep')}
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructiveSolid"
							disabled={remove.isPending}
							onClick={() =>
								void remove
									.mutateAsync(sessionId)
									.then(() => {
										push({ title: t('removed'), variant: 'success' })
										router.replace('/workouts/history')
									})
									.catch(error => setProblem(errorText(error)))
							}
						>
							{remove.isPending ? (
								<Loader2 className="size-4 animate-spin" aria-hidden />
							) : null}
							{t('confirmRemove')}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
