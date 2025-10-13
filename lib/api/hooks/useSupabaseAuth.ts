import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabaseAuthService,
  type AuthResponse,
} from '@/lib/api/services/supabaseAuthService';
import { useRouter } from 'next/navigation';

/**
 * Hook for signing up with email and password
 * Redirects to login page after successful signup with appropriate message
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
      // If email verification is required, redirect to login with message
      // Otherwise, user can proceed to dashboard immediately
      if (data.requiresEmailVerification) {
        console.log('📝 Email verification required, redirecting to login');
        router.push('/login?message=verify-email');
      } else {
        console.log('📝 Signup successful, redirecting to dashboard');
        // Small delay to ensure auth state updates
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      }
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
      console.log('🚀 Login hook: Starting sign in process...');
      const result = await supabaseAuthService.signIn(email, password);
      console.log('🚀 Login hook: Sign in successful, got result:', {
        userId: result.user?.id,
      });
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('🚀 Login hook: onSuccess called with:', {
        userId: data.user?.id,
      });
      // Add a small delay to ensure auth state updates before redirect
      setTimeout(() => {
        console.log('🚀 Login hook: Redirecting to dashboard...');
        const target = variables?.redirectTo || '/dashboard';
        router.push(target);
      }, 100);
    },
    onError: (error) => {
      console.error('🚀 Login hook: onError called:', error);
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
      // Redirect to Google OAuth
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
