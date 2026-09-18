'use client'

import type {
	CloneRoutineRequest,
	MemberRoutinesResponse,
	Routine,
	RoutineShare,
	RoutineShareListResponse,
	RoutineVisibility,
	SharedRoutine,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { routineQueryKeys } from '@/lib/api/routines/routine-query'
import { routineSharingService } from '@/lib/api/services/routineSharingService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

export const routineSharingKeys = {
	shares: (routineId: string) => ['routine-shares', routineId] as const,
	shared: (token: string) => ['shared', 'routine', token] as const,
	member: (identifier: string) => ['users', identifier, 'routines'] as const,
	memberRoutine: (identifier: string, routineId: string) =>
		['users', identifier, 'routines', routineId] as const,
}

export function useRoutineShares(routineId: string, enabled = true) {
	const { session } = useSupabaseAuth()
	return useQuery<RoutineShareListResponse>({
		queryKey: routineSharingKeys.shares(routineId),
		queryFn: () => routineSharingService.listShares(routineId),
		enabled: enabled && !!session && !!routineId,
	})
}

export function useSetRoutineVisibility(routineId: string) {
	const queryClient = useQueryClient()
	return useMutation<
		{ visibility: RoutineVisibility },
		Error,
		RoutineVisibility
	>({
		mutationFn: visibility =>
			routineSharingService.setVisibility(routineId, visibility),
		// The routine detail carries the visibility, so it must not keep
		// showing the old one after a change.
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: routineQueryKeys.all() }),
	})
}

export function useCreateRoutineShare(routineId: string) {
	const queryClient = useQueryClient()
	return useMutation<RoutineShare, Error, void>({
		mutationFn: () => routineSharingService.createShare(routineId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: routineSharingKeys.shares(routineId),
			}),
	})
}

export function useRevokeRoutineShare(routineId: string) {
	const queryClient = useQueryClient()
	return useMutation<RoutineShareListResponse, Error, string>({
		mutationFn: shareId =>
			routineSharingService.revokeShare(routineId, shareId),
		onSuccess: response =>
			queryClient.setQueryData(routineSharingKeys.shares(routineId), response),
	})
}

/**
 * The public read. `staleTime: 0` for the same reason a shared session uses
 * it: a revoked link must stop working at once rather than serve from cache.
 */
export function useSharedRoutine(token: string) {
	return useQuery<SharedRoutine>({
		queryKey: routineSharingKeys.shared(token),
		queryFn: () => routineSharingService.getSharedRoutine(token),
		enabled: !!token,
		staleTime: 0,
		retry: false,
	})
}

export function useMemberRoutines(identifier: string, enabled = true) {
	const { session } = useSupabaseAuth()
	return useQuery<MemberRoutinesResponse>({
		queryKey: routineSharingKeys.member(identifier),
		queryFn: () => routineSharingService.getMemberRoutines(identifier),
		enabled: enabled && !!session && !!identifier,
	})
}

export function useMemberRoutine(identifier: string, routineId: string) {
	const { session } = useSupabaseAuth()
	return useQuery<SharedRoutine>({
		queryKey: routineSharingKeys.memberRoutine(identifier, routineId),
		queryFn: () =>
			routineSharingService.getMemberRoutine(identifier, routineId),
		enabled: !!session && !!identifier && !!routineId,
		// A routine narrowed since the profile was loaded must stop resolving,
		// exactly as a revoked link does.
		staleTime: 0,
		retry: false,
	})
}

/**
 * ROUT-05. The clone is the viewer's own routine, so the routines list has to
 * forget what it knew; the shared routine it came from is untouched and its
 * cache is deliberately left alone.
 */
export function useCloneRoutine() {
	const queryClient = useQueryClient()
	return useMutation<Routine, Error, CloneRoutineRequest>({
		mutationFn: request => routineSharingService.cloneRoutine(request),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: routineQueryKeys.all() }),
	})
}
