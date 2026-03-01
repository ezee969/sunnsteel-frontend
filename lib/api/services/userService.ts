import { httpClient } from './httpClient';
import {
  PublicUserProfile,
  UpdateProfileRequest,
  UserProfile,
  UserSearchResponse,
} from '@sunsteel/contracts';

export type { UserSearchResponse } from '@sunsteel/contracts';

export const userService = {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    return httpClient.get<UserProfile>('/users/profile', true);
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return httpClient.patch<UserProfile>('/users/profile', data, true);
  },

  // Search users by name, email or username
  async searchUsers(query: string, limit: number = 5): Promise<UserSearchResponse[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    return httpClient.get<UserSearchResponse[]>(`/users/search?${params.toString()}`, true);
  },

  // Get public profile by user id
  async getUserById(userId: string): Promise<PublicUserProfile> {
    return httpClient.get<PublicUserProfile>(`/users/${userId}`, true);
  },

  // Follow user
  async followUser(userId: string): Promise<PublicUserProfile> {
    return httpClient.post<PublicUserProfile>(`/users/${userId}/follow`, undefined, true);
  },

  // Unfollow user
  async unfollowUser(userId: string): Promise<PublicUserProfile> {
    return httpClient.delete<PublicUserProfile>(`/users/${userId}/follow`, true);
  },
};
