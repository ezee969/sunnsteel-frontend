'use client'

import type { RoutineScheduleMode, WeightUnit } from '@sunsteel/contracts'
import { Calendar, Loader2, Play, Repeat } from 'lucide-react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import type { RoutineDay } from '@/lib/api/types/routine.type'
import { getTodayDow, validateRoutineDayDate } from '@/lib/utils/date'
import { formatExerciseCount } from '@/lib/utils/routine-format'
import { nextRotationDay, routineDayTitle } from '@/lib/utils/routine-schedule'

import { ExerciseCard } from './ExerciseCard'

interface RoutineDayAccordionProps {
	weightUnit: WeightUnit
	days: RoutineDay[]
	routine: {
		id: string
		scheduleMode: RoutineScheduleMode
		nextRotationDayId: string | null
	}
	activeSession?: { routineDayId: string } | null
	isStarting: boolean
	startActingDayId: string | null
	onStartWorkout: (dayId: string) => void
}

/**
 * The routine's days as one ruled list (§11.5), and the page's only way to
 * start one: each row carries its day's start control and opens onto its
 * exercises as ruled entries beneath it (TD-38). The Quick Start tiles that
 * started the same days a second time were removed (TD-41), so each row now
 * also says what only they did: how many exercises the day has, and why Start
 * is disabled on a day not scheduled for today.
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
	// ROUT-11: a rotation marks its next day the way a weekly routine marks today.
	const nextDayId = nextRotationDay({ ...routine, days })?.id

	return (
		// The item's own `border-b last:border-b-0` rules the rows. A `divide-y`
		// here drew nothing: the item's border utility outranks divide's
		// zero-specificity selector.
		<Accordion type="multiple" className="w-full border-y border-rule">
			{days.map(day => {
				const isToday = day.dayOfWeek === todayDow
				const isNext = day.id === nextDayId
				const hasActiveSession = activeSession?.routineDayId === day.id
				const isLoadingThisDay = isStarting && startActingDayId === day.id

				// Check if this day can be started today
				const dayValidation = validateRoutineDayDate(day)
				const canStartToday = dayValidation.isValid
				const isUnscheduled = !hasActiveSession && !canStartToday

				return (
					<AccordionItem
						key={day.id}
						value={day.id}
						className="border-rule-faint"
					>
						<div className="flex w-full items-center justify-between">
							<AccordionTrigger className="flex-1 py-4 hover:no-underline">
								{/* The trigger carries the panel rank; nothing here may
								    override its face or weight. Today is a glyph plus its
								    word, never colour alone (§4.3 rule 8). The caption is
								    body small inside a repeated row (§5.3). */}
								<span className="flex flex-col gap-0.5">
									<span className="flex items-center gap-2">
										{isToday && <Calendar className="h-4 w-4" aria-hidden />}
										{isNext && <Repeat className="h-4 w-4" aria-hidden />}
										{routineDayTitle(day)}
										{isToday && (
											<span className="type-body-sm text-ink-3">Today</span>
										)}
										{isNext && (
											<span className="type-body-sm text-ink-3">Next</span>
										)}
									</span>
									<span className="type-body-sm text-ink-3">
										{formatExerciseCount(day.exercises?.length ?? 0)}
										{isUnscheduled && ' · Not scheduled for today'}
									</span>
								</span>
							</AccordionTrigger>

							<div className="py-2 pl-4">
								<Button
									size="sm"
									variant={hasActiveSession ? 'default' : 'outline'}
									disabled={isLoadingThisDay || isUnscheduled}
									onClick={() => onStartWorkout(day.id)}
								>
									{isLoadingThisDay ? (
										<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
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
							{day.exercises && day.exercises.length > 0 ? (
								<div className="divide-y divide-rule-faint border-t border-rule-faint">
									{day.exercises.map(exercise => (
										<ExerciseCard
											key={exercise.id}
											exercise={exercise}
											routineId={routine.id}
											weightUnit={weightUnit}
										/>
									))}
								</div>
							) : (
								<p className="type-body-sm text-ink-3">
									No exercises configured for this day.
								</p>
							)}
						</AccordionContent>
					</AccordionItem>
				)
			})}
		</Accordion>
	)
}
