'use client'

import {
	SESSION_EXERCISE_NOTE_MAX_LENGTH,
	SESSION_NOTE_MAX_LENGTH,
} from '@sunsteel/contracts'
import { Loader2, NotebookPen } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { useUpdateSessionNotes } from '@/lib/api/hooks/useWorkoutSession'
import {
	EXERCISE_NOTE_SCOPE,
	exerciseNoteLabel,
	remainingCharacters,
	WORKOUT_NOTE_SCOPE,
} from '@/lib/utils/session-notes'

function NoteDialog({
	open,
	onOpenChange,
	title,
	description,
	instruction,
	initial,
	max,
	pending,
	onSave,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	instruction?: string | null
	initial: string
	max: number
	pending: boolean
	onSave: (value: string) => void
}) {
	const [draft, setDraft] = useState(initial)
	const fieldId = useId()
	const countId = useId()
	return (
		<Dialog
			open={open}
			onOpenChange={next => {
				if (pending) return
				onOpenChange(next)
			}}
		>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{instruction ? (
					<div className="space-y-1">
						<p className="type-body-sm text-ink-3">Routine note</p>
						<p className="type-body-sm whitespace-pre-line bg-surface-sunk p-3 text-ink-2">
							{instruction}
						</p>
					</div>
				) : null}
				<div className="space-y-1">
					<Label htmlFor={fieldId} className="type-body-sm text-ink-3">
						Your note
					</Label>
					<Textarea
						id={fieldId}
						value={draft}
						maxLength={max}
						rows={5}
						aria-describedby={countId}
						onChange={event => setDraft(event.target.value)}
					/>
					<p id={countId} className="type-body-sm text-ink-3">
						{remainingCharacters(draft, max)}
					</p>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => onSave(draft)}
						disabled={pending}
					>
						{pending ? (
							<Loader2 className="size-4 animate-spin" aria-hidden />
						) : null}
						Save note
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function useSaveNote(sessionId: string) {
	const { push } = useToast()
	const save = useUpdateSessionNotes(sessionId)
	const run = (body: Parameters<typeof save.mutate>[0], onDone: () => void) =>
		save.mutate(body, {
			onSuccess: onDone,
			onError: error =>
				push({
					title: 'Could not save the note',
					description: error.message,
					variant: 'destructive',
				}),
		})
	return { run, pending: save.isPending }
}

/**
 * LIVE-16: one exercise's note for this workout. A ghost icon because it
 * repeats on every exercise; whether a note exists is in its accessible name
 * and in the note shown beside it, never in colour alone. The dialog is
 * mounted only while open, so it always starts from the saved note.
 */
export function ExerciseNoteButton({
	sessionId,
	routineExerciseId,
	exerciseName,
	note,
	instruction,
}: {
	sessionId: string
	routineExerciseId: string
	exerciseName: string
	note: string | null
	instruction?: string | null
}) {
	const [open, setOpen] = useState(false)
	const { run, pending } = useSaveNote(sessionId)
	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={exerciseNoteLabel(exerciseName, !!note)}
				title={note ? 'Edit note' : 'Add note'}
				onClick={event => {
					event.stopPropagation()
					setOpen(true)
				}}
			>
				<NotebookPen className="size-4" aria-hidden />
			</Button>
			{open ? (
				<NoteDialog
					open
					onOpenChange={setOpen}
					title={`${exerciseName}: note for this workout`}
					description={EXERCISE_NOTE_SCOPE}
					instruction={instruction}
					initial={note ?? ''}
					max={SESSION_EXERCISE_NOTE_MAX_LENGTH}
					pending={pending}
					onSave={value =>
						run({ exerciseNotes: [{ routineExerciseId, note: value }] }, () =>
							setOpen(false),
						)
					}
				/>
			) : null}
		</>
	)
}

/** LIVE-16: the note about the whole workout. */
export function WorkoutNoteButton({
	sessionId,
	note,
}: {
	sessionId: string
	note: string | null
}) {
	const [open, setOpen] = useState(false)
	const { run, pending } = useSaveNote(sessionId)
	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpen(true)}
			>
				<NotebookPen className="size-4" aria-hidden />
				{note ? 'Edit workout note' : 'Add workout note'}
			</Button>
			{open ? (
				<NoteDialog
					open
					onOpenChange={setOpen}
					title="Workout note"
					description={WORKOUT_NOTE_SCOPE}
					initial={note ?? ''}
					max={SESSION_NOTE_MAX_LENGTH}
					pending={pending}
					onSave={value => run({ notes: value }, () => setOpen(false))}
				/>
			) : null}
		</>
	)
}
