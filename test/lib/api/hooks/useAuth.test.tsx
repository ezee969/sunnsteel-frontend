import { renderHook } from '@testing-library/react';
import { useLogin } from '@/lib/api/hooks/useLogin';
import { createQueryWrapper } from '@/test/utils';
import { vi } from 'vitest';

// Mock the auth service
vi.mock('@/lib/api/services/authService', () => ({
  authService: {
    login: vi.fn(),
  }
}));

describe('useLogin', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });
});
