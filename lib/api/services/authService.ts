import { httpClient } from './httpClient';
import { tokenService } from './tokenService';
import {
  LoginCredentials,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  RegisterCredentials,
  RegisterResponse,
  GoogleLoginRequest,
} from '../types/auth.type';

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    tokenService.setAccessToken(response.accessToken);
    return response;
  },

  // Google Sign-In using ID token
  async googleLogin(payload: GoogleLoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/auth/google', payload);
    tokenService.setAccessToken(response.accessToken);
    return response;
  },

  // Register user
  async register(userData: RegisterCredentials): Promise<RegisterResponse> {
    const response = await httpClient.post<RegisterResponse>(
      '/auth/register',
      userData
    );
    tokenService.setAccessToken(response.accessToken);
    return response;
  },

  // Logout user
  async logout(): Promise<LogoutResponse> {
    const response = await httpClient.post<LogoutResponse>(
      '/auth/logout',
      undefined,
      true
    );
    tokenService.clearAccessToken();
    return response;
  },

  // Refresh token
  async refreshToken(): Promise<RefreshResponse> {
    try {
      const response = await httpClient.post<RefreshResponse>('/auth/refresh');
      if (response && response.accessToken) {
        tokenService.setAccessToken(response.accessToken);
      }
      return response;
    } catch (error) {
      tokenService.clearAccessToken();
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!tokenService.getAccessToken();
  },
};
