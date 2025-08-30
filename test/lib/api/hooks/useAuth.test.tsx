import { renderHook, waitFor } from '@testing-library/react';
import { useLogin } from '@/lib/api/hooks/useLogin';
import { useRegister } from '@/lib/api/hooks/useRegister';
import { useLogout } from '@/lib/api/hooks/useLogout';
import { createQueryWrapper } from '@/test/utils';
import * as authService from '@/lib/api/services/authService';
import { vi } from 'vitest';

// Mock the auth service
vi.mock('@/lib/api/services/authService');

const mockAuthService = authService as any;

describe('Auth Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLogin', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'mock-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      result.current.mutate(loginData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should show loading state during login', () => {
      const { result } = renderHook(() => useLogin(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useRegister', () => {
    it('should handle successful registration', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        accessToken: 'mock-token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useRegister(), {
        wrapper: createQueryWrapper(),
      });

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      result.current.mutate(registerData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should handle registration error', async () => {
      const mockError = new Error('Email already exists');
      mockAuthService.register.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRegister(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useLogout', () => {
    it('should handle successful logout', async () => {
      mockAuthService.logout.mockResolvedValue();

      const { result } = renderHook(() => useLogout(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle logout error', async () => {
      const mockError = new Error('Logout failed');
      mockAuthService.logout.mockRejectedValue(mockError);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createQueryWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});
