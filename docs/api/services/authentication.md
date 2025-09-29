# Authentication Service API

## Overview

The Authentication Service manages user authentication and session management in the Sunsteel fitness application through Supabase integration. This service provides secure authentication flows including email/password authentication, OAuth providers, session management, and user registration.

## Base Configuration

```typescript
// Supabase client configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

All authentication operations are handled through Supabase's built-in authentication system with automatic session management.

## Authentication Methods

### Email/Password Authentication

#### Sign Up with Email

Create a new user account with email and password.

```typescript
interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}
```

#### Example Request

```typescript
const { user, session, error } = await supabaseAuthService.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  firstName: 'John',
  lastName: 'Doe'
});
```

#### Sign In with Email

Authenticate an existing user with email and password.

```typescript
const { user, session, error } = await supabaseAuthService.signIn({
  email: 'user@example.com',
  password: 'securePassword123'
});
```

### OAuth Authentication

#### Google OAuth

Authenticate using Google OAuth provider.

```typescript
const { error } = await supabaseAuthService.signInWithGoogle({
  redirectTo: `${window.location.origin}/auth/callback`
});
```

#### GitHub OAuth

Authenticate using GitHub OAuth provider.

```typescript
const { error } = await supabaseAuthService.signInWithGitHub({
  redirectTo: `${window.location.origin}/auth/callback`
});
```

### Session Management

#### Get Current Session

Retrieve the current user session.

```typescript
const { data: session, error } = await supabase.auth.getSession();
```

#### Get Current User

Get the currently authenticated user.

```typescript
const { data: user, error } = await supabase.auth.getUser();
```

#### Sign Out

End the current user session.

```typescript
const { error } = await supabaseAuthService.signOut();
```

## Service Implementation

### Supabase Authentication Service

```typescript
import { createClient } from '@supabase/supabase-js';
import type { 
  User, 
  Session, 
  AuthError, 
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials 
} from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAuthService = {
  /**
   * Sign up a new user with email and password
   */
  async signUp(credentials: SignUpWithPasswordCredentials) {
    return await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          first_name: credentials.options?.data?.firstName,
          last_name: credentials.options?.data?.lastName,
        },
      },
    });
  },

  /**
   * Sign in an existing user with email and password
   */
  async signIn(credentials: SignInWithPasswordCredentials) {
    return await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(options?: { redirectTo?: string }) {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options?.redirectTo,
      },
    });
  },

  /**
   * Sign in with GitHub OAuth
   */
  async signInWithGitHub(options?: { redirectTo?: string }) {
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: options?.redirectTo,
      },
    });
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    return await supabase.auth.signOut();
  },

  /**
   * Get the current session
   */
  async getSession() {
    return await supabase.auth.getSession();
  },

  /**
   * Get the current user
   */
  async getUser() {
    return await supabase.auth.getUser();
  },

  /**
   * Reset password via email
   */
  async resetPassword(email: string, redirectTo?: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`,
    });
  },

  /**
   * Update user password
   */
  async updatePassword(password: string) {
    return await supabase.auth.updateUser({ password });
  },

  /**
   * Update user email
   */
  async updateEmail(email: string) {
    return await supabase.auth.updateUser({ email });
  },

  /**
   * Refresh the current session
   */
  async refreshSession() {
    return await supabase.auth.refreshSession();
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
```

## React Integration

### Authentication Provider

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseAuthService } from '@/lib/api/services/supabaseAuthService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabaseAuthService.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseAuthService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle different auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseAuthService.signIn({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabaseAuthService.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabaseAuthService.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabaseAuthService.signInWithGoogle({
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  };

  const signInWithGitHub = async () => {
    const { error } = await supabaseAuthService.signInWithGitHub({
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Authentication Hooks

```typescript
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook to require authentication
 */
export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
};

/**
 * Hook to redirect authenticated users
 */
export const useRedirectIfAuthenticated = (redirectTo = '/dashboard') => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
};

/**
 * Hook for authentication actions
 */
export const useAuthActions = () => {
  const { signIn, signUp, signOut, signInWithGoogle, signInWithGitHub } = useAuth();
  const router = useRouter();

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, metadata?: any) => {
    try {
      await signUp(email, password, metadata);
      // User will receive confirmation email
      router.push('/auth/check-email');
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect will be handled by OAuth flow
    } catch (error) {
      throw error;
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGitHub();
      // Redirect will be handled by OAuth flow
    } catch (error) {
      throw error;
    }
  };

  return {
    handleSignIn,
    handleSignUp,
    handleSignOut,
    handleGoogleSignIn,
    handleGitHubSignIn,
  };
};
```

## Route Protection

### Middleware Implementation

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/routines', '/workouts', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Auth routes (should redirect if authenticated)
  const authRoutes = ['/login', '/signup', '/auth'];
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if accessing auth routes with session
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Route Group Layouts

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRedirectIfAuthenticated();

  return (
    <div className="auth-layout">
      <div className="auth-container">
        {children}
      </div>
    </div>
  );
}

// app/(protected)/layout.tsx
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect via useRequireAuth
  }

  return (
    <div className="protected-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
```

## Form Components

### Login Form

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSignIn, handleGoogleSignIn, handleGitHubSignIn } = useAuthActions();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await handleSignIn(data.email, data.password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...form.register('password')}
            error={form.formState.errors.password?.message}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="oauth-section">
        <div className="divider">
          <span>Or continue with</span>
        </div>

        <div className="oauth-buttons">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon className="w-4 h-4 mr-2" />
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGitHubSignIn}
            disabled={isLoading}
          >
            <GitHubIcon className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Registration Form

```typescript
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleSignUp } = useAuthActions();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await handleSignUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...form.register('firstName')}
            error={form.formState.errors.firstName?.message}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...form.register('lastName')}
            error={form.formState.errors.lastName?.message}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...form.register('confirmPassword')}
          error={form.formState.errors.confirmPassword?.message}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="agreeToTerms"
          type="checkbox"
          {...form.register('agreeToTerms')}
        />
        <Label htmlFor="agreeToTerms" className="text-sm">
          I agree to the <a href="/terms" className="underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </Label>
      </div>
      {form.formState.errors.agreeToTerms && (
        <p className="text-sm text-red-500">
          {form.formState.errors.agreeToTerms.message}
        </p>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
```

## OAuth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to dashboard or original destination
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
```

## Error Handling

### Authentication Error Types

```typescript
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_NOT_CONFIRMED = 'email_not_confirmed',
  WEAK_PASSWORD = 'weak_password',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error.message?.toLowerCase() || '';

  if (errorMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (errorMessage.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  
  if (errorMessage.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  
  if (errorMessage.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (errorMessage.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};
```

### Error Boundary for Auth

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<
  { children: ReactNode },
  AuthErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Auth error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-error-boundary">
          <h2>Authentication Error</h2>
          <p>Something went wrong with authentication.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing

### Authentication Service Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseAuthService } from './supabaseAuthService';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  })),
}));

describe('supabaseAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sign up user successfully', async () => {
    const mockResponse = {
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
      error: null,
    };

    // Mock implementation would go here
    // vi.mocked(supabase.auth.signUp).mockResolvedValue(mockResponse);

    const result = await supabaseAuthService.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toBeDefined();
  });

  it('should handle sign in errors', async () => {
    const mockError = { message: 'Invalid credentials' };

    // Mock error response
    // vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
    //   user: null,
    //   session: null,
    //   error: mockError,
    // });

    const result = await supabaseAuthService.signIn({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(result.error).toBeDefined();
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/providers/AuthProvider';

describe('useAuth', () => {
  it('should provide authentication context', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider>{children}</AuthProvider>
      ),
    });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('session');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signOut');
  });
});
```

## Security Considerations

### Environment Variables

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional OAuth configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

### Row Level Security (RLS)

```sql
-- Example RLS policies for user data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own routines" ON routines
  FOR SELECT USING (auth.uid() = user_id);
```

### Session Security

- Sessions are automatically managed by Supabase
- Tokens are stored in secure HTTP-only cookies
- Automatic token refresh prevents session expiration
- CSRF protection is built-in

## Related Documentation

- [User Service](./users.md) - For user profile management
- [Middleware](../../middleware/auth-middleware.md) - Route protection
- [Environment Configuration](../../deployment/environment-setup.md) - Environment variables
- [Security Guidelines](../../security/authentication-security.md) - Security best practices
- [Supabase Integration](../../integrations/supabase-setup.md) - Supabase configuration

---

*For implementation details and advanced usage patterns, refer to the source code in `lib/api/services/supabaseAuthService.ts` and `providers/AuthProvider.tsx`.*