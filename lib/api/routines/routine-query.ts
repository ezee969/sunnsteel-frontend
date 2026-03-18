export type RoutineFilters = {
	isFavorite?: boolean
	isCompleted?: boolean
	include?: string[]
	week?: number
}

export type RoutineDetailOptions = Pick<RoutineFilters, 'include' | 'week'>

const NO_FILTERS_KEY = 'nofilters'

export function serializeRoutineFilters(filters?: RoutineFilters) {
	if (!filters) return NO_FILTERS_KEY

	const entries = Object.entries(filters).filter(([, value]) => value !== undefined)
	if (!entries.length) return NO_FILTERS_KEY

	entries.sort(([left], [right]) => left.localeCompare(right))

	return entries
		.map(([key, value]) => {
			if (Array.isArray(value)) {
				return `${key}:${[...value].sort().join(',')}`
			}
			return `${key}:${value}`
		})
		.join('|')
}

export function buildRoutineQueryParams(filters?: RoutineFilters | RoutineDetailOptions) {
	const params = new URLSearchParams()

	if (filters && 'isFavorite' in filters && typeof filters.isFavorite === 'boolean') {
		params.set('isFavorite', String(filters.isFavorite))
	}

	if (filters && 'isCompleted' in filters && typeof filters.isCompleted === 'boolean') {
		params.set('isCompleted', String(filters.isCompleted))
	}

	if (filters?.include?.length) {
		params.set('include', filters.include.join(','))
	}

	if (typeof filters?.week === 'number') {
		params.set('week', String(filters.week))
	}

	return params
}

export function buildRoutineQueryString(filters?: RoutineFilters | RoutineDetailOptions) {
	const params = buildRoutineQueryParams(filters)
	const query = params.toString()
	return query ? `?${query}` : ''
}

export const routineQueryKeys = {
	all: () => ['routines'] as const,
	list: (filters?: RoutineFilters) =>
		[...routineQueryKeys.all(), serializeRoutineFilters(filters)] as const,
	detail: (routineId: string) => [...routineQueryKeys.all(), routineId] as const,
	weekGoals: (routineId: string, week?: number) =>
		['routine', routineId, 'rtfGoals', week ?? 'current'] as const,
}
