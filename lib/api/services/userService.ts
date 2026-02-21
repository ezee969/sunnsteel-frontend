import { httpClient } from './httpClient';
import { User } from '../types/auth.type';
import { UpdateProfileRequest } from '@sunsteel/contracts';

export const userService = {
  // Get current user profile
  async getProfile(): Promise<User> {
    return httpClient.get<User>('/users/profile', true);
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return httpClient.patch<User>('/users/profile', data, true);
  },
};
