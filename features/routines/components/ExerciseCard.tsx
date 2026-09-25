'use client'

import {
	SET_KIND_LABELS,
	type SetKind,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Clock, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { formatTime } from '@/lib/utils/time'
import { formatWeight } from '@/lib/utils/weight-unit'

interface ExerciseCardProps {
	exercise: {
		id: string
		exercise?: {
			name: string
		}
		note?: string | null
		restSeconds?: number | null
		progressionScheme?: string
		warmUpsFollowLoad?: boolean
		sets?: {
			id?: string
			setNumber?: number
			reps?: number | null
			minReps?: number | null
			maxReps?: number | null
			weight?: number | null
			rir?: number | null
			rpe?: number
			kind?: SetKind
		}[]
	}
	routineId?: string
	weightUnit: WeightUnit
}

/**
 * One exercise in a routine day, as a ruled entry in the day's list rather than
 * a boxed card (§11.5). Its prescription is read-only data, so it sits on the
 * row ground in Space Mono, with no badge and no numbered tiles (§11.12). It
 * was a bordered `bg-card` box with an outlined scheme badge (TD-38).
 */
export const ExerciseCard = ({ exercise, weightUnit }: ExerciseCardProps) => {
	return (
		<div className="py-4">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
				<div className="flex min-w-0 items-center gap-2">
					<h4 className="type-panel text-foreground">
						{exercise.exercise?.name || 'Unknown Exercise'}
					</h4>
					{exercise.note && (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 relative"
								>
									<FileText className="h-4 w-4 text-foreground" />
									<span className="absolute top-0 right-0">
										<svg
											width="6"
											height="6"
											viewBox="0 0 10 10"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle cx="4" cy="4" r="4" className="fill-foreground" />
											<text
												x="4"
												y="6"
												textAnchor="middle"
												fontSize="5"
												className="fill-background"
												fontWeight="bold"
											>
												!
											</text>
										</svg>
									</span>
									<span className="sr-only">View Note</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Exercise Note</DialogTitle>
								</DialogHeader>
								<div className="bg-surface-sunk p-4">
									<p className="text-sm whitespace-pre-wrap">{exercise.note}</p>
								</div>
							</DialogContent>
						</Dialog>
					)}
				</div>
				<div className="type-body-sm flex items-center gap-3 text-ink-3">
					{exercise.restSeconds ? (
						<span className="flex items-center gap-1">
							<Clock className="h-3 w-3" aria-hidden />
							<span className="sr-only">Rest</span>
							<span className="type-data">
								{formatTime(exercise.restSeconds)}
							</span>
						</span>
					) : null}
					{exercise.progressionScheme && (
						<span>{exercise.progressionScheme.replace(/_/g, ' ')}</span>
					)}
					{exercise.warmUpsFollowLoad ? (
						<span>Warm-ups follow the working weight</span>
					) : null}
				</div>
			</div>

			{exercise.sets && exercise.sets.length > 0 && (
				<>
					<p className="type-body-sm mt-2 text-ink-3">Sets</p>
					<ol className="mt-1 space-y-1">
						{exercise.sets.map((set, index) => {
							const repDisplay =
								set.minReps && set.maxReps
									? `${set.minReps}-${set.maxReps}`
									: String(set.reps || set.minReps || 0)

							return (
								<li key={set.id || index} className="flex items-baseline gap-3">
									<span className="type-data w-6 shrink-0 text-ink-3">
										{index + 1}
									</span>
									<span className="type-data text-foreground">
										{repDisplay}
										{set.weight
											? ` @ ${formatWeight(set.weight, weightUnit)}`
											: ''}
										{set.rpe && ` (RPE ${set.rpe})`}
										{set.rir !== null &&
											set.rir !== undefined &&
											` (RIR ${set.rir})`}
									</span>
									{set.kind && set.kind !== 'WORKING' ? (
										<span className="type-body-sm text-ink-3">
											{SET_KIND_LABELS[set.kind]}
										</span>
									) : null}
								</li>
							)
						})}
					</ol>
				</>
			)}
		</div>
	)
}
