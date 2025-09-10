import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

export function useAuthProtection() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isLoading = authLoading;

  // Redirect if not authenticated
  useEffect(() => {
    // Only redirect after refresh attempt finished
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}
