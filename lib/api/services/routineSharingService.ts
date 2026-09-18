import type {
	CloneRoutineRequest,
	MemberRoutinesResponse,
	Routine,
	RoutineShare,
	RoutineShareListResponse,
	RoutineVisibility,
	SharedRoutine,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** ROUT-04: the owner's controls, plus the two reads of a shared routine. */
export const routineSharingService = {
	setVisibility: (
		routineId: string,
		visibility: RoutineVisibility,
	): Promise<{ visibility: RoutineVisibility }> =>
		httpClient.request<{ visibility: RoutineVisibility }>(
			`/routines/${routineId}/visibility`,
			{ method: 'PUT', body: JSON.stringify({ visibility }), secure: true },
		),

	listShares: (routineId: string): Promise<RoutineShareListResponse> =>
		httpClient.get<RoutineShareListResponse>(
			`/routines/${routineId}/shares`,
			true,
		),

	createShare: (routineId: string): Promise<RoutineShare> =>
		httpClient.post<RoutineShare>(`/routines/${routineId}/shares`, {}, true),

	revokeShare: (
		routineId: string,
		shareId: string,
	): Promise<RoutineShareListResponse> =>
		httpClient.delete<RoutineShareListResponse>(
			`/routines/${routineId}/shares/${shareId}`,
			true,
		),

	/** Unauthenticated: the token is the only credential. */
	getSharedRoutine: (token: string): Promise<SharedRoutine> =>
		httpClient.get<SharedRoutine>(`/shared/routines/${token}`),

	getMemberRoutines: (identifier: string): Promise<MemberRoutinesResponse> =>
		httpClient.get<MemberRoutinesResponse>(
			`/users/${identifier}/routines`,
			true,
		),

	/** One of that member's routines, when this viewer is allowed to read it. */
	getMemberRoutine: (
		identifier: string,
		routineId: string,
	): Promise<SharedRoutine> =>
		httpClient.get<SharedRoutine>(
			`/users/${identifier}/routines/${routineId}`,
			true,
		),

	/** ROUT-05: a copy of a routine the viewer could read, owned by them. */
	cloneRoutine: (request: CloneRoutineRequest): Promise<Routine> =>
		httpClient.post<Routine>('/routines/clones', request, true),
}
