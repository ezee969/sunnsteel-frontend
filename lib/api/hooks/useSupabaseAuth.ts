import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabaseAuthService,
  type AuthResponse,
} from '@/lib/api/services/supabaseAuthService';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for signing up with email and password
 * Redirects based on verification requirements.
 */
export const useSupabaseSignUp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      return await supabaseAuthService.signUp(email, password, name);
    },
    onSuccess: (data) => {
      if (data.requiresEmailVerification) {
        logger.debug('[auth] signup requires verification');
        router.push('/login?message=verify-email');
        return;
      }

      logger.debug('[auth] signup succeeded; redirecting to dashboard');
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    },
  });
};

/**
 * Hook for signing in with email and password
 */
export const useSupabaseSignIn = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
      redirectTo?: string;
    }) => {
      logger.debug('[auth] login mutation start');
      const result = await supabaseAuthService.signIn(email, password);
      logger.debug('[auth] login mutation success', { userId: result.user?.id });
      return result;
    },
    onSuccess: (data, variables) => {
      logger.debug('[auth] login onSuccess', { userId: data.user?.id });
      setTimeout(() => {
        const target = variables?.redirectTo || '/dashboard';
        router.push(target);
      }, 300);
    },
    onError: (error) => {
      logger.error('[auth] login onError', error);
    },
  });
};

/**
 * Hook for signing in with Google
 */
export const useSupabaseGoogleSignIn = () => {
  return useMutation({
    mutationFn: async (callbackUrl?: string) => {
      const result = await supabaseAuthService.signInWithGoogle(callbackUrl);
      window.location.href = result.url;
      return result;
    },
  });
};

/**
 * Hook for signing out
 */
export const useSupabaseSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await supabaseAuthService.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
};

/**
 * Hook for getting user profile
 */
export const useSupabaseProfile = () => {
  return useMutation({
    mutationFn: async (): Promise<AuthResponse> => {
      return await supabaseAuthService.getProfile();
    },
  });
};

/**
 * Hook for migrating existing users
 */
export const useSupabaseMigrateUser = () => {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await supabaseAuthService.migrateUser(email, password);
    },
  });
};
