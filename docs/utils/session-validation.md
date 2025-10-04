# Session Validation Utilities

## Overview

The session validation utilities provide comprehensive validation functions for workout session management, set logging, and session completion workflows in the Sunnsteel application.

## Location

```
lib/utils/session-validation.utils.ts
```

## Key Functions

### 1. Set Log Validation

#### `validateSetLogPayload(payload: UpsertSetLogPayload)`

Validates set log data before saving to ensure data integrity and user experience.

**Parameters:**
- `payload`: UpsertSetLogPayload object containing set log data

**Returns:**
```typescript
{
  isValid: boolean;
  errors: string[];
}
```

**Validation Rules:**
- Set number must be greater than 0
- Reps must be greater than 0
- Weight must be positive if provided
- All required fields must be present

**Usage:**
```typescript
import { validateSetLogPayload } from '@/lib/utils/session-validation.utils';

const payload = {
  routineExerciseId: 'exercise-1',
  exerciseId: 'bench-press',
  setNumber: 1,
  reps: 8,
  weight: 135,
  isCompleted: true
};

const validation = validateSetLogPayload(payload);
if (validation.isValid) {
  // Save the set log
} else {
  console.error('Validation errors:', validation.errors);
}
```

### 2. Weight Validation

#### `validateWeight(weight: number | undefined)`

Simple boolean validation for weight values.

**Parameters:**
- `weight`: Weight value to validate (can be undefined)

**Returns:**
- `boolean`: True if weight is valid or undefined, false otherwise

**Usage:**
```typescript
import { validateWeight } from '@/lib/utils/session-validation.utils';

const isValidWeight = validateWeight(135); // true
const isValidNegative = validateWeight(-10); // false
const isValidUndefined = validateWeight(undefined); // true
```

#### `validateWeightDetailed(weight: number | undefined)`

Detailed weight validation with error messages.

**Parameters:**
- `weight`: Weight value to validate (can be undefined)

**Returns:**
```typescript
{
  isValid: boolean;
  error?: string;
}
```

### 3. Set Completion Check

#### `isSetComplete(payload: UpsertSetLogPayload)`

Determines if a set is considered complete based on the payload data.

**Parameters:**
- `payload`: UpsertSetLogPayload object

**Returns:**
- `boolean`: True if the set meets completion criteria

**Completion Criteria:**
- Set must be marked as completed (`isCompleted: true`)
- Must have valid reps (> 0)
- Must have valid weight if weight is provided

### 4. Session Finish Validation

#### `validateSessionFinish(progressData: SessionProgressData, allowIncomplete: boolean)`

Validates whether a workout session can be finished based on progress and user preferences.

**Parameters:**
- `progressData`: SessionProgressData object containing session progress information
- `allowIncomplete`: Boolean indicating if incomplete sessions are allowed

**Returns:**
```typescript
{
  isValid: boolean;
  canFinish: boolean;
  warnings: string[];
}
```

**Validation Logic:**
- `isValid`: Always true (sessions can always be finished)
- `canFinish`: True if session is complete OR incomplete sessions are allowed
- `warnings`: Array of warning messages for incomplete sessions

**Usage:**
```typescript
import { validateSessionFinish } from '@/lib/utils/session-validation.utils';

const progressData = {
  completedSets: 8,
  totalSets: 12,
  progressPercentage: 67,
  isComplete: false
};

const validation = validateSessionFinish(progressData, true);
if (validation.canFinish) {
  // Allow session to be finished
  if (validation.warnings.length > 0) {
    // Show warnings to user
    console.warn('Session warnings:', validation.warnings);
  }
}
```

## Integration Points

### 1. Form Validation
- Used in `useSetLogForm` hook for real-time validation
- Provides immediate feedback to users during set logging
- Prevents invalid data from being submitted

### 2. Session Management
- Used in `useSessionManagement` hook for session completion validation
- Integrates with session confirmation dialogs
- Provides validation logic for workout completion flows

### 3. Component Integration
- SessionConfirmationDialog uses validation for progress display
- SetLogInput components use validation for form state management
- ExerciseGroup components use validation for set completion tracking

## Testing

The validation utilities are comprehensively tested in:
```
__tests__/utils/session-validation.utils.test.ts
```

Test coverage includes:
- Valid and invalid payload scenarios
- Edge cases (zero values, undefined values)
- Error message accuracy
- Boolean return value consistency

## Error Handling

All validation functions are designed to:
- Never throw exceptions
- Return consistent data structures
- Provide clear, user-friendly error messages
- Handle undefined/null values gracefully

## Performance Considerations

- All validation functions are pure functions
- No external dependencies or API calls
- Optimized for frequent calls during form interactions
- Minimal computational overhead