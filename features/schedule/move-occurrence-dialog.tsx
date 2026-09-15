'use client'

import { SCHEDULE_MOVE_MAX_DAYS } from '@sunsteel/contracts'
import { SkipForward } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import {
	useMoveOccurrence,
	useSkipOccurrence,
	useUndoMove,
} from '@/lib/api/hooks/useScheduleOverrides'
import {
	describeShortDate,
	postponeTarget,
	type ScheduleMoveAction,
} from '@/lib/utils/schedule-week'

export interface MoveRequest {
	action: Extract<ScheduleMoveAction, { kind: 'MOVE' }>
	/** "Upper / Lower · Monday", for the title and messages. */
	target: string
	/** Dates it can move to, from `moveTargets`. */
	targets: string[]
}

/**
 * SCHED-04/05: reschedules one planned weekly workout — postpone it to the
 * next free day, move it to a day you pick, skip it, or put it back. Only
 * this occurrence changes; the routine and the rest of the plan do not.
 */
export function MoveOccurrenceDialog({
	request,
	onClose,
}: {
	request: MoveRequest | null
	onClose: () => void
}) {
	return (
		<Dialog open={!!request} onOpenChange={open => !open && onClose()}>
			{request ? (
				<MoveOccurrenceContent
					key={`${request.action.routineId}-${request.action.occurrenceDate}`}
					request={request}
					onClose={onClose}
				/>
			) : null}
		</Dialog>
	)
}

function MoveOccurrenceContent({
	request,
	onClose,
}: {
	request: MoveRequest
	onClose: () => void
}) {
	const { action, target } = request
	// The day it sits on now is left out: a disabled button takes the sunk
	// fill and reads as selected, and the description already names it.
	const targets = request.targets.filter(date => date !== action.currentDate)
	const postponeTo = postponeTarget(targets, action.currentDate)
	const [selected, setSelected] = useState<string | null>(null)
	const move = useMoveOccurrence()
	const skip = useSkipOccurrence()
	const undo = useUndoMove()
	const { push } = useToast()
	const busy = move.isPending || skip.isPending || undo.isPending
	const moved = action.currentDate !== action.occurrenceDate

	const fail = (title: string) => (error: Error) =>
		push({ title, description: error.message, variant: 'destructive' })

	const moveTo = (toDate: string) =>
		move.mutate(
			{
				routineId: action.routineId,
				date: action.occurrenceDate,
				toDate,
			},
			{
				onSuccess: () => {
					push({
						title: `Moved to ${describeShortDate(toDate)}`,
						description: `${target} now falls on that day.`,
						variant: 'success',
					})
					onClose()
				},
				onError: fail('Workout not moved'),
			},
		)

	const onSkip = () =>
		skip.mutate(
			{ routineId: action.routineId, date: action.occurrenceDate },
			{
				onSuccess: () => {
					push({
						title: 'Workout skipped',
						description: `${target} reads as skipped, not as missed. You can undo it.`,
						variant: 'success',
					})
					onClose()
				},
				onError: fail('Workout not skipped'),
			},
		)

	const onPutBack = () => {
		if (!action.overrideId) return
		undo.mutate(action.overrideId, {
			onSuccess: () => {
				push({
					title: 'Move undone',
					description: `${target} is back on ${describeShortDate(action.occurrenceDate)}.`,
					variant: 'success',
				})
				onClose()
			},
			onError: fail('Move not undone'),
		})
	}

	return (
		<DialogContent className="max-w-md">
			<DialogHeader>
				<DialogTitle>Reschedule {target}</DialogTitle>
				<DialogDescription>
					Planned for {describeShortDate(action.occurrenceDate)}
					{moved ? `, now on ${describeShortDate(action.currentDate)}` : ''}.
					Only this workout changes; the routine and the rest of your plan stay
					as they are.
				</DialogDescription>
			</DialogHeader>

			<div className="flex flex-wrap gap-2">
				{postponeTo ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => moveTo(postponeTo)}
						disabled={busy}
					>
						Postpone to {describeShortDate(postponeTo)}
					</Button>
				) : null}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onSkip}
					disabled={busy}
				>
					<SkipForward className="size-4" aria-hidden />
					Skip this workout
				</Button>
			</div>

			{targets.length > 0 ? (
				<div>
					<p id="move-targets-label" className="type-body-sm mb-2 text-ink-3">
						Or move it to
					</p>
					<div
						role="group"
						aria-labelledby="move-targets-label"
						className="flex flex-wrap gap-1"
					>
						{targets.map(date => {
							const isOn = selected === date
							return (
								<Button
									key={date}
									type="button"
									size="sm"
									variant={isOn ? 'secondary' : 'ghost'}
									aria-pressed={isOn}
									onClick={() => setSelected(date)}
								>
									{describeShortDate(date)}
								</Button>
							)
						})}
					</div>
				</div>
			) : (
				<p className="type-body-sm text-ink-3">
					No free day within {SCHEDULE_MOVE_MAX_DAYS} days of it: every other
					one has passed or already has a workout of this routine.
				</p>
			)}

			<DialogFooter>
				{action.overrideId ? (
					<Button
						type="button"
						variant="outline"
						onClick={onPutBack}
						disabled={busy}
					>
						Put back on {describeShortDate(action.occurrenceDate)}
					</Button>
				) : null}
				<Button type="button" variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					type="button"
					onClick={() => selected && moveTo(selected)}
					disabled={!selected || busy}
				>
					{move.isPending ? 'Moving…' : 'Move'}
				</Button>
			</DialogFooter>
		</DialogContent>
	)
}
