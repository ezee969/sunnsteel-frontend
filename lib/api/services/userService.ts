import { httpClient } from './httpClient';
import { User } from '../types/auth.type';
import { UpdateProfileRequest } from '@sunsteel/contracts';

export interface UserSearchResponse {
  id: string
  email: string
  name: string
  lastName?: string | null
  avatarUrl?: string | null
}

export const userService = {
  // Get current user profile
  async getProfile(): Promise<User> {
    return httpClient.get<User>('/users/profile', true);
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return httpClient.patch<User>('/users/profile', data, true);
  },

  // Search users by name, email or username
  async searchUsers(query: string, limit: number = 5): Promise<UserSearchResponse[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    return httpClient.get<UserSearchResponse[]>(`/users/search?${params.toString()}`, true);
  }
};
