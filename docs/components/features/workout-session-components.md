# Workout Session Components

## Overview

The workout session components provide a comprehensive interface for managing active workout sessions, including progress tracking, set logging, and session completion workflows.

## Component Architecture

### Core Components

#### SessionHeader
**Location**: `components/features/workout/session-header.tsx`

Displays essential session information at the top of the workout interface.

**Props:**
```typescript
interface SessionHeaderProps {
  routineName: string;
  dayName: string;
  startedAt: string;
  progressData: SessionProgressData;
}
```

**Features:**
- Routine and day name display
- Session start time with relative formatting
- Real-time progress tracking (completed/total sets)
- Completion percentage badge
- Duration display

**Usage:**
```tsx
<SessionHeader
  routineName={routine.name}
  dayName={day.name}
  startedAt={session.startedAt}
  progressData={progressData}
/>
```

#### SessionActionCard
**Location**: `components/features/workout/session-action-card.tsx`

Primary action interface for session management and navigation.

**Props:**
```typescript
interface SessionActionCardProps {
  sessionId: string;
  routineName: string;
  dayName: string;
  startedAt: string;
  progressData: SessionProgressData;
  isFinishing: boolean;
  onFinishAttempt: () => void;
  onNavigateBack: () => void;
}
```

**Features:**
- Session statistics display (duration, sets completed)
- Visual progress bar with percentage
- Session information summary
- Navigation controls (back button)
- Finish session action with loading state
- Completion status messaging

#### ExerciseGroup
**Location**: `components/features/workout/exercise-group.tsx`

Collapsible exercise container with set logging interface.

**Props:**
```typescript
interface ExerciseGroupProps {
  exerciseId: string;
  exerciseName: string;
  sets: Array<{
    setNumber: number;
    reps?: number;
    weight?: number;
    rpe?: number;
    isCompleted: boolean;
    // ... other set properties
  }>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  completedSets: number;
  totalSets: number;
  onSave: (payload: UpsertSetLogPayload) => Promise<void>;
}
```

**Features:**
- Collapsible exercise sections
- Exercise completion status display
- Individual set logging with `SetLogInput` components
- Progress tracking per exercise
- Real-time completion percentage

#### SessionConfirmationDialog
**Location**: `components/features/workout/session-confirmation-dialog.tsx`

Modal dialog for confirming session completion with progress validation.

**Props:**
```typescript
interface SessionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  progressData: SessionProgressData;
  routineName: string;
  isLoading?: boolean;
}
```

**Features:**
- Progress summary display
- Incomplete session warnings
- Success messaging for complete sessions
- Confirmation and cancellation actions
- Loading state management

### Supporting Components

#### SetLogInput
**Location**: `components/features/workout/set-log-input.tsx`

Individual set logging interface with weight, reps, and RPE inputs.

#### Progress Bar Components
Various progress visualization components used throughout the session interface.

## Data Flow

### Session Progress Data

All components consume `SessionProgressData` from the session progress utilities:

```typescript
interface SessionProgressData {
  totalSets: number;
  completedSets: number;
  percentage: number;
}
```

### State Management

The session page uses several hooks for state management:

- `useSessionManagement`: Core session data and operations
- `useCollapsibleExercises`: Exercise collapse/expand state
- `useSetLogs`: Set logging operations
- `useFinishSession`: Session completion workflow

## Integration Points

### Session Page Component
**Location**: `app/(protected)/workouts/sessions/[id]/page.tsx`

The main session page orchestrates all components:

```tsx
export default function SessionPage({ params }: { params: { id: string } }) {
  const {
    session,
    routine,
    setLogs,
    progressData,
    isLoading,
    error,
    handleFinishSession,
    isFinishing
  } = useSessionManagement(params.id);

  const { collapsedExercises, toggleExercise, isCollapsed } = useCollapsibleExercises();

  // Component rendering with proper data flow
  return (
    <div className="container mx-auto p-4 space-y-6">
      <SessionHeader {...headerProps} />
      <SessionActionCard {...actionProps} />
      {groupedLogs.map(group => (
        <ExerciseGroup
          key={group.exerciseId}
          {...group}
          isCollapsed={isCollapsed(group.exerciseId)}
          onToggleCollapse={() => toggleExercise(group.exerciseId)}
          onSave={handleSetLogSave}
        />
      ))}
      <SessionConfirmationDialog {...dialogProps} />
    </div>
  );
}
```

## Recent Fixes (January 2025)

### Property Name Corrections

Fixed incorrect property references in multiple components:

1. **SessionHeader**: Changed `progressPercentage` to `percentage`
2. **SessionActionCard**: Updated progress display to use correct property
3. **SessionConfirmationDialog**: Fixed completion calculation
4. **ExerciseGroup**: Corrected props interface definition

### Import Fixes

1. **ExerciseGroup**: Added missing `UpsertSetLogPayload` import
2. **Session Progress Utils**: Added missing `RoutineExercise` import

### Type Safety Improvements

1. **ExerciseGroupProps**: Redefined interface with explicit properties
2. **Progress Calculations**: Enhanced null checking and validation
3. **Component Props**: Improved type definitions across all components

## Error Handling

### Loading States
- Skeleton loaders during data fetching
- Loading indicators for async operations
- Graceful degradation for missing data

### Error States
- Session not found handling
- Routine/day not found scenarios
- Network error recovery
- Validation error display

### Edge Cases
- Empty exercise lists
- No set logs scenarios
- Session timeout handling
- Concurrent session conflicts

## Performance Optimizations

### Memoization
- Progress data calculations memoized with `useMemo`
- Exercise grouping optimized for large datasets
- Component re-render minimization

### Lazy Loading
- Set log inputs rendered on-demand
- Exercise groups with collapsible sections
- Progressive data loading

## Accessibility

### Keyboard Navigation
- Full keyboard support for all interactive elements
- Proper tab order and focus management
- ARIA labels for screen readers

### Visual Indicators
- High contrast progress indicators
- Clear completion status messaging
- Accessible color schemes

## Testing Strategy

### Unit Tests
- Component rendering with various props
- Progress calculation accuracy
- User interaction handling
- Error state management

### Integration Tests
- Full session workflow testing
- Data flow validation
- Hook integration testing
- API interaction testing

## Related Documentation

- [Session Progress Utilities](../../lib/utils/session-progress-utils.md)
- [Session Management Hook](../../hooks/use-session-management.md)
- [Workout Session Types](../../lib/workout-session-types.md)
- [API Integration](../../api/workout-sessions.md)

---

*Last Updated: January 2025*  
*This documentation reflects the recent TypeScript fixes and component improvements.*