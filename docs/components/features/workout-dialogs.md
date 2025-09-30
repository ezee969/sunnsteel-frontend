# WorkoutDialogs Component

## Overview

The `WorkoutDialogs` component is a compound component that manages all workout-related dialog interactions in the Sunnsteel application. It provides a centralized way to handle session conflicts, date validation errors, and workout confirmation flows.

## Location

```
features/routines/components/WorkoutDialogs.tsx
```

## Key Features

### 1. Active Session Conflict Management
- **Purpose**: Handles conflicts when users try to start a new workout while having an active session
- **New Feature**: "Go to Active Session" button for seamless navigation
- **User Experience**: Prevents session conflicts while providing easy navigation to existing sessions

### 2. Date Validation Error Handling
- **Purpose**: Informs users when workout days cannot be started due to scheduling constraints
- **Validation**: Integrates with program scheduling and date validation logic
- **User Guidance**: Clear messaging about program schedule requirements

### 3. Date Confirmation Flow
- **Purpose**: Allows users to start workouts on non-scheduled days with explicit confirmation
- **Flexibility**: Provides override capability for strict scheduling
- **Safety**: Requires explicit user confirmation for off-schedule workouts

## Component API

### Props Interface

```typescript
interface WorkoutDialogsProps {
  // Active session conflict dialog
  activeConflictOpen: boolean;
  onActiveConflictClose: () => void;
  onGoToActiveSession?: () => void;  // NEW: Navigation to active session
  
  // Date validation dialog
  dateValidationOpen: boolean;
  onDateValidationClose: () => void;
  
  // Date confirmation dialog
  dateConfirmOpen: boolean;
  onDateConfirm: () => void;
  onDateConfirmClose: () => void;
}
```

### Props Description

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeConflictOpen` | `boolean` | ✅ | Controls visibility of active session conflict dialog |
| `onActiveConflictClose` | `() => void` | ✅ | Callback to close active session conflict dialog |
| `onGoToActiveSession` | `() => void` | ❌ | **NEW**: Callback to navigate to active workout session |
| `dateValidationOpen` | `boolean` | ✅ | Controls visibility of date validation error dialog |
| `onDateValidationClose` | `() => void` | ✅ | Callback to close date validation dialog |
| `dateConfirmOpen` | `boolean` | ✅ | Controls visibility of date confirmation dialog |
| `onDateConfirm` | `() => void` | ✅ | Callback to confirm starting workout on wrong day |
| `onDateConfirmClose` | `() => void` | ✅ | Callback to close date confirmation dialog |

## Usage Examples

### Basic Implementation

```typescript
import { WorkoutDialogs } from '@/features/routines/components/WorkoutDialogs';
import { useRouter } from 'next/navigation';

function RoutineDetailsPage() {
  const router = useRouter();
  const [dialogStates, setDialogStates] = useState({
    activeConflict: false,
    dateValidation: false,
    dateConfirm: false,
  });

  const handleGoToActiveSession = () => {
    router.push('/workouts/sessions/active');
    setDialogStates(prev => ({ ...prev, activeConflict: false }));
  };

  return (
    <div>
      {/* Your routine content */}
      
      <WorkoutDialogs
        activeConflictOpen={dialogStates.activeConflict}
        onActiveConflictClose={() => setDialogStates(prev => ({ ...prev, activeConflict: false }))}
        onGoToActiveSession={handleGoToActiveSession}
        
        dateValidationOpen={dialogStates.dateValidation}
        onDateValidationClose={() => setDialogStates(prev => ({ ...prev, dateValidation: false }))}
        
        dateConfirmOpen={dialogStates.dateConfirm}
        onDateConfirm={handleStartWorkout}
        onDateConfirmClose={() => setDialogStates(prev => ({ ...prev, dateConfirm: false }))}
      />
    </div>
  );
}
```

### Integration with Session Manager

```typescript
import { useWorkoutSessionManager } from '@/features/routines/hooks/useWorkoutSessionManager';

function RoutineDetailsPage() {
  const sessionManager = useWorkoutSessionManager(routineId, routine);
  
  const handleGoToActiveSession = () => {
    // Navigate to active session
    router.push('/workouts/sessions/active');
    // Close dialog
    sessionManager.closeActiveConflictDialog();
  };

  return (
    <WorkoutDialogs
      activeConflictOpen={sessionManager.showActiveConflictDialog}
      onActiveConflictClose={sessionManager.closeActiveConflictDialog}
      onGoToActiveSession={handleGoToActiveSession}
      // ... other props
    />
  );
}
```

## Dialog Behaviors

### 1. Active Session Conflict Dialog

**Trigger Conditions:**
- User attempts to start a new workout session
- An active session already exists for a different routine day
- Session belongs to the same user

**Dialog Content:**
- **Title**: "Active Session Detected"
- **Message**: Explains the conflict and required action
- **Actions**: 
  - "Cancel" - Closes dialog without action
  - "Go to Active Session" - Navigates to active workout (NEW)

**Navigation Flow:**
```
User clicks "Start Workout" 
→ Active session detected 
→ Dialog opens 
→ User clicks "Go to Active Session" 
→ Navigate to `/workouts/sessions/active`
→ Dialog closes
```

### 2. Date Validation Error Dialog

**Trigger Conditions:**
- Workout day cannot be started due to program scheduling
- Date validation fails (e.g., program not started, program ended)
- Day of week mismatch with strict scheduling

**Dialog Content:**
- **Title**: "Cannot Start Workout"
- **Message**: Explains scheduling constraint
- **Actions**: "OK" - Acknowledges and closes dialog

### 3. Date Confirmation Dialog

**Trigger Conditions:**
- User attempts to start workout on non-scheduled day
- Program allows flexible scheduling
- Requires explicit user confirmation

**Dialog Content:**
- **Title**: "Confirm Workout Day"
- **Message**: Warns about day mismatch
- **Actions**:
  - "Cancel" - Cancels workout start
  - "Start Anyway" - Proceeds with workout start

## Integration Points

### Router Integration
The component integrates with Next.js router for navigation:

```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

const handleGoToActiveSession = () => {
  router.push('/workouts/sessions/active');
};
```

### Session Management Integration
Works with workout session management hooks:

```typescript
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession';
import { useWorkoutSessionManager } from '@/features/routines/hooks/useWorkoutSessionManager';

// Detect active sessions
const { data: activeSession } = useActiveSession();

// Manage session conflicts
const sessionManager = useWorkoutSessionManager(routineId, routine);
```

### Date Validation Integration
Integrates with date validation utilities:

```typescript
import { validateRoutineDayDate } from '@/lib/utils/date';

const dayValidation = validateRoutineDayDate(routineDay);
if (!dayValidation.isValid) {
  // Show date validation dialog
}
```

## Accessibility Features

### Keyboard Navigation
- Full keyboard support for all dialog interactions
- Tab navigation between dialog buttons
- Escape key closes dialogs
- Enter key activates primary actions

### Screen Reader Support
- Proper ARIA labels and descriptions
- Dialog titles announced when opened
- Button purposes clearly communicated
- Focus management on dialog open/close

### Focus Management
- Focus trapped within open dialogs
- Focus returns to trigger element on close
- Primary action button receives initial focus

## Styling & Theming

### Component Structure
```
Dialog (Shadcn/UI)
├── DialogContent
│   ├── DialogHeader
│   │   ├── DialogTitle
│   │   └── DialogDescription
│   └── DialogFooter
│       ├── Button (Cancel/Secondary)
│       └── Button (Primary Action)
```

### Theme Integration
- Uses Shadcn/UI dialog components
- Inherits application theme colors
- Responsive design for mobile devices
- Consistent with application design system

## Testing Considerations

### Unit Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutDialogs } from './WorkoutDialogs';

describe('WorkoutDialogs', () => {
  it('renders active session conflict dialog with navigation button', () => {
    const mockGoToSession = jest.fn();
    
    render(
      <WorkoutDialogs
        activeConflictOpen={true}
        onActiveConflictClose={jest.fn()}
        onGoToActiveSession={mockGoToSession}
        // ... other props
      />
    );
    
    expect(screen.getByText('Active Session Detected')).toBeInTheDocument();
    
    const goToSessionBtn = screen.getByText('Go to Active Session');
    fireEvent.click(goToSessionBtn);
    
    expect(mockGoToSession).toHaveBeenCalled();
  });
});
```

### Integration Testing
- Test dialog interactions with session manager
- Verify navigation behavior
- Test dialog state management
- Validate accessibility compliance

## Performance Considerations

### Lazy Loading
- Dialogs only render when needed
- No performance impact when closed
- Minimal bundle size impact

### State Management
- Efficient state updates
- No unnecessary re-renders
- Proper cleanup on unmount

## Error Handling

### Graceful Degradation
- Handles missing navigation callback gracefully
- Provides fallback behaviors for failed navigation
- Logs errors for debugging

### Error Boundaries
- Component is wrapped in error boundaries
- Graceful fallback for dialog failures
- User-friendly error messages

## Future Enhancements

### Planned Features
- **Session Preview**: Show active session details in conflict dialog
- **Quick Actions**: Additional quick actions in dialogs
- **Customizable Messages**: Dynamic dialog content based on context
- **Animation**: Enhanced dialog transitions and animations

### Extension Points
- Additional dialog types can be easily added
- Customizable button configurations
- Pluggable validation logic
- Themeable dialog variants

## Related Components

- **[RoutineDetailsPage](../../../app/(protected)/routines/[id]/page.tsx)** - Primary consumer
- **[useWorkoutSessionManager](../hooks/useWorkoutSessionManager.ts)** - Session management logic
- **[Dialog Components](../../ui/dialog.tsx)** - Base dialog primitives

## Changelog

### v2.1.0 (Current)
- ✅ Added "Go to Active Session" button functionality
- ✅ Enhanced active session conflict handling
- ✅ Improved navigation integration

### v2.0.0
- Initial compound dialog implementation
- Date validation and confirmation flows
- Basic active session conflict detection

---

*This component is part of the Sunnsteel Frontend workout management system. For related documentation, see [Workout Session Management](../../api/services/workouts.md) and [Architecture Overview](../../architecture/README.md).*