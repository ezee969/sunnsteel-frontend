# Development Guidelines

Brief development standards and best practices for the Sunsteel frontend.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Code Standards

### TypeScript
- Use strict mode
- Prefer interfaces over types for objects
- Export types with implementations
- Use proper generic constraints

```typescript
// Good
interface UserProps {
  name: string;
  email?: string;
}

export const User: React.FC<UserProps> = ({ name, email }) => {
  // Implementation
};
```

### React Patterns
- Functional components only
- Custom hooks for complex logic
- Proper prop typing
- Use React.memo for expensive components

```typescript
// Good
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  const processedData = useMemo(() => processData(data), [data]);
  return <div>{processedData}</div>;
});
```

### File Organization
```
components/
├── ui/           # Base components
├── backgrounds/  # CSS decorative components
├── icons/        # Icon system
└── layout/       # Layout components

features/
├── routines/     # Feature-specific components
└── shell/        # App shell components

hooks/            # Custom React hooks
lib/              # Utilities and services
```

## Testing Standards

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});
```

### Hook Testing
```typescript
import { renderHook } from '@testing-library/react';
import { useDebounce } from './use-debounce';

test('debounces value changes', () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 100),
    { initialProps: { value: 'initial' } }
  );
  expect(result.current).toBe('initial');
});
```

## Performance Guidelines

### Bundle Optimization
- Use dynamic imports for heavy components
- Implement proper code splitting
- Optimize images with Next.js Image
- Monitor bundle size

```typescript
// Good: Dynamic import
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

### React Query Patterns
```typescript
// Good: Proper caching and error handling
export const useRoutines = () => {
  return useQuery({
    queryKey: ['routines'],
    queryFn: routineService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};
```

## Git Workflow

### Commit Messages
```
feat: add routine creation wizard
fix: resolve authentication redirect loop
docs: update component documentation
refactor: simplify workout completion logic
```

### Branch Naming
- `feature/routine-wizard`
- `fix/auth-redirect`
- `docs/component-updates`

## Environment Setup

### Required Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Vitest**: Testing framework

## Common Patterns

### Error Handling
```typescript
// Component error boundary
function ComponentWithError() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });

  if (error) return <ErrorMessage error={error} />;
  if (isLoading) return <LoadingSpinner />;
  
  return <DataDisplay data={data} />;
}
```

### Form Handling
```typescript
// React Hook Form with Zod
const schema = z.object({
  name: z.string().min(1, 'Required'),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  
  return (
    <Form {...form}>
      <FormField name="name" render={({ field }) => (
        <Input {...field} />
      )} />
    </Form>
  );
}
```

### State Management
```typescript
// React Query for server state
const { data: routines } = useRoutines();

// Local state for UI
const [isOpen, setIsOpen] = useState(false);

// Context for global client state
const { user } = useAuth();
```

## Deployment

### Build Process
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test

# Production build
npm run build
```

### Environment Configuration
- Development: `.env.local`
- Staging: `.env.staging`
- Production: `.env.production`

## Troubleshooting

### Common Issues
- **Hydration mismatch**: Use `useEffect` for client-only code
- **Build errors**: Check TypeScript strict mode compliance
- **Performance**: Use React DevTools Profiler
- **Bundle size**: Analyze with `npm run analyze`

## Related Documentation
- [Components](../components/README.md)
- [Hooks](../hooks/README.md)
- [API](../api/README.md)