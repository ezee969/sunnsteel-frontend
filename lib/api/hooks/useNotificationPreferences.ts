'use client'

import type {
	NotificationPreferencesResponse,
	UpdateNotificationPreferencesRequest,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSupabaseAuth } from '@/providers/supabase-auth-provider'

import { pushService } from '../services/pushService'

export const notificationPreferenceKeys = {
	all: ['notifications', 'preferences'] as const,
}

/** NOTIF-05: the owner's switches, with whether anything can deliver them. */
export function useNotificationPreferences() {
	const { session, isLoading } = useSupabaseAuth()
	return useQuery<NotificationPreferencesResponse>({
		queryKey: notificationPreferenceKeys.all,
		queryFn: pushService.getPreferences,
		enabled: !isLoading && Boolean(session),
	})
}

/**
 * Writes are partial on purpose: a toggle sends only its own category, so two
 * controls changed in quick succession cannot overwrite each other with a
 * stale copy of the whole object.
 */
export function useUpdateNotificationPreferences() {
	const queryClient = useQueryClient()
	return useMutation<
		NotificationPreferencesResponse,
		Error,
		UpdateNotificationPreferencesRequest
	>({
		mutationFn: pushService.updatePreferences,
		onSuccess: response => {
			queryClient.setQueryData(notificationPreferenceKeys.all, response)
		},
	})
}
