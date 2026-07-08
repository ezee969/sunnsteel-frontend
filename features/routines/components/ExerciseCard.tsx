'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { formatTime } from '@/lib/utils/time'
import { FileText, Clock } from 'lucide-react'

interface ExerciseCardProps {
	exercise: {
		id: string
		exercise?: {
			name: string
		}
		note?: string | null
		restSeconds?: number | null
		progressionScheme?: string
		sets?: {
			id?: string
			setNumber?: number
			reps?: number | null
			minReps?: number | null
			maxReps?: number | null
			weight?: number | null
			rir?: number | null
			rpe?: number
		}[]
	}
	routineId?: string
}

/**
 * Card component for displaying exercise details within routine days
 *
 * Features:
 * - Exercise name and progression scheme display
 * - Set details with reps, weight, and RPE/RIR
 * - Numbered set indicators
 */
export const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
	return (
		<div className="border rounded-lg p-4 bg-card">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<h4 className="font-medium">
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
									<FileText className="h-4 w-4 text-yellow-500" />
									<span className="absolute top-0 right-0">
										<svg
											width="6"
											height="6"
											viewBox="0 0 10 10"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle
												cx="4"
												cy="4"
												r="4"
												fill="#FACC15"
												stroke="#FFF"
												strokeWidth="0"
											/>
											<text
												x="4"
												y="6"
												textAnchor="middle"
												fontSize="5"
												fill="#FFF"
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
								<div className="p-4 bg-muted/20 rounded-md">
									<p className="text-sm whitespace-pre-wrap">{exercise.note}</p>
								</div>
							</DialogContent>
						</Dialog>
					)}
				</div>
				<div className="flex items-center gap-2">
					{exercise.restSeconds ? (
						<div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
							<Clock className="h-3 w-3" />
							<span>{formatTime(exercise.restSeconds)}</span>
						</div>
					) : null}
					{exercise.progressionScheme && (
						<Badge variant="outline" className="text-xs">
							{exercise.progressionScheme.replace(/_/g, ' ')}
						</Badge>
					)}
				</div>
			</div>

			{exercise.sets && exercise.sets.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm text-muted-foreground">Sets:</p>
					{exercise.sets.map((set, index) => {
						const repDisplay =
							set.minReps && set.maxReps
								? `${set.minReps}-${set.maxReps}`
								: String(set.reps || set.minReps || 0)

						const displayWeight = set.weight || 0

						return (
							<div
								key={set.id || index}
								className="text-sm flex items-center gap-2"
							>
								<span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
									{index + 1}
								</span>
								<span>
									{repDisplay} @ {displayWeight}kg
									{set.rpe && ` (RPE ${set.rpe})`}
									{set.rir !== null &&
										set.rir !== undefined &&
										` (RIR ${set.rir})`}
								</span>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
