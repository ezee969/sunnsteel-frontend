import {
	PublicUserProfile,
	ReplaceTrainingLocationsRequest,
	TrainingLocationPreference,
	UpdateProfileRequest,
	UserProfile,
	UserSearchResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

export type { UserSearchResponse } from '@sunsteel/contracts'

export const userService = {
	// Get current user profile
	async getProfile(): Promise<UserProfile> {
		return httpClient.get<UserProfile>('/users/profile', true)
	},

	// Update user profile
	async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
		return httpClient.patch<UserProfile>('/users/profile', data, true)
	},

	async getTrainingLocations(): Promise<TrainingLocationPreference[]> {
		return httpClient.get<TrainingLocationPreference[]>(
			'/users/training-locations',
			true,
		)
	},

	async replaceTrainingLocations(
		data: ReplaceTrainingLocationsRequest,
	): Promise<TrainingLocationPreference[]> {
		return httpClient.request<TrainingLocationPreference[]>(
			'/users/training-locations',
			{
				method: 'PUT',
				body: JSON.stringify(data),
				secure: true,
			},
		)
	},

	// Search users by name or username
	async searchUsers(
		query: string,
		limit: number = 5,
	): Promise<UserSearchResponse[]> {
		const params = new URLSearchParams({
			q: query,
			limit: limit.toString(),
		})
		return httpClient.get<UserSearchResponse[]>(
			`/users/search?${params.toString()}`,
			true,
		)
	},

	// Get public profile by username, retaining UUID compatibility for old links.
	async getPublicProfile(identifier: string): Promise<PublicUserProfile> {
		return httpClient.get<PublicUserProfile>(`/users/${identifier}`, true)
	},

	// Follow user
	async followUser(userId: string): Promise<PublicUserProfile> {
		return httpClient.post<PublicUserProfile>(
			`/users/${userId}/follow`,
			undefined,
			true,
		)
	},

	// Unfollow user
	async unfollowUser(userId: string): Promise<PublicUserProfile> {
		return httpClient.delete<PublicUserProfile>(`/users/${userId}/follow`, true)
	},
}
