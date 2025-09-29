# Troubleshooting Guide

This guide helps you resolve common issues encountered while developing with the Sunsteel Frontend project.

## Table of Contents

- [Development Server Issues](#development-server-issues)
- [Build and Compilation Errors](#build-and-compilation-errors)
- [Authentication Problems](#authentication-problems)
- [API and Network Issues](#api-and-network-issues)
- [Environment Configuration](#environment-configuration)
- [TypeScript Errors](#typescript-errors)
- [Styling and UI Issues](#styling-and-ui-issues)
- [Testing Problems](#testing-problems)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

## Development Server Issues

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:

```bash
# Option 1: Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Option 2: Use a different port
npm run dev -- -p 3001

# Option 3: Use kill-port utility
npx kill-port 3000
```

### Server Won't Start

**Problem**: Development server fails to start

**Diagnostic Steps**:

1. Check Node.js version:
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

2. Clear cache and reinstall:
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   ```

3. Check for syntax errors:
   ```bash
   npm run type-check
   npm run lint
   ```

### Hot Reload Not Working

**Problem**: Changes not reflecting in browser

**Solutions**:

1. Check file watching limits (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. Restart development server:
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

3. Clear browser cache and hard refresh (Ctrl+Shift+R)

4. Check for file path issues:
   - Ensure proper case sensitivity
   - Verify import paths are correct

## Build and Compilation Errors

### Next.js Build Failures

**Problem**: `npm run build` fails

**Common Causes and Solutions**:

1. **TypeScript Errors**:
   ```bash
   # Check for type errors
   npx tsc --noEmit
   
   # Fix common issues
   # - Missing type definitions
   # - Incorrect prop types
   # - Unused variables
   ```

2. **ESLint Errors**:
   ```bash
   # Check linting issues
   npm run lint
   
   # Auto-fix where possible
   npm run lint -- --fix
   ```

3. **Memory Issues**:
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

### Import/Export Errors

**Problem**: Module resolution failures

**Solutions**:

1. Check import paths:
   ```typescript
   // ✅ Correct - using alias
   import { Button } from '@/components/ui/button'
   
   // ❌ Incorrect - wrong path
   import { Button } from '../../../components/ui/button'
   ```

2. Verify barrel exports:
   ```typescript
   // components/ui/index.ts
   export { Button } from './button'
   export { Input } from './input'
   ```

3. Check TypeScript configuration:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

## Authentication Problems

### Supabase Connection Issues

**Problem**: Authentication not working

**Diagnostic Steps**:

1. Verify environment variables:
   ```bash
   # Check .env.local file
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Test Supabase connection:
   ```typescript
   // Test in browser console
   import { supabase } from '@/lib/supabase/client'
   
   supabase.auth.getSession().then(console.log)
   ```

3. Check Supabase project status:
   - Visit your Supabase dashboard
   - Ensure project is active
   - Verify authentication providers are configured

### Session Management Issues

**Problem**: User sessions not persisting

**Solutions**:

1. Check cookie configuration:
   ```typescript
   // Verify secure cookie settings
   // Check browser developer tools → Application → Cookies
   ```

2. Clear browser storage:
   ```javascript
   // In browser console
   localStorage.clear()
   sessionStorage.clear()
   ```

3. Verify middleware configuration:
   ```typescript
   // middleware.ts
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     ],
   }
   ```

### OAuth Provider Issues

**Problem**: Google OAuth not working

**Solutions**:

1. Verify OAuth configuration in Supabase:
   - Check redirect URLs
   - Verify client ID and secret
   - Ensure provider is enabled

2. Check environment variables:
   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

3. Test OAuth flow:
   - Check browser network tab for errors
   - Verify redirect URLs match exactly

## API and Network Issues

### API Request Failures

**Problem**: API calls returning errors

**Diagnostic Steps**:

1. Check network tab in browser developer tools
2. Verify API endpoint URLs
3. Check authentication headers
4. Test API endpoints directly (Postman/curl)

**Common Solutions**:

```typescript
// Check httpClient configuration
import { httpClient } from '@/lib/api/http-client'

// Verify base URL
console.log(process.env.NEXT_PUBLIC_API_URL)

// Check authentication
const response = await httpClient.get('/test', { secure: true })
```

### CORS Issues

**Problem**: Cross-origin request blocked

**Solutions**:

1. Configure API server CORS:
   ```javascript
   // Backend configuration
   app.use(cors({
     origin: ['http://localhost:3000', 'https://your-domain.com'],
     credentials: true
   }))
   ```

2. Check environment URLs:
   ```bash
   # Ensure URLs match exactly
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### React Query Issues

**Problem**: Queries not working correctly

**Solutions**:

1. Check query keys:
   ```typescript
   // Ensure consistent query keys
   const { data } = useQuery({
     queryKey: ['routines', filters],
     queryFn: () => routineService.getUserRoutines(filters)
   })
   ```

2. Verify query client setup:
   ```typescript
   // providers/query-provider.tsx
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000,
         retry: 3
       }
     }
   })
   ```

## Environment Configuration

### Environment Variables Not Loading

**Problem**: Environment variables undefined

**Solutions**:

1. Check file location:
   ```bash
   # .env.local should be in project root
   ls -la .env.local
   ```

2. Verify variable names:
   ```bash
   # Client-side variables must start with NEXT_PUBLIC_
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   
   # Server-side variables don't need prefix
   DATABASE_URL=postgresql://...
   ```

3. Restart development server:
   ```bash
   # Environment changes require restart
   npm run dev
   ```

### Environment Validation Errors

**Problem**: Invalid environment configuration

**Solutions**:

1. Check validation schema:
   ```typescript
   // schema/env.client.ts
   export const clientEnvSchema = z.object({
     NEXT_PUBLIC_API_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     // ...
   })
   ```

2. Validate manually:
   ```typescript
   import { clientEnvSchema } from '@/schema/env.client'
   
   try {
     clientEnvSchema.parse(process.env)
   } catch (error) {
     console.error('Environment validation failed:', error)
   }
   ```

## TypeScript Errors

### Type Definition Issues

**Problem**: TypeScript compilation errors

**Common Solutions**:

1. **Missing type definitions**:
   ```bash
   npm install @types/node @types/react @types/react-dom
   ```

2. **Incorrect prop types**:
   ```typescript
   // ✅ Correct
   interface ButtonProps {
     children: React.ReactNode
     onClick?: () => void
   }
   
   // ❌ Incorrect
   interface ButtonProps {
     children: string  // Too restrictive
     onClick: Function  // Too generic
   }
   ```

3. **Generic type issues**:
   ```typescript
   // ✅ Correct
   const useQuery = <T,>(key: string): T | undefined => {
     // implementation
   }
   
   // ❌ Incorrect
   const useQuery = (key: string): any => {
     // implementation
   }
   ```

### Module Resolution Errors

**Problem**: Cannot find module errors

**Solutions**:

1. Check path aliases:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"],
         "@/components/*": ["./components/*"],
         "@/lib/*": ["./lib/*"]
       }
     }
   }
   ```

2. Verify file extensions:
   ```typescript
   // ✅ Correct - no extension needed
   import { Button } from '@/components/ui/button'
   
   // ❌ Incorrect - don't include .tsx
   import { Button } from '@/components/ui/button.tsx'
   ```

## Styling and UI Issues

### TailwindCSS Not Working

**Problem**: Tailwind classes not applying

**Solutions**:

1. Check Tailwind configuration:
   ```javascript
   // tailwind.config.ts
   module.exports = {
     content: [
       './app/**/*.{js,ts,jsx,tsx}',
       './components/**/*.{js,ts,jsx,tsx}',
       './features/**/*.{js,ts,jsx,tsx}'
     ],
     // ...
   }
   ```

2. Verify CSS imports:
   ```css
   /* app/globals.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. Check for CSS conflicts:
   ```typescript
   // Use cn utility for conditional classes
   import { cn } from '@/lib/utils'
   
   const className = cn(
     'base-classes',
     condition && 'conditional-classes'
   )
   ```

### Shadcn/ui Component Issues

**Problem**: UI components not rendering correctly

**Solutions**:

1. Verify component installation:
   ```bash
   npx shadcn-ui@latest add button
   ```

2. Check component imports:
   ```typescript
   // ✅ Correct
   import { Button } from '@/components/ui/button'
   
   // ❌ Incorrect
   import { Button } from 'shadcn/ui'
   ```

3. Verify CSS variables:
   ```css
   /* app/globals.css */
   :root {
     --background: 0 0% 100%;
     --foreground: 222.2 84% 4.9%;
     /* ... */
   }
   ```

### Hydration Errors

**Problem**: Text content does not match server-rendered HTML

**Solutions**:

1. Avoid client-side only code in SSR:
   ```typescript
   // ✅ Correct
   const [mounted, setMounted] = useState(false)
   
   useEffect(() => {
     setMounted(true)
   }, [])
   
   if (!mounted) return null
   
   return <ClientOnlyComponent />
   ```

2. Use suppressHydrationWarning sparingly:
   ```typescript
   // Only for unavoidable cases
   <div suppressHydrationWarning>
     {new Date().toLocaleString()}
   </div>
   ```

## Testing Problems

### Test Setup Issues

**Problem**: Tests not running or failing

**Solutions**:

1. Check test configuration:
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       environment: 'jsdom',
       setupFiles: ['./test/setup.ts']
     }
   })
   ```

2. Verify test setup file:
   ```typescript
   // test/setup.ts
   import '@testing-library/jest-dom'
   import { vi } from 'vitest'
   
   // Mock Next.js router
   vi.mock('next/navigation', () => ({
     useRouter: () => ({
       push: vi.fn(),
       replace: vi.fn()
     })
   }))
   ```

### Component Testing Issues

**Problem**: Component tests failing

**Solutions**:

1. Wrap components with providers:
   ```typescript
   import { render } from '@/test/utils'
   
   // Custom render with providers
   const renderWithProviders = (ui: React.ReactElement) => {
     return render(ui, { wrapper: AllTheProviders })
   }
   ```

2. Mock external dependencies:
   ```typescript
   // Mock Supabase
   vi.mock('@/lib/supabase/client', () => ({
     supabase: {
       auth: {
         getSession: vi.fn().mockResolvedValue({ data: { session: null } })
       }
     }
   }))
   ```

## Performance Issues

### Slow Development Server

**Problem**: Development server is slow

**Solutions**:

1. Optimize imports:
   ```typescript
   // ✅ Correct - specific imports
   import { Button } from '@/components/ui/button'
   
   // ❌ Incorrect - barrel imports in development
   import { Button, Input, Card } from '@/components/ui'
   ```

2. Use dynamic imports:
   ```typescript
   // For heavy components
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />
   })
   ```

3. Check bundle analyzer:
   ```bash
   npm run analyze
   ```

### Memory Issues

**Problem**: High memory usage or crashes

**Solutions**:

1. Increase Node.js memory:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. Check for memory leaks:
   ```typescript
   // Cleanup event listeners
   useEffect(() => {
     const handler = () => {}
     window.addEventListener('resize', handler)
     
     return () => {
       window.removeEventListener('resize', handler)
     }
   }, [])
   ```

## Deployment Issues

### Build Failures in Production

**Problem**: Production build fails

**Solutions**:

1. Test build locally:
   ```bash
   npm run build
   npm start
   ```

2. Check environment variables:
   ```bash
   # Ensure all required variables are set
   # Use production values
   ```

3. Verify dependencies:
   ```bash
   # Check for dev dependencies in production
   npm ci --only=production
   ```

### Runtime Errors in Production

**Problem**: Application crashes in production

**Solutions**:

1. Enable error reporting:
   ```typescript
   // Add error boundary
   import { ErrorBoundary } from '@/components/error-boundary'
   
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

2. Check server logs:
   ```bash
   # Review deployment logs
   # Check for missing environment variables
   # Verify API connectivity
   ```

## Getting Help

### Debugging Tools

1. **React Developer Tools**: Browser extension for React debugging
2. **Next.js DevTools**: Built-in development tools
3. **Network Tab**: Monitor API requests and responses
4. **Console Logs**: Add strategic logging for debugging

### Logging and Monitoring

```typescript
// Add performance monitoring
import { performanceMonitor } from '@/lib/utils/performance-monitor'

// Log errors
console.error('Error details:', error)

// Monitor API calls
console.log('API Request:', { url, method, data })
```

### Community Resources

- **Documentation**: Check the [docs](../README.md) directory
- **GitHub Issues**: Search existing issues or create new ones
- **Discord/Slack**: Join the community for real-time help
- **Stack Overflow**: Tag questions with `sunsteel-frontend`

### Creating Bug Reports

When reporting issues, include:

1. **Environment details**:
   - Operating system
   - Node.js version
   - npm version
   - Browser version

2. **Steps to reproduce**:
   - Exact steps taken
   - Expected behavior
   - Actual behavior

3. **Error messages**:
   - Full error stack traces
   - Console logs
   - Network errors

4. **Code samples**:
   - Minimal reproducible example
   - Relevant configuration files

---

**Still having issues?** Don't hesitate to reach out to the development team or community for assistance. We're here to help! 🚀