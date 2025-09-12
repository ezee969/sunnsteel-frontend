import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabaseAuthService,
  type AuthResponse,
} from '@/lib/api/services/supabaseAuthService';
import { useRouter } from 'next/navigation';

/**
 * Hook for signing up with email and password
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
    onSuccess: () => {
      router.push('/dashboard');
    },
  });
};

/**
 * Hook for signing in with email and password
 */
export const useSupabaseSignIn = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await supabaseAuthService.signIn(email, password);
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
  });
};

/**
 * Hook for signing in with Google
 */
export const useSupabaseGoogleSignIn = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await supabaseAuthService.signInWithGoogle();
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
