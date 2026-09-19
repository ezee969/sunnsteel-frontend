import type {
	RoutineDiscoveryQuery,
	RoutineDiscoveryResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** ROUT-07: the browse read. Every filter is optional. */
export const routineDiscoveryService = {
	discover: (query: RoutineDiscoveryQuery): Promise<RoutineDiscoveryResponse> =>
		httpClient.get<RoutineDiscoveryResponse>(
			`/routines/discover${buildDiscoveryParams(query)}`,
			true,
		),
}

/** Repeated `equipment` params, and nothing for a filter left unset. */
export function buildDiscoveryParams(query: RoutineDiscoveryQuery): string {
	const params = new URLSearchParams()
	if (query.q?.trim()) params.set('q', query.q.trim())
	if (query.goal) params.set('goal', query.goal)
	if (query.experienceLevel) {
		params.set('experienceLevel', query.experienceLevel)
	}
	if (typeof query.days === 'number') params.set('days', String(query.days))
	if (query.muscle) params.set('muscle', query.muscle)
	for (const item of query.equipment ?? []) params.append('equipment', item)
	if (query.duration) params.set('duration', query.duration)
	if (typeof query.limit === 'number') params.set('limit', String(query.limit))
	if (query.cursor) params.set('cursor', query.cursor)
	const serialized = params.toString()
	return serialized ? `?${serialized}` : ''
}
