import {
	FeaturedProfileSelectionsResponse,
	FollowSuggestionsResponse,
	MeasurableGoal,
	PlateauPreferences,
	PublicUserProfile,
	RelationshipListKind,
	RelationshipListQuery,
	RelationshipListResponse,
	ReplaceFeaturedProfileItemsRequest,
	ReplaceMeasurableGoalsRequest,
	ReplaceTrainingLocationsRequest,
	SendTrainingPartnerEncouragementRequest,
	SendTrainingPartnerEncouragementResponse,
	TrainingLocationPreference,
	TrainingPartnerPermissions,
	TrainingPartnerScheduleResponse,
	TrainingPartnership,
	TrainingPartnershipsResponse,
	UpdateProfileDiscoveryRequest,
	UpdateProfilePrivacyRequest,
	UpdateProfileRequest,
	UserProfile,
	UserSearchResponse,
} from '@sunsteel/contracts'

import { getRelationshipListApiPath } from '@/lib/utils/relationships'

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

	async updateProfilePrivacy(
		data: UpdateProfilePrivacyRequest,
	): Promise<UserProfile> {
		return httpClient.request<UserProfile>('/users/profile/privacy', {
			method: 'PUT',
			body: JSON.stringify(data),
			secure: true,
		})
	},

	async updateProfileDiscovery(
		data: UpdateProfileDiscoveryRequest,
	): Promise<UserProfile> {
		return httpClient.request<UserProfile>('/users/profile/discovery', {
			method: 'PUT',
			body: JSON.stringify(data),
			secure: true,
		})
	},

	async getFeaturedProfileItems(): Promise<FeaturedProfileSelectionsResponse> {
		return httpClient.get<FeaturedProfileSelectionsResponse>(
			'/users/profile/featured',
			true,
		)
	},

	async replaceFeaturedProfileItems(
		data: ReplaceFeaturedProfileItemsRequest,
	): Promise<FeaturedProfileSelectionsResponse> {
		return httpClient.request<FeaturedProfileSelectionsResponse>(
			'/users/profile/featured',
			{
				method: 'PUT',
				body: JSON.stringify(data),
				secure: true,
			},
		)
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

	async getMeasurableGoals(): Promise<MeasurableGoal[]> {
		return httpClient.get<MeasurableGoal[]>('/users/preferences/goals', true)
	},

	async replaceMeasurableGoals(
		data: ReplaceMeasurableGoalsRequest,
	): Promise<MeasurableGoal[]> {
		return httpClient.request<MeasurableGoal[]>('/users/preferences/goals', {
			method: 'PUT',
			body: JSON.stringify(data),
			secure: true,
		})
	},

	async updatePlateauPreferences(
		data: PlateauPreferences,
	): Promise<PlateauPreferences> {
		return httpClient.request<PlateauPreferences>(
			'/users/preferences/plateaus',
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

	// Read the exact public view a signed-out recipient sees.
	async getSharedProfile(identifier: string): Promise<PublicUserProfile> {
		return httpClient.get<PublicUserProfile>(`/profiles/${identifier}`)
	},

	// One page of a member's followers, following or viewer-relative mutuals.
	async getRelationshipList(
		identifier: string,
		kind: RelationshipListKind,
		query: RelationshipListQuery = {},
	): Promise<RelationshipListResponse> {
		return httpClient.get<RelationshipListResponse>(
			getRelationshipListApiPath(identifier, kind, query),
			true,
		)
	},

	async getFollowSuggestions(
		limit?: number,
	): Promise<FollowSuggestionsResponse> {
		const search = limit === undefined ? '' : `?limit=${limit}`
		return httpClient.get<FollowSuggestionsResponse>(
			`/users/me/suggestions${search}`,
			true,
		)
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

	async getTrainingPartners(): Promise<TrainingPartnershipsResponse> {
		return httpClient.get<TrainingPartnershipsResponse>(
			'/users/me/training-partners',
			true,
		)
	},

	async requestTrainingPartner(
		identifier: string,
	): Promise<TrainingPartnership> {
		return httpClient.post<TrainingPartnership>(
			`/users/${identifier}/training-partner-request`,
			undefined,
			true,
		)
	},

	async acceptTrainingPartner(
		partnershipId: string,
	): Promise<TrainingPartnership> {
		return httpClient.post<TrainingPartnership>(
			`/users/me/training-partners/${partnershipId}/accept`,
			undefined,
			true,
		)
	},

	async removeTrainingPartner(
		partnershipId: string,
	): Promise<TrainingPartnershipsResponse> {
		return httpClient.delete<TrainingPartnershipsResponse>(
			`/users/me/training-partners/${partnershipId}`,
			true,
		)
	},

	async updateTrainingPartnerPermissions(
		partnershipId: string,
		permissions: TrainingPartnerPermissions,
	): Promise<TrainingPartnership> {
		return httpClient.request<TrainingPartnership>(
			`/users/me/training-partners/${partnershipId}/permissions`,
			{
				method: 'PUT',
				body: JSON.stringify(permissions),
				secure: true,
			},
		)
	},

	async getTrainingPartnerSchedule(
		partnershipId: string,
	): Promise<TrainingPartnerScheduleResponse> {
		return httpClient.get<TrainingPartnerScheduleResponse>(
			`/users/me/training-partners/${partnershipId}/schedule`,
			true,
		)
	},

	async sendTrainingPartnerEncouragement(
		partnershipId: string,
		data: SendTrainingPartnerEncouragementRequest,
	): Promise<SendTrainingPartnerEncouragementResponse> {
		return httpClient.post<SendTrainingPartnerEncouragementResponse>(
			`/users/me/training-partners/${partnershipId}/encouragements`,
			data,
			true,
		)
	},
}
