import type { Routine } from '@/lib/api/types/routine.type'

const mockExerciseLibrary = [
	{
		name: 'Barbell Back Squat',
		progressionScheme: 'DOUBLE_PROGRESSION' as const,
		baseReps: 8,
		baseWeight: 80,
		minIncrement: 2.5,
	},
	{
		name: 'Romanian Deadlift',
		progressionScheme: 'DOUBLE_PROGRESSION' as const,
		baseReps: 10,
		baseWeight: 70,
		minIncrement: 2.5,
	},
	{
		name: 'Dumbbell Bench Press',
		progressionScheme: 'DYNAMIC_DOUBLE_PROGRESSION' as const,
		baseReps: 12,
		baseWeight: 24,
		minIncrement: 2,
	},
	{
		name: 'Seated Cable Row',
		progressionScheme: 'NONE' as const,
		baseReps: 15,
		baseWeight: 35,
		minIncrement: 1,
	},
	{
		name: 'Walking Lunges',
		progressionScheme: 'DOUBLE_PROGRESSION' as const,
		baseReps: 12,
		baseWeight: 18,
		minIncrement: 1,
	},
	{
		name: 'Overhead Press',
		progressionScheme: 'DOUBLE_PROGRESSION' as const,
		baseReps: 6,
		baseWeight: 45,
		minIncrement: 1,
	},
	{
		name: 'Lat Pulldown',
		progressionScheme: 'DYNAMIC_DOUBLE_PROGRESSION' as const,
		baseReps: 10,
		baseWeight: 50,
		minIncrement: 1,
	},
	{
		name: 'Bulgarian Split Squat',
		progressionScheme: 'DOUBLE_PROGRESSION' as const,
		baseReps: 10,
		baseWeight: 20,
		minIncrement: 1,
	},
] as const

const baseMockDate = new Date('2024-01-01T12:00:00.000Z').valueOf()

function createMockRoutine(index: number): Routine {
	const routineId = `mock-routine-${index + 1}`
	const createdAt = new Date(baseMockDate + index * 86400000).toISOString()
	const updatedAt = new Date(baseMockDate + index * 86400000).toISOString()
	const daysPerWeek = (index % 4) + 3

	const days = Array.from({ length: daysPerWeek }, (_, dayIndex) => {
		const dayOfWeek = (dayIndex + index) % 7
		const exercises = Array.from({ length: 2 }, (_, exerciseIndex) => {
			const libraryItem =
				mockExerciseLibrary[
					(dayIndex + exerciseIndex + index) % mockExerciseLibrary.length
				]
			const exerciseId = `${routineId}-day-${dayIndex + 1}-exercise-${
				exerciseIndex + 1
			}`

			return {
				id: exerciseId,
				order: exerciseIndex,
				restSeconds: 90,
				progressionScheme: libraryItem.progressionScheme,
				minWeightIncrement: libraryItem.minIncrement,
				exercise: {
					id: `exercise-${
						(dayIndex + exerciseIndex + index) % mockExerciseLibrary.length
					}`,
					name: libraryItem.name,
				},
				sets: [
					{
						setNumber: 1,
						repType: 'FIXED' as const,
						reps: libraryItem.baseReps,
						weight:
							libraryItem.baseWeight +
							exerciseIndex * libraryItem.minIncrement,
					},
					{
						setNumber: 2,
						repType: 'FIXED' as const,
						reps: libraryItem.baseReps,
						weight:
							libraryItem.baseWeight +
							(exerciseIndex + 1) * libraryItem.minIncrement,
					},
				],
			}
		})

		return {
			id: `${routineId}-day-${dayIndex + 1}`,
			dayOfWeek,
			order: dayIndex,
			exercises,
		}
	})

	const programEndDate =
		index % 3 === 0
			? new Date(baseMockDate + (index + 6) * 86400000).toISOString()
			: undefined

	return {
		id: routineId,
		userId: 'mock-user-id',
		name: `Classical Strength Block ${index + 1}`,
		description: `A balanced ${daysPerWeek}-day program focusing on strength and hypertrophy.`,
		isPeriodized: index % 2 === 0,
		programStyle: index % 2 === 0 ? 'STANDARD' : 'HYPERTROPHY',
		isFavorite: index % 3 === 0,
		isCompleted: index % 4 === 0,
		createdAt,
		updatedAt,
		programDurationWeeks: daysPerWeek,
		programEndDate,
		days,
	}
}

export const ROUTINE_MOCKS = Array.from({ length: 10 }, (_, index) =>
	createMockRoutine(index),
)

export const ROUTINE_MOCKS_ENABLED = false
