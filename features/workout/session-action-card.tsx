'use client'

import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SessionProgressData } from '@/lib/utils/workout-session.types'

interface SessionActionCardProps {
	sessionId: string
	routineName: string
	dayName: string
	startedAt: string
	progressData: SessionProgressData
	isFinishing: boolean
	onFinishAttempt: () => void
	onDiscardAttempt: () => void
	onNavigateBack: () => void
}

/**
 * Reusable component for displaying session information and primary actions
 */
export const SessionActionCard = ({
	progressData,
	isFinishing,
	onFinishAttempt,
	onDiscardAttempt,
}: SessionActionCardProps) => {
	const { percentage } = progressData
	const isComplete = percentage === 100

	return (
		<Card className="shadow-lg border-2">
			<CardContent className="space-y-4">
				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Progress</span>
						<span className="font-medium">{Math.round(percentage)}%</span>
					</div>
					<Progress value={percentage} className="h-2" />
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						onClick={onDiscardAttempt}
						disabled={isFinishing}
						size="sm"
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 className="mr-1 h-4 w-4" aria-hidden />
						Discard
					</Button>
					<Button
						type="button"
						onClick={onFinishAttempt}
						disabled={isFinishing}
						size="sm"
						className={`flex-1 ${
							isComplete
								? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
								: ''
						}`}
					>
						{isFinishing ? (
							<>
								<AlertCircle className="h-4 w-4 mr-1 animate-spin" />
								Finishing...
							</>
						) : isComplete ? (
							<>
								<CheckCircle className="h-4 w-4 mr-1" />
								Finish Session
							</>
						) : (
							'Finish Session'
						)}
					</Button>
				</div>

				{/* Completion Status */}
				{!isComplete && (
					<div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md">
						<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
						<p className="text-xs text-amber-700 dark:text-amber-300">
							Complete all sets to finish the session
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
