import type {
	BodyMeasurement,
	BodyProgressRange,
	BodyProgressResponse,
	UpsertBodyMeasurementRequest,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { bodyMeasurementService } from '@/lib/api/services/bodyMeasurementService'

export const bodyProgressKey = ['body-progress'] as const

/** Whose body progress a read is for: the owner, a member signed in, or signed out. */
export type BodyProgressSource =
	| { kind: 'own' }
	| { kind: 'member'; identifier: string }
	| { kind: 'public'; identifier: string }

export const useBodyProgress = (
	source: BodyProgressSource,
	range: BodyProgressRange,
	enabled = true,
) =>
	useQuery<BodyProgressResponse, Error>({
		queryKey:
			source.kind === 'own'
				? [...bodyProgressKey, 'own', range]
				: [...bodyProgressKey, source.kind, source.identifier, range],
		queryFn: () =>
			source.kind === 'own'
				? bodyMeasurementService.getOwn(range)
				: source.kind === 'member'
					? bodyMeasurementService.getMember(source.identifier, range)
					: bodyMeasurementService.getPublic(source.identifier, range),
		enabled,
	})

/**
 * Saving or deleting an entry can move the account's current weight, which
 * the profile, Settings and the body-weight goal read, so those refresh too.
 */
function useInvalidateBodyProgress() {
	const queryClient = useQueryClient()
	return () => {
		void queryClient.invalidateQueries({ queryKey: bodyProgressKey })
		void queryClient.invalidateQueries({ queryKey: ['user'], exact: true })
		void queryClient.invalidateQueries({
			queryKey: ['workout', 'progress', 'goals'],
		})
	}
}

export const useUpsertBodyMeasurement = () => {
	const invalidate = useInvalidateBodyProgress()
	return useMutation<
		BodyMeasurement,
		Error,
		{ date: string; data: UpsertBodyMeasurementRequest }
	>({
		mutationFn: ({ date, data }) => bodyMeasurementService.upsert(date, data),
		onSuccess: invalidate,
	})
}

export const useDeleteBodyMeasurement = () => {
	const invalidate = useInvalidateBodyProgress()
	return useMutation<void, Error, string>({
		mutationFn: date => bodyMeasurementService.remove(date),
		onSuccess: invalidate,
	})
}
