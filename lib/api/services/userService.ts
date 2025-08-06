import { httpClient } from './httpClient';
import { User } from '../types/auth.type';

export const userService = {
  // Get current user profile
  async getProfile(): Promise<User> {
    return httpClient.get<User>('/users/profile', true);
  },
};
