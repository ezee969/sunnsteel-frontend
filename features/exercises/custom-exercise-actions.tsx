'use client'

import { Archive, ArchiveRestore, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import {
	useArchiveCustomExercise,
	useDeleteCustomExercise,
} from '@/lib/api/hooks/useExercises'
import type { Exercise } from '@/lib/api/types/exercise.type'
import {
	CUSTOM_EXERCISE_COPY,
	isArchivedExercise,
} from '@/lib/utils/custom-exercises'

import { CustomExerciseDialog } from './custom-exercise-dialog'

/**
 * EXER-06: the owner's controls on their own exercise page. Deleting is
 * offered only while nothing uses the exercise -- the server's rule, stated
 * rather than refused on click -- and archiving is the way out otherwise.
 */
export function CustomExerciseActions({ exercise }: { exercise: Exercise }) {
	const router = useRouter()
	const [editing, setEditing] = useState(false)
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const archive = useArchiveCustomExercise()
	const remove = useDeleteCustomExercise()
	const archived = isArchivedExercise(exercise)

	return (
		<section aria-labelledby="exercise-yours" className="space-y-3">
			<div className="border-b border-rule pb-2">
				<h2 id="exercise-yours" className="type-section text-foreground">
					Your exercise
				</h2>
				<p className="type-body-sm mt-1 text-ink-3">
					{archived
						? 'Archived. It is out of the catalog and the routine pickers; routines, workouts and records keep it.'
						: 'Only you can see and use it.'}
				</p>
			</div>
			{exercise.note ? (
				<div className="space-y-1">
					<p className="type-body-sm text-ink-3">Your note</p>
					<p className="type-body-sm whitespace-pre-line bg-surface-sunk p-3 text-ink-2">
						{exercise.note}
					</p>
				</div>
			) : null}
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => setEditing(true)}
				>
					<Pencil className="size-4" aria-hidden />
					Edit
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={archive.isPending}
					onClick={() =>
						archive.mutate({ id: exercise.id, archived: !archived })
					}
				>
					{archive.isPending ? (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					) : archived ? (
						<ArchiveRestore className="size-4" aria-hidden />
					) : (
						<Archive className="size-4" aria-hidden />
					)}
					{archived ? 'Restore' : 'Archive'}
				</Button>
				{exercise.inUse ? null : (
					<Button
						type="button"
						variant="destructive"
						onClick={() => setConfirmingDelete(true)}
					>
						<Trash2 className="size-4" aria-hidden />
						Delete
					</Button>
				)}
			</div>
			<p className="type-body-sm text-ink-3">
				{exercise.inUse
					? CUSTOM_EXERCISE_COPY.inUse
					: archived
						? CUSTOM_EXERCISE_COPY.deleteDescription
						: CUSTOM_EXERCISE_COPY.archiveDescription}
			</p>

			<CustomExerciseDialog
				open={editing}
				onOpenChange={setEditing}
				exercise={exercise}
			/>
			<AlertDialog
				open={confirmingDelete}
				onOpenChange={open => {
					if (!remove.isPending) setConfirmingDelete(open)
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {exercise.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							{CUSTOM_EXERCISE_COPY.deleteDescription} Nothing uses it now, so
							nothing else changes.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={remove.isPending}>
							Keep it
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructiveSolid"
							disabled={remove.isPending}
							onClick={() =>
								void remove
									.mutateAsync(exercise.id)
									.then(() => router.push('/exercises'))
									.catch(() => setConfirmingDelete(false))
							}
						>
							{remove.isPending ? (
								<Loader2 className="size-4 animate-spin" aria-hidden />
							) : null}
							Delete exercise
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}
