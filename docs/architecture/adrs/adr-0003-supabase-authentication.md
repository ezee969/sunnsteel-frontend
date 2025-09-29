# ADR-0003: Supabase Authentication Integration

## Status
Accepted

## Context

The Sunsteel Frontend application requires a robust authentication system that can handle:

- User registration and login
- OAuth integration (Google, GitHub, etc.)
- Session management and token refresh
- Role-based access control
- Password reset and email verification
- Integration with the backend API
- Security best practices

The team needed to choose between building a custom authentication system, using a third-party service, or integrating with an existing backend authentication solution.

Key requirements:
- Secure authentication with industry standards
- OAuth provider integration
- Session management with automatic token refresh
- Easy integration with Next.js App Router
- TypeScript support
- Cost-effective solution
- Good developer experience
- Scalable for future growth

## Decision

We decided to adopt **Supabase Authentication** as the primary authentication provider for the Sunsteel Frontend application.

### Key Features Utilized:
- **Email/Password Authentication**: Traditional email and password login
- **OAuth Providers**: Google OAuth integration with extensibility for other providers
- **Session Management**: Automatic token refresh and session persistence
- **Row Level Security (RLS)**: Database-level security policies
- **Real-time Subscriptions**: Live updates for user data
- **Email Templates**: Customizable email templates for verification and password reset
- **TypeScript SDK**: Full TypeScript support with generated types

### Integration Architecture:
```
Frontend (Next.js) ←→ Supabase Auth ←→ Backend API
                   ↓
              Supabase Database
```

## Consequences

### Positive Consequences:

1. **Rapid Development**: Pre-built authentication flows reduce development time
2. **Security**: Industry-standard security practices built-in
3. **OAuth Integration**: Easy setup for Google and other OAuth providers
4. **Session Management**: Automatic token refresh and session persistence
5. **TypeScript Support**: Excellent TypeScript integration and type safety
6. **Real-time Features**: Built-in real-time subscriptions for user data
7. **Cost Effective**: Generous free tier and reasonable pricing
8. **Developer Experience**: Excellent documentation and developer tools
9. **Scalability**: Handles scaling automatically
10. **Compliance**: SOC 2 Type 2 certified with GDPR compliance

### Negative Consequences:

1. **Vendor Lock-in**: Dependency on Supabase infrastructure
2. **Limited Customization**: Some authentication flows are not fully customizable
3. **Network Dependency**: Requires internet connection for authentication
4. **Learning Curve**: Team needs to learn Supabase-specific patterns
5. **Third-party Risk**: Reliance on external service availability
6. **Data Location**: User data stored on Supabase servers

### Migration Considerations:
- Existing authentication logic needed to be replaced
- User data migration strategy required
- API integration patterns needed updating
- Session management patterns required changes

## Alternatives Considered

### 1. Custom Authentication with JWT
**Pros:**
- Full control over authentication logic
- No vendor lock-in
- Custom business logic integration
- Direct database control
- No external dependencies

**Cons:**
- Significant development time required
- Security implementation complexity
- OAuth integration complexity
- Session management complexity
- Maintenance overhead
- Potential security vulnerabilities

**Rejection Reason:** Building secure authentication from scratch requires significant time and expertise, with high risk of security vulnerabilities.

### 2. Auth0
**Pros:**
- Mature authentication platform
- Extensive OAuth provider support
- Advanced security features
- Good documentation
- Enterprise features

**Cons:**
- Higher cost for scaling
- Complex pricing model
- Vendor lock-in
- Over-engineered for simple use cases
- Less integration with database

**Rejection Reason:** Higher cost and complexity compared to Supabase, with features we don't currently need.

### 3. Firebase Authentication
**Pros:**
- Google-backed reliability
- Good OAuth integration
- Real-time features
- Mobile SDK support
- Generous free tier

**Cons:**
- Google ecosystem lock-in
- Limited customization options
- Complex pricing at scale
- Less database integration
- Vendor-specific patterns

**Rejection Reason:** Supabase provides better database integration and more flexibility for our use case.

### 4. AWS Cognito
**Pros:**
- AWS ecosystem integration
- Scalable infrastructure
- Advanced security features
- Compliance certifications
- Pay-per-use pricing

**Cons:**
- Complex setup and configuration
- Steep learning curve
- AWS-specific patterns
- Limited developer experience
- Complex pricing model

**Rejection Reason:** Too complex for our current needs and requires significant AWS expertise.

## Implementation Details

### Supabase Client Configuration
```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './database.types'

export const supabase = createClientComponentClient<Database>()
```

### Authentication Provider
```typescript
// providers/supabase-auth-provider.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        window.location.href = '/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within SupabaseAuthProvider')
  }
  return context
}
```

### Middleware for Route Protection
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect routes that require authentication
  if (req.nextUrl.pathname.startsWith('/dashboard') ||
      req.nextUrl.pathname.startsWith('/routines') ||
      req.nextUrl.pathname.startsWith('/workouts')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (req.nextUrl.pathname.startsWith('/login') ||
      req.nextUrl.pathname.startsWith('/signup')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### API Integration with Authentication
```typescript
// lib/api/http-client.ts
import { supabase } from '@/lib/supabase/client'

class HttpClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { secure?: boolean } = {}
  ): Promise<T> {
    const { secure, ...fetchOptions } = options

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    }

    // Add authentication header for secure requests
    if (secure) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers
    })

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        await supabase.auth.signOut()
        window.location.href = '/login'
        throw new Error('Authentication required')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  get<T>(endpoint: string, options?: RequestInit & { secure?: boolean }) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit & { secure?: boolean }) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const httpClient = new HttpClient(process.env.NEXT_PUBLIC_API_URL!)
```

### OAuth Callback Handler
```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### Login Component Example
```typescript
// app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { useAuth } from '@/providers/supabase-auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      toast.success('Logged in successfully')
    } catch (error) {
      toast.error('Failed to log in')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error('Failed to log in with Google')
      console.error('Google login error:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
      
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          className="w-full"
        >
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
```

## Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS on user data tables
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own routines
CREATE POLICY "Users can view own routines" ON routines
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own routines
CREATE POLICY "Users can insert own routines" ON routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Environment Configuration
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Session Security
- Automatic token refresh prevents session expiration
- Secure HTTP-only cookies for session storage
- CSRF protection through Supabase's built-in mechanisms
- Rate limiting on authentication endpoints

## Testing Strategy

### Authentication Testing
```typescript
// test/auth/auth.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SupabaseAuthProvider } from '@/providers/supabase-auth-provider'
import LoginPage from '@/app/(auth)/login/page'

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }
}))

describe('Authentication', () => {
  it('should handle email login', async () => {
    render(
      <SupabaseAuthProvider>
        <LoginPage />
      </SupabaseAuthProvider>
    )

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByText('Log In'))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})
```

## Performance Considerations

### Session Management
- Sessions are cached in memory for fast access
- Automatic token refresh prevents unnecessary re-authentication
- Minimal network requests for session validation

### Bundle Size Impact
- Supabase client adds ~15KB gzipped to the bundle
- Tree-shaking eliminates unused features
- Auth helpers are loaded only when needed

## References

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)

## Related ADRs

- [ADR-0001: Next.js App Router Architecture](./adr-0001-nextjs-app-router.md)
- [ADR-0002: State Management with React Query](./adr-0002-react-query-state-management.md)
- [ADR-0005: TypeScript Strict Configuration](./adr-0005-typescript-strict-config.md)