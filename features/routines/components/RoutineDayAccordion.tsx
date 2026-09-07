'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Calendar, Play } from 'lucide-react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RoutineDay } from '@/lib/api/types/routine.type'
import { getTodayDow, validateRoutineDayDate } from '@/lib/utils/date'

import { ExerciseCard } from './ExerciseCard'

interface RoutineDayAccordionProps {
	weightUnit: WeightUnit
	days: RoutineDay[]
	routine: {
		id: string
	}
	activeSession?: { routineDayId: string } | null
	isStarting: boolean
	startActingDayId: string | null
	onStartWorkout: (dayId: string) => void
}

/**
 * Accordion component for displaying routine days with exercises and start buttons
 *
 * Features:
 * - Collapsible day sections with exercise details
 * - Start workout buttons with loading states
 * - Day of week matching indicators
 * - Program end state handling
 */
export const RoutineDayAccordion = ({
	weightUnit,
	days,
	routine,
	activeSession,
	isStarting,
	startActingDayId,
	onStartWorkout,
}: RoutineDayAccordionProps) => {
	const todayDow = getTodayDow()

	const getDayName = (dayOfWeek: number) => {
		const dayNames = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		]
		return dayNames[dayOfWeek] || 'Unknown'
	}

	return (
		<Accordion type="multiple" className="w-full">
			{days.map(day => {
				const isToday = day.dayOfWeek === todayDow
				const hasActiveSession = activeSession?.routineDayId === day.id
				const isLoadingThisDay = isStarting && startActingDayId === day.id

				// Check if this day can be started today
				const dayValidation = validateRoutineDayDate(day)
				const canStartToday = dayValidation.isValid

				return (
					<AccordionItem key={day.id} value={day.id}>
						<div className="flex items-center justify-between w-full border-b">
							<AccordionTrigger className="hover:no-underline flex-1 py-4">
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-2">
										{isToday && <Calendar className="h-4 w-4 text-primary" />}
										<span className="font-medium">
											{getDayName(day.dayOfWeek)}
										</span>
									</div>
									{isToday && (
										<Badge variant="secondary" className="text-xs">
											Today
										</Badge>
									)}
								</div>
							</AccordionTrigger>

							<div className="px-4 py-2">
								<Button
									size="sm"
									variant={hasActiveSession ? 'default' : 'outline'}
									disabled={
										isLoadingThisDay || (!hasActiveSession && !canStartToday)
									}
									onClick={() => onStartWorkout(day.id)}
								>
									{isLoadingThisDay ? (
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									) : (
										<>
											<Play className="h-4 w-4 mr-1" />
											{hasActiveSession ? 'Resume' : 'Start'}
										</>
									)}
								</Button>
							</div>
						</div>

						<AccordionContent>
							<div className="pt-4 space-y-4">
								{day.exercises && day.exercises.length > 0 ? (
									day.exercises.map(exercise => (
										<ExerciseCard
											key={exercise.id}
											exercise={exercise}
											routineId={routine.id}
											weightUnit={weightUnit}
										/>
									))
								) : (
									<p className="text-muted-foreground text-sm">
										No exercises configured for this day.
									</p>
								)}
							</div>
						</AccordionContent>
					</AccordionItem>
				)
			})}
		</Accordion>
	)
}
