import { supabase } from '@/lib/supabase/client';
import { httpClient } from './httpClient';
import type { Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    supabaseUserId?: string;
    weightUnit: string;
  };
  message?: string;
}

class SupabaseAuthService {
  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    console.log('📝 Attempting to sign up with:', { email, name });

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    console.log('📝 Supabase signUp response:', {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message,
    });

    if (error) {
      console.error('📝 Supabase signUp error:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      console.error('📝 No user returned from Supabase');
      throw new Error('Failed to create user');
    }

    console.log('📝 Getting session after signup...');
    // Get the session token and verify with our backend
    const session = await supabase.auth.getSession();
    console.log('📝 Session after signup:', { hasSession: !!session.data.session });

    if (session.data.session) {
      console.log('📝 Verifying token with backend...');
      const result = await this.verifyToken(session.data.session.access_token);
      console.log('📝 Backend verification successful:', {
        userId: result.user?.id,
      });
      return result;
    }

    throw new Error('Failed to get session after signup');
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 Attempting to sign in with:', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('🔐 Supabase signIn response:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message,
    });

    if (error) {
      console.error('🔐 Supabase signIn error:', error);
      throw new Error(error.message);
    }

    if (!data.session) {
      console.error('🔐 No session returned from Supabase');
      throw new Error('Failed to sign in');
    }

    console.log('🔐 Verifying token with backend...');
    // Verify token with our backend
    const result = await this.verifyToken(data.session.access_token);
    console.log('🔐 Backend verification successful:', { userId: result.user?.id });
    return result;
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(callbackUrl?: string): Promise<{ url: string }> {
    // Prefer explicit site URL from env (useful behind proxies), fallback to window.origin
    const siteUrl =
      (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const callbackPath = '/auth/callback';
    const redirectBase = `${siteUrl}${callbackPath}`;
    const redirectTo = callbackUrl
      ? `${redirectBase}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : redirectBase;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { url: data.url };
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    // Clear server-side session cookie
    try {
      await httpClient.post('/auth/supabase/logout');
    } catch (err) {
      // Don't fail the logout if backend call fails
      console.warn('Failed to clear server session:', err);
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  }

  /**
   * Verify Supabase token with our backend
   */
  async verifyToken(token: string): Promise<AuthResponse> {
    console.log('🔍 Verifying token with backend...', {
      tokenLength: token?.length,
    });
    try {
      const response = await httpClient.post<AuthResponse>('/auth/supabase/verify', {
        token,
      });
      console.log('🔍 Backend verification response:', {
        hasUser: !!response.user,
        userId: response.user?.id,
        userEmail: response.user?.email,
      });
      return response;
    } catch (error) {
      console.error('🔍 Backend verification failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile using Supabase token
   */
  async getProfile(): Promise<AuthResponse> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No session available');
    }

    // Use the request method directly to set custom headers
    const response = await httpClient.request<AuthResponse>(
      '/auth/supabase/profile',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    return response;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return !!session;
    } catch {
      return false;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Listen to auth changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Migrate existing user (for migration phase)
   */
  async migrateUser(email: string, password: string) {
    const response = await httpClient.post<AuthResponse>('/auth/supabase/migrate', {
      email,
      password,
    });
    return response;
  }
}

export const supabaseAuthService = new SupabaseAuthService();
