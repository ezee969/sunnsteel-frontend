import type { WorkoutSession, WorkoutSessionSummary } from '@sunsteel/contracts'

/**
 * DASH-02: the one action the dashboard puts first. Precedence is fixed:
 * an open session always wins (it is unfinished work), then a workout that
 * can be started today, then reviewing a workout already finished today,
 * then offering a day to train that today's plan did not call for (LIVE-06),
 * and only then browsing routines.
 */
export type DashboardPrimaryAction =
	| {
			kind: 'RESUME'
			sessionId: string
			routineDayId: string
			routineName?: string
			dayName?: string | null
	  }
	| { kind: 'START'; routineId: string; routineDayId: string }
	| {
			kind: 'REVIEW'
			sessionId: string
			routineName: string
			dayName?: string | null
	  }
	/**
	 * LIVE-06: nothing is planned, but the owner has a routine day with
	 * exercises in it. Offering one beats sending them to a list — the session
	 * it starts is an ordinary one, and the API never required a day to be
	 * scheduled today.
	 */
	| { kind: 'PICK_DAY' }
	| { kind: 'BROWSE' }

type DashboardEntry = {
	routine: { id: string }
	day: { id: string }
	canStartToday: boolean
}

type ActiveSession = Pick<
	WorkoutSession,
	'id' | 'status' | 'routineDayId' | 'routine' | 'routineDay'
>

type CompletedSession = Pick<WorkoutSessionSummary, 'id' | 'routine'>

export function resolveDashboardPrimaryAction({
	active,
	entries,
	completedToday,
	hasTrainableDay,
}: {
	active?: ActiveSession | null
	entries: DashboardEntry[]
	completedToday?: CompletedSession | null
	/**
	 * Whether any routine of the owner's has a day with exercises in it.
	 * Required rather than defaulted: adding it is what made the compiler name
	 * every caller that has to decide between offering a day and a routine list.
	 */
	hasTrainableDay: boolean
}): DashboardPrimaryAction {
	if (active?.id && active.status === 'IN_PROGRESS') {
		return {
			kind: 'RESUME',
			sessionId: active.id,
			routineDayId: active.routineDayId,
			routineName: active.routine?.name,
			dayName: active.routineDay?.name,
		}
	}

	const startable = entries.find(entry => entry.canStartToday)
	if (startable) {
		return {
			kind: 'START',
			routineId: startable.routine.id,
			routineDayId: startable.day.id,
		}
	}

	if (completedToday) {
		return {
			kind: 'REVIEW',
			sessionId: completedToday.id,
			routineName: completedToday.routine.name,
			dayName: completedToday.routine.dayName,
		}
	}

	return hasTrainableDay ? { kind: 'PICK_DAY' } : { kind: 'BROWSE' }
}

function describeWorkout(routineName?: string, dayName?: string | null) {
	if (!routineName) return null
	return dayName ? `${routineName} · ${dayName}` : routineName
}

export function getDashboardPrimaryCopy(
	action: DashboardPrimaryAction,
	{ plannedCount, todayName }: { plannedCount: number; todayName: string },
): { title: string; description: string } {
	switch (action.kind) {
		case 'RESUME': {
			const workout = describeWorkout(action.routineName, action.dayName)
			return {
				title: 'Workout in progress',
				description: workout
					? `${workout} is still open. Pick up where you left off.`
					: 'Pick up where you left off.',
			}
		}
		case 'START':
			return {
				title: 'Today’s Workouts',
				description:
					plannedCount === 1
						? 'You have 1 workout planned.'
						: `You have ${plannedCount} workouts planned.`,
			}
		case 'REVIEW':
			return {
				title: 'Today’s workout is done',
				description: `${describeWorkout(action.routineName, action.dayName)} is complete. Review how it went.`,
			}
		case 'PICK_DAY':
			return {
				title: 'No workouts scheduled today',
				description: `Nothing is planned for ${todayName}. You can still train any day of your routines — it counts the same.`,
			}
		case 'BROWSE':
			return {
				title: 'No workouts scheduled today',
				description: `You don’t have any routines planned for ${todayName}. Start one from your routines.`,
			}
	}
}
