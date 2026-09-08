import type {
	ReplaceTrainingLocationsRequest,
	TrainingLocationPreference,
} from '@sunsteel/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { userService } from '@/lib/api/services/userService'

const trainingLocationsKey = ['user', 'training-locations'] as const

export const useTrainingLocations = () =>
	useQuery<TrainingLocationPreference[], Error>({
		queryKey: trainingLocationsKey,
		queryFn: userService.getTrainingLocations,
	})

export const useReplaceTrainingLocations = () => {
	const queryClient = useQueryClient()

	return useMutation<
		TrainingLocationPreference[],
		Error,
		ReplaceTrainingLocationsRequest
	>({
		mutationFn: userService.replaceTrainingLocations,
		onSuccess: locations => {
			queryClient.setQueryData(trainingLocationsKey, locations)
		},
	})
}
