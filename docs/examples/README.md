# Examples & Tutorials

Practical examples for common development tasks in the Sunsteel frontend.

## Component Examples

### Creating a New Feature Component

```typescript
// features/workouts/components/WorkoutCard.tsx
import { Card } from '@/components/ui/card';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import { cn } from '@/lib/utils';

interface WorkoutCardProps {
  workout: Workout;
  onStart: (id: string) => void;
  className?: string;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onStart,
  className,
}) => {
  return (
    <Card className={cn('p-6 hover:shadow-lg transition-shadow', className)}>
      <div className="flex items-center gap-3 mb-4">
        <ClassicalIcon name="dumbbell" className="w-6 h-6 text-gold" />
        <h3 className="text-lg font-semibold">{workout.name}</h3>
      </div>
      
      <p className="text-muted-foreground mb-4">{workout.description}</p>
      
      <Button onClick={() => onStart(workout.id)} className="w-full">
        Start Workout
      </Button>
    </Card>
  );
};
```

### Using Background Components

```typescript
// app/(protected)/workouts/page.tsx
import { HeroSection } from '@/components/layout/HeroSection';
import { ParchmentOverlay } from '@/components/backgrounds/ParchmentOverlay';

export default function WorkoutsPage() {
  return (
    <>
      <HeroSection
        imageSrc="/images/gym-hero.jpg"
        title="Your Workouts"
        subtitle="Track your progress and build strength"
      />
      
      <section className="relative py-12">
        <ParchmentOverlay opacity={0.1} />
        <div className="container mx-auto px-4">
          {/* Content */}
        </div>
      </section>
    </>
  );
}
```

## Hook Examples

### Custom Data Hook

```typescript
// hooks/useWorkouts.ts
import { useQuery } from '@tanstack/react-query';
import { workoutService } from '@/lib/api/services/workout.service';

export const useWorkouts = (filters?: WorkoutFilters) => {
  return useQuery({
    queryKey: ['workouts', filters],
    queryFn: () => workoutService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

// Usage in component
function WorkoutsList() {
  const { data: workouts, isLoading, error } = useWorkouts();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="grid gap-4">
      {workouts?.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

### Form with Validation

```typescript
// components/forms/CreateWorkoutForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  exercises: z.array(z.string()).min(1, 'At least one exercise required'),
});

type FormData = z.infer<typeof schema>;

export function CreateWorkoutForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      exercises: [],
    },
  });

  const onSubmit = (data: FormData) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter workout name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          Create Workout
        </Button>
      </form>
    </Form>
  );
}
```

## API Integration

### Service Layer

```typescript
// lib/api/services/workout.service.ts
import { httpClient } from '../http-client';
import type { Workout, CreateWorkoutData } from '../types/workout.type';

export const workoutService = {
  async getAll(filters?: WorkoutFilters): Promise<Workout[]> {
    return httpClient.get('/workouts', { 
      params: filters,
      secure: true 
    });
  },

  async create(data: CreateWorkoutData): Promise<Workout> {
    return httpClient.post('/workouts', data, { secure: true });
  },

  async update(id: string, data: Partial<Workout>): Promise<Workout> {
    return httpClient.patch(`/workouts/${id}`, data, { secure: true });
  },

  async delete(id: string): Promise<void> {
    return httpClient.delete(`/workouts/${id}`, { secure: true });
  },
};
```

### Mutation Hook

```typescript
// hooks/useCreateWorkout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutService } from '@/lib/api/services/workout.service';
import { toast } from 'sonner';

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workoutService.create,
    onSuccess: (newWorkout) => {
      // Invalidate and refetch workouts
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      
      // Optimistically update cache
      queryClient.setQueryData(['workouts'], (old: Workout[] = []) => [
        ...old,
        newWorkout,
      ]);
      
      toast.success('Workout created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create workout');
      console.error('Create workout error:', error);
    },
  });
};
```

## Testing Examples

### Component Test

```typescript
// __tests__/components/WorkoutCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard';

const mockWorkout = {
  id: '1',
  name: 'Push Day',
  description: 'Chest, shoulders, and triceps',
  exercises: ['bench-press', 'shoulder-press'],
};

describe('WorkoutCard', () => {
  it('renders workout information', () => {
    const onStart = vi.fn();
    
    render(<WorkoutCard workout={mockWorkout} onStart={onStart} />);
    
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Chest, shoulders, and triceps')).toBeInTheDocument();
  });

  it('calls onStart when button is clicked', () => {
    const onStart = vi.fn();
    
    render(<WorkoutCard workout={mockWorkout} onStart={onStart} />);
    
    fireEvent.click(screen.getByText('Start Workout'));
    expect(onStart).toHaveBeenCalledWith('1');
  });
});
```

### Hook Test

```typescript
// __tests__/hooks/useWorkouts.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkouts } from '@/hooks/useWorkouts';
import { workoutService } from '@/lib/api/services/workout.service';

vi.mock('@/lib/api/services/workout.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useWorkouts', () => {
  it('fetches workouts successfully', async () => {
    const mockWorkouts = [mockWorkout];
    vi.mocked(workoutService.getAll).mockResolvedValue(mockWorkouts);

    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockWorkouts);
  });
});
```

## Performance Patterns

### Lazy Loading

```typescript
// Dynamic component loading
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// Conditional loading
function Dashboard() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div>
      <BasicStats />
      {showAdvanced && <HeavyChart />}
      <Button onClick={() => setShowAdvanced(true)}>
        Show Advanced Stats
      </Button>
    </div>
  );
}
```

### Memoization

```typescript
// Expensive computation
const ExpensiveComponent = ({ data }: { data: WorkoutData[] }) => {
  const processedData = useMemo(() => {
    return data.map(workout => ({
      ...workout,
      totalVolume: calculateVolume(workout.exercises),
      difficulty: calculateDifficulty(workout),
    }));
  }, [data]);

  return <WorkoutChart data={processedData} />;
};

// Callback memoization
const WorkoutList = ({ workouts }: { workouts: Workout[] }) => {
  const handleWorkoutStart = useCallback((id: string) => {
    // Start workout logic
  }, []);

  return (
    <div>
      {workouts.map(workout => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onStart={handleWorkoutStart}
        />
      ))}
    </div>
  );
};
```

## Deployment Examples

### Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_ENABLE_DEBUG=true

# .env.production
NEXT_PUBLIC_API_URL=https://api.sunsteel.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Build Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

## Related Documentation
- [Components](../components/README.md)
- [Hooks](../hooks/README.md)
- [Development](../development/README.md)