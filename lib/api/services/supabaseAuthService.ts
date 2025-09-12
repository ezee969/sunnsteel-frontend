import { supabase } from '@/lib/supabase/client';
import { httpClient } from './httpClient';

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

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    // Get the session token and verify with our backend
    const session = await supabase.auth.getSession();
    if (session.data.session) {
      return await this.verifyToken(session.data.session.access_token);
    }

    throw new Error('Failed to get session after signup');
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error('Failed to sign in');
    }

    // Verify token with our backend
    return await this.verifyToken(data.session.access_token);
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ url: string }> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
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
    const response = await httpClient.post('/auth/supabase/verify', { token });
    return response.data;
  }

  /**
   * Get user profile using Supabase token
   */
  async getProfile(): Promise<AuthResponse> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No session available');
    }

    // Set the token as Authorization header
    const response = await httpClient.get('/auth/supabase/profile', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    return response.data;
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
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Migrate existing user (for migration phase)
   */
  async migrateUser(email: string, password: string) {
    const response = await httpClient.post('/auth/supabase/migrate', {
      email,
      password,
    });
    return response.data;
  }
}

export const supabaseAuthService = new SupabaseAuthService();
