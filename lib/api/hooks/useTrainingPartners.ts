'use client'

import type {
	SendTrainingPartnerEncouragementResponse,
	TrainingPartnerEncouragementKind,
	TrainingPartnerPermissions,
	TrainingPartnerScheduleResponse,
	TrainingPartnership,
	TrainingPartnershipsResponse,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import { notificationKeys } from './useNotifications'

export const trainingPartnerKeys = {
	all: ['users', 'me', 'training-partners'] as const,
	schedule: (partnershipId: string) =>
		['users', 'me', 'training-partners', partnershipId, 'schedule'] as const,
}

export function useTrainingPartners(enabled = true) {
	const { session } = useSupabaseAuth()
	return useQuery<TrainingPartnershipsResponse>({
		queryKey: trainingPartnerKeys.all,
		queryFn: userService.getTrainingPartners,
		enabled: enabled && !!session,
	})
}

function useTrainingPartnerMutation<TVariables>(
	run: (variables: TVariables) => Promise<TrainingPartnership>,
) {
	const queryClient = useQueryClient()
	return useMutation<TrainingPartnership, Error, TVariables>({
		mutationFn: run,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: trainingPartnerKeys.all }),
				queryClient.invalidateQueries({ queryKey: ['users'] }),
				queryClient.invalidateQueries({ queryKey: ['routines'] }),
				queryClient.invalidateQueries({ queryKey: ['activity'] }),
			])
		},
	})
}

export function useRequestTrainingPartner() {
	return useTrainingPartnerMutation(userService.requestTrainingPartner)
}

export function useAcceptTrainingPartner() {
	return useTrainingPartnerMutation(userService.acceptTrainingPartner)
}

export function useRemoveTrainingPartner() {
	const queryClient = useQueryClient()
	return useMutation<TrainingPartnershipsResponse, Error, string>({
		mutationFn: userService.removeTrainingPartner,
		onSuccess: async response => {
			queryClient.setQueryData(trainingPartnerKeys.all, response)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['users'] }),
				queryClient.invalidateQueries({ queryKey: ['routines'] }),
				queryClient.invalidateQueries({ queryKey: ['activity'] }),
			])
		},
	})
}

export function useUpdateTrainingPartnerPermissions() {
	return useTrainingPartnerMutation(
		({
			partnershipId,
			permissions,
		}: {
			partnershipId: string
			permissions: TrainingPartnerPermissions
		}) =>
			userService.updateTrainingPartnerPermissions(partnershipId, permissions),
	)
}

export function useTrainingPartnerSchedule(
	partnershipId: string,
	enabled = true,
) {
	const { session } = useSupabaseAuth()
	return useQuery<TrainingPartnerScheduleResponse>({
		queryKey: trainingPartnerKeys.schedule(partnershipId),
		queryFn: () => userService.getTrainingPartnerSchedule(partnershipId),
		enabled: enabled && !!session && !!partnershipId,
		retry: false,
	})
}

export function useSendTrainingPartnerEncouragement() {
	const queryClient = useQueryClient()
	return useMutation<
		SendTrainingPartnerEncouragementResponse,
		Error,
		{ partnershipId: string; kind: TrainingPartnerEncouragementKind }
	>({
		mutationFn: ({ partnershipId, kind }) =>
			userService.sendTrainingPartnerEncouragement(partnershipId, { kind }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
		},
	})
}
