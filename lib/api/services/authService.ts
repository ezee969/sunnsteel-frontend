import { httpClient, setClientSessionCookie } from './httpClient';
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
    console.debug('[auth] login → start');
    const response = await httpClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    tokenService.setAccessToken(response.accessToken);
    setClientSessionCookie();
    console.debug(
      '[auth] login ← success; has accessToken:',
      Boolean(response.accessToken)
    );
    return response;
  },

  // Google Sign-In using ID token
  async googleLogin(payload: GoogleLoginRequest): Promise<LoginResponse> {
    console.debug('[auth] googleLogin → start');
    const response = await httpClient.post<LoginResponse>('/auth/google', payload);
    tokenService.setAccessToken(response.accessToken);
    setClientSessionCookie();
    console.debug(
      '[auth] googleLogin ← success; has accessToken:',
      Boolean(response.accessToken)
    );
    return response;
  },

  // Register user
  async register(userData: RegisterCredentials): Promise<RegisterResponse> {
    console.debug('[auth] register → start');
    const response = await httpClient.post<RegisterResponse>(
      '/auth/register',
      userData
    );
    tokenService.setAccessToken(response.accessToken);
    setClientSessionCookie();
    console.debug(
      '[auth] register ← success; has accessToken:',
      Boolean(response.accessToken)
    );
    return response;
  },

  // Logout user
  async logout(): Promise<LogoutResponse> {
    console.debug('[auth] logout → start');
    const response = await httpClient.post<LogoutResponse>(
      '/auth/logout',
      undefined,
      true
    );
    tokenService.clearAccessToken();
    console.debug('[auth] logout ← success');
    return response;
  },

  // Refresh token
  async refreshToken(): Promise<RefreshResponse> {
    console.debug('[auth] refresh → start');
    try {
      const response = await httpClient.post<RefreshResponse>('/auth/refresh');
      if (response && response.accessToken) {
        tokenService.setAccessToken(response.accessToken);
        setClientSessionCookie();
        console.debug('[auth] refresh ← success; accessToken set');
      } else {
        console.debug('[auth] refresh ← success; no accessToken in response');
      }
      return response;
    } catch (error) {
      console.debug('[auth] refresh ← failed');
      tokenService.clearAccessToken();
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!tokenService.getAccessToken();
  },
};
