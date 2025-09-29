# ADR-0001: Next.js App Router Architecture

## Status
Accepted

## Context

The Sunsteel Frontend application needed a modern, performant, and scalable architecture for building a fitness application. The team needed to choose between different React frameworks and routing approaches:

1. **Client-Side Routing**: Traditional SPA with React Router
2. **Next.js Pages Router**: Next.js with the traditional pages directory
3. **Next.js App Router**: Next.js with the new app directory and React Server Components

Key requirements:
- Server-side rendering for better SEO and initial load performance
- Type-safe routing with TypeScript
- Support for React Server Components
- Built-in optimization features
- Easy deployment and hosting options
- Strong ecosystem and community support

## Decision

We decided to adopt **Next.js 15 with App Router** as the core architecture for the Sunsteel Frontend application.

### Key Features Utilized:
- **App Router**: New file-system based routing with `app/` directory
- **React Server Components (RSC)**: Server-side rendering by default
- **Nested Layouts**: Shared UI components across route groups
- **Route Groups**: Organizing routes without affecting URL structure
- **Loading UI**: Built-in loading states and streaming
- **Error Handling**: Error boundaries and error pages
- **Metadata API**: SEO optimization with dynamic metadata

### Implementation Structure:
```
app/
├── layout.tsx                 # Root layout with providers
├── (auth)/                    # Authentication route group
│   ├── layout.tsx            # Auth-specific layout
│   ├── login/page.tsx        # Login page
│   └── signup/page.tsx       # Signup page
└── (protected)/              # Protected route group
    ├── layout.tsx            # Protected shell layout
    ├── dashboard/page.tsx    # Dashboard
    ├── routines/             # Routine management
    └── workouts/             # Workout sessions
```

## Consequences

### Positive Consequences:
1. **Performance**: Automatic code splitting, image optimization, and server-side rendering
2. **Developer Experience**: File-system based routing, TypeScript integration, hot reloading
3. **SEO**: Server-side rendering and metadata API for better search engine optimization
4. **Scalability**: React Server Components reduce client-side JavaScript bundle size
5. **Ecosystem**: Large community, extensive documentation, and third-party integrations
6. **Deployment**: Seamless deployment with Vercel and other platforms
7. **Future-Proof**: Aligned with React's future direction (Server Components)

### Negative Consequences:
1. **Learning Curve**: App Router is relatively new and requires learning new patterns
2. **Complexity**: Server/Client component boundaries require careful consideration
3. **Debugging**: Server-side rendering can make debugging more complex
4. **Bundle Size**: Next.js adds framework overhead compared to vanilla React
5. **Vendor Lock-in**: Some features are Next.js specific

### Migration Considerations:
- Team needed to learn App Router patterns and Server Components
- Existing components needed review for server/client compatibility
- State management patterns needed adjustment for SSR

## Alternatives Considered

### 1. React with Vite and React Router
**Pros:**
- Lightweight and fast development server
- Full control over build configuration
- Smaller bundle size
- Familiar client-side routing patterns

**Cons:**
- No built-in SSR support
- Manual optimization required
- More configuration needed
- SEO challenges for dynamic content

**Rejection Reason:** Lack of SSR support was a significant drawback for a fitness application that benefits from SEO and fast initial loads.

### 2. Next.js Pages Router
**Pros:**
- Mature and stable API
- Extensive documentation and examples
- Familiar patterns for existing Next.js developers
- Good TypeScript support

**Cons:**
- Older architecture pattern
- No React Server Components support
- Less efficient data fetching patterns
- Will eventually be deprecated

**Rejection Reason:** App Router represents the future of Next.js and React, providing better performance and developer experience.

### 3. Remix
**Pros:**
- Excellent data loading patterns
- Built-in form handling
- Progressive enhancement focus
- Good TypeScript support

**Cons:**
- Smaller ecosystem compared to Next.js
- Less mature tooling
- Different mental model from traditional React
- Fewer hosting options

**Rejection Reason:** While Remix has excellent patterns, Next.js provides a more familiar development experience and larger ecosystem.

## Implementation Details

### Route Organization
```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

// app/(protected)/layout.tsx - Protected shell
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

### Server Component Pattern
```typescript
// Server Component (default)
export default async function RoutinesPage() {
  // This runs on the server
  const routines = await getRoutines()
  
  return (
    <div>
      <h1>Routines</h1>
      <RoutinesList routines={routines} />
    </div>
  )
}

// Client Component (when needed)
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()
  // Client-side interactivity
  return <div>...</div>
}
```

### Data Fetching Strategy
```typescript
// Server-side data fetching
async function getRoutines(): Promise<Routine[]> {
  const response = await fetch(`${process.env.API_URL}/routines`, {
    headers: {
      'Authorization': `Bearer ${await getServerSession()}`
    }
  })
  return response.json()
}

// Client-side data fetching with React Query
'use client'
export function ClientDataComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: () => routineService.getUserRoutines()
  })
  
  if (isLoading) return <Loading />
  return <RoutinesList routines={data} />
}
```

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js 13 App Directory](https://beta.nextjs.org/docs/routing/fundamentals)
- [Server and Client Components](https://nextjs.org/docs/getting-started/react-essentials)

## Related ADRs

- [ADR-0002: State Management with React Query](./adr-0002-react-query-state-management.md)
- [ADR-0003: Supabase Authentication Integration](./adr-0003-supabase-authentication.md)