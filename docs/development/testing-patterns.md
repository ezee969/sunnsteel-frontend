# Testing Patterns & Best Practices

## Overview

This document outlines comprehensive testing patterns and best practices for the Sunnsteel Frontend application, with special focus on dialog components, async interactions, navigation testing, and component integration patterns.

## Table of Contents

1. [Testing Setup & Configuration](#testing-setup--configuration)
2. [Dialog Component Testing](#dialog-component-testing)
3. [Async Interactions & React Query](#async-interactions--react-query)
4. [Navigation Testing](#navigation-testing)
5. [Component Integration Testing](#component-integration-testing)
6. [Mocking Strategies](#mocking-strategies)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)

## Testing Setup & Configuration

### Test Environment Setup

Our testing environment uses Vitest with React Testing Library and includes comprehensive mocking for Next.js and Supabase:

```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({ id: 'test-id' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Provide Supabase env vars for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock DOM methods not implemented in jsdom
if (!('scrollIntoView' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
}

window.alert = vi.fn();
```

### Test Utilities

```typescript
// test/utils.tsx
import React, { ReactElement } from 'react';
import * as RTL from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function render(ui: ReactElement, options?: CustomRenderOptions) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return RTL.render(ui, { wrapper: Wrapper, ...options });
}

export const createQueryWrapper = (client?: QueryClient) => {
  const qc = client ?? new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

export * from '@testing-library/react';
export { render };
```

## Dialog Component Testing

### Basic Dialog Testing Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutDialogs } from '@/features/routines/components/WorkoutDialogs';

describe('WorkoutDialogs', () => {
  const defaultProps = {
    activeConflictOpen: false,
    onActiveConflictClose: vi.fn(),
    onGoToActiveSession: vi.fn(),
    dateValidationOpen: false,
    onDateValidationClose: vi.fn(),
    dateConfirmOpen: false,
    onDateConfirm: vi.fn(),
    onDateConfirmClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active session conflict dialog with navigation button', async () => {
    const user = userEvent.setup();
    const mockGoToSession = vi.fn();
    
    render(
      <WorkoutDialogs
        {...defaultProps}
        activeConflictOpen={true}
        onGoToActiveSession={mockGoToSession}
      />
    );
    
    // Verify dialog is visible
    expect(screen.getByText('Active Session Detected')).toBeInTheDocument();
    
    // Test navigation button
    const goToSessionBtn = screen.getByText('Go to Active Session');
    expect(goToSessionBtn).toBeInTheDocument();
    
    await user.click(goToSessionBtn);
    expect(mockGoToSession).toHaveBeenCalledTimes(1);
  });

  it('handles dialog close actions correctly', async () => {
    const user = userEvent.setup();
    const mockClose = vi.fn();
    
    render(
      <WorkoutDialogs
        {...defaultProps}
        activeConflictOpen={true}
        onActiveConflictClose={mockClose}
      />
    );
    
    // Test close button
    const cancelBtn = screen.getByText('Cancel');
    await user.click(cancelBtn);
    
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation correctly', async () => {
    const user = userEvent.setup();
    const mockGoToSession = vi.fn();
    
    render(
      <WorkoutDialogs
        {...defaultProps}
        activeConflictOpen={true}
        onGoToActiveSession={mockGoToSession}
      />
    );
    
    // Test Escape key closes dialog
    await user.keyboard('{Escape}');
    expect(defaultProps.onActiveConflictClose).toHaveBeenCalled();
    
    // Test Tab navigation
    await user.tab();
    expect(screen.getByText('Cancel')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByText('Go to Active Session')).toHaveFocus();
    
    // Test Enter key on focused button
    await user.keyboard('{Enter}');
    expect(mockGoToSession).toHaveBeenCalled();
  });
});
```

### Dialog State Management Testing

```typescript
describe('Dialog State Management', () => {
  it('manages multiple dialog states correctly', async () => {
    const user = userEvent.setup();
    let dialogStates = {
      activeConflict: false,
      dateValidation: false,
      dateConfirm: false,
    };
    
    const setDialogStates = vi.fn((updater) => {
      dialogStates = typeof updater === 'function' 
        ? updater(dialogStates) 
        : updater;
    });
    
    const TestComponent = () => {
      return (
        <div>
          <button onClick={() => setDialogStates(prev => ({ ...prev, activeConflict: true }))}>
            Show Active Conflict
          </button>
          <WorkoutDialogs
            activeConflictOpen={dialogStates.activeConflict}
            onActiveConflictClose={() => setDialogStates(prev => ({ ...prev, activeConflict: false }))}
            // ... other props
          />
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Test dialog opening
    await user.click(screen.getByText('Show Active Conflict'));
    expect(setDialogStates).toHaveBeenCalledWith(expect.any(Function));
    
    // Verify state update logic
    const lastCall = setDialogStates.mock.calls[setDialogStates.mock.calls.length - 1][0];
    const newState = lastCall({ activeConflict: false, dateValidation: false, dateConfirm: false });
    expect(newState.activeConflict).toBe(true);
  });
});
```

## Async Interactions & React Query

### Testing React Query Mutations

```typescript
import { QueryClient } from '@tanstack/react-query';
import { createQueryWrapper } from '@/test/utils';

describe('Async Workout Operations', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('handles session finish with navigation', async () => {
    const user = userEvent.setup();
    const mockPush = vi.fn();
    
    // Mock the finish mutation
    const finishMutate = vi.fn();
    vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
      useFinishSession: () => ({
        mutate: finishMutate,
        isPending: false,
        error: null,
      }),
    }));
    
    // Mock router
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
    }));
    
    const TestComponent = () => {
      const { mutate: finishSession } = useFinishSession();
      const router = useRouter();
      
      const handleFinish = () => {
        finishSession(
          { status: 'COMPLETED' },
          {
            onSuccess: () => {
              router.push('/dashboard');
            },
          }
        );
      };
      
      return <button onClick={handleFinish}>Finish Session</button>;
    };
    
    render(<TestComponent />, { wrapper: createQueryWrapper(queryClient) });
    
    await user.click(screen.getByText('Finish Session'));
    
    // Verify mutation was called
    expect(finishMutate).toHaveBeenCalledWith(
      { status: 'COMPLETED' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
    
    // Simulate successful mutation
    const onSuccess = finishMutate.mock.calls[0][1].onSuccess;
    onSuccess();
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles async errors gracefully', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Network error');
    
    const failingMutate = vi.fn().mockImplementation((_, options) => {
      options?.onError?.(mockError);
    });
    
    vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
      useFinishSession: () => ({
        mutate: failingMutate,
        isPending: false,
        error: mockError,
      }),
    }));
    
    const TestComponent = () => {
      const { mutate: finishSession, error } = useFinishSession();
      
      return (
        <div>
          <button onClick={() => finishSession({ status: 'COMPLETED' })}>
            Finish Session
          </button>
          {error && <div role="alert">Error: {error.message}</div>}
        </div>
      );
    };
    
    render(<TestComponent />, { wrapper: createQueryWrapper(queryClient) });
    
    await user.click(screen.getByText('Finish Session'));
    
    expect(screen.getByRole('alert')).toHaveTextContent('Error: Network error');
  });
});
```

### Testing Loading States

```typescript
describe('Loading State Management', () => {
  it('shows loading indicators during async operations', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [isLoading, setIsLoading] = useState(false);
      
      const handleAsyncAction = async () => {
        setIsLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
          setIsLoading(false);
        }
      };
      
      return (
        <div>
          <button onClick={handleAsyncAction} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Start Action'}
          </button>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Start Action');
    expect(button).not.toBeDisabled();
    
    await user.click(button);
    
    // Check loading state
    expect(button).toHaveTextContent('Loading...');
    expect(button).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(button).toHaveTextContent('Start Action');
      expect(button).not.toBeDisabled();
    });
  });
});
```

## Navigation Testing

### Testing Router Integration

```typescript
describe('Navigation Integration', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  
  beforeEach(() => {
    vi.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        back: mockBack,
      }),
    }));
  });

  it('navigates to active session correctly', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const router = useRouter();
      
      const handleGoToActiveSession = () => {
        router.push('/workouts/sessions/active');
      };
      
      return (
        <button onClick={handleGoToActiveSession}>
          Go to Active Session
        </button>
      );
    };
    
    render(<TestComponent />);
    
    await user.click(screen.getByText('Go to Active Session'));
    
    expect(mockPush).toHaveBeenCalledWith('/workouts/sessions/active');
  });

  it('handles navigation with state cleanup', async () => {
    const user = userEvent.setup();
    const mockCloseDialog = vi.fn();
    
    const TestComponent = () => {
      const router = useRouter();
      
      const handleNavigateAndClose = () => {
        router.push('/dashboard');
        mockCloseDialog();
      };
      
      return (
        <button onClick={handleNavigateAndClose}>
          Navigate and Close
        </button>
      );
    };
    
    render(<TestComponent />);
    
    await user.click(screen.getByText('Navigate and Close'));
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
```

### Testing URL Parameters

```typescript
describe('URL Parameter Handling', () => {
  it('handles dynamic route parameters', () => {
    const mockParams = { id: 'session-123' };
    
    vi.mock('next/navigation', () => ({
      useParams: () => mockParams,
    }));
    
    const TestComponent = () => {
      const params = useParams();
      return <div>Session ID: {params.id}</div>;
    };
    
    render(<TestComponent />);
    
    expect(screen.getByText('Session ID: session-123')).toBeInTheDocument();
  });
});
```

## Component Integration Testing

### Testing Complex Component Interactions

```typescript
describe('Component Integration', () => {
  it('integrates dialog with session manager correctly', async () => {
    const user = userEvent.setup();
    
    // Mock session manager hook
    const mockSessionManager = {
      showActiveConflictDialog: true,
      closeActiveConflictDialog: vi.fn(),
      startWorkout: vi.fn(),
    };
    
    vi.mock('@/features/routines/hooks/useWorkoutSessionManager', () => ({
      useWorkoutSessionManager: () => mockSessionManager,
    }));
    
    const TestComponent = () => {
      const sessionManager = useWorkoutSessionManager('routine-1', mockRoutine);
      const router = useRouter();
      
      const handleGoToActiveSession = () => {
        router.push('/workouts/sessions/active');
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
    };
    
    render(<TestComponent />);
    
    // Verify dialog is shown
    expect(screen.getByText('Active Session Detected')).toBeInTheDocument();
    
    // Test navigation action
    await user.click(screen.getByText('Go to Active Session'));
    
    expect(mockPush).toHaveBeenCalledWith('/workouts/sessions/active');
    expect(mockSessionManager.closeActiveConflictDialog).toHaveBeenCalled();
  });
});
```

### Testing Form Integration

```typescript
describe('Form Integration Testing', () => {
  it('handles form submission with validation', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    
    const TestForm = () => {
      const [formData, setFormData] = useState({ reps: '' });
      const [errors, setErrors] = useState<string[]>([]);
      
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: string[] = [];
        
        if (!formData.reps || parseInt(formData.reps) < 1) {
          newErrors.push('Reps must be at least 1');
        }
        
        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }
        
        setErrors([]);
        mockSubmit(formData);
      };
      
      return (
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={formData.reps}
            onChange={(e) => setFormData({ reps: e.target.value })}
            aria-label="Reps"
          />
          <button type="submit">Submit</button>
          {errors.map((error, index) => (
            <div key={index} role="alert">{error}</div>
          ))}
        </form>
      );
    };
    
    render(<TestForm />);
    
    // Test validation error
    await user.click(screen.getByText('Submit'));
    expect(screen.getByRole('alert')).toHaveTextContent('Reps must be at least 1');
    expect(mockSubmit).not.toHaveBeenCalled();
    
    // Test successful submission
    await user.type(screen.getByLabelText('Reps'), '10');
    await user.click(screen.getByText('Submit'));
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockSubmit).toHaveBeenCalledWith({ reps: '10' });
  });
});
```

## Mocking Strategies

### API Mocking

```typescript
// Mock HTTP client
vi.mock('@/lib/api/services/httpClient', () => ({
  httpClient: {
    request: vi.fn(),
  },
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'fake-token' } },
      }),
    },
  },
}));

// Usage in tests
const mockRequest = vi.mocked(httpClient.request);

beforeEach(() => {
  mockRequest.mockResolvedValue({
    data: { id: 'session-1', status: 'IN_PROGRESS' },
  });
});
```

### Hook Mocking

```typescript
// Mock custom hooks
vi.mock('@/lib/api/hooks/useWorkoutSession', () => ({
  useSession: vi.fn(),
  useFinishSession: vi.fn(),
  useUpsertSetLog: vi.fn(),
}));

// Setup mock implementations
const mockUseSession = vi.mocked(useSession);
const mockUseFinishSession = vi.mocked(useFinishSession);

beforeEach(() => {
  mockUseSession.mockReturnValue({
    data: mockSessionData,
    isLoading: false,
    error: null,
  });
  
  mockUseFinishSession.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  });
});
```

### Component Mocking

```typescript
// Mock complex child components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));
```

## Best Practices

### 1. Test Organization

```typescript
describe('ComponentName', () => {
  // Group related tests
  describe('rendering', () => {
    it('renders with default props', () => {});
    it('renders with custom props', () => {});
  });
  
  describe('interactions', () => {
    it('handles click events', () => {});
    it('handles keyboard events', () => {});
  });
  
  describe('async behavior', () => {
    it('handles loading states', () => {});
    it('handles error states', () => {});
  });
});
```

### 2. Accessibility Testing

```typescript
describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<WorkoutDialogs {...props} />);
    
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('button', { name: /go to active session/i }))
      .toBeInTheDocument();
  });
  
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<WorkoutDialogs {...props} />);
    
    await user.tab();
    expect(screen.getByText('Cancel')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByText('Go to Active Session')).toHaveFocus();
  });
});
```

### 3. Error Boundary Testing

```typescript
describe('Error Handling', () => {
  it('handles component errors gracefully', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      try {
        return <>{children}</>;
      } catch (error) {
        return <div>Something went wrong</div>;
      }
    };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### 4. Performance Testing

```typescript
describe('Performance', () => {
  it('does not cause unnecessary re-renders', () => {
    const renderSpy = vi.fn();
    
    const TestComponent = React.memo(() => {
      renderSpy();
      return <div>Test Component</div>;
    });
    
    const { rerender } = render(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    // Re-render with same props
    rerender(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
  });
});
```

## Common Patterns

### 1. Dialog Testing Template

```typescript
const createDialogTest = (dialogType: string, openProp: string) => {
  return describe(`${dialogType} Dialog`, () => {
    it('opens and closes correctly', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      
      const { rerender } = render(
        <WorkoutDialogs
          {...defaultProps}
          [openProp]: false
          onClose={mockClose}
        />
      );
      
      // Dialog should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Open dialog
      rerender(
        <WorkoutDialogs
          {...defaultProps}
          [openProp]: true
          onClose={mockClose}
        />
      );
      
      // Dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Close dialog
      await user.click(screen.getByText('Cancel'));
      expect(mockClose).toHaveBeenCalled();
    });
  });
};

// Usage
createDialogTest('Active Conflict', 'activeConflictOpen');
createDialogTest('Date Validation', 'dateValidationOpen');
```

### 2. Async Action Testing Template

```typescript
const createAsyncActionTest = (actionName: string, mockHook: any) => {
  return describe(`${actionName} Action`, () => {
    it('handles success case', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      const mockOnSuccess = vi.fn();
      
      mockHook.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      });
      
      render(<TestComponent onSuccess={mockOnSuccess} />);
      
      await user.click(screen.getByText(actionName));
      
      expect(mockMutate).toHaveBeenCalled();
      
      // Simulate success
      const onSuccess = mockMutate.mock.calls[0][1]?.onSuccess;
      onSuccess?.();
      
      expect(mockOnSuccess).toHaveBeenCalled();
    });
    
    it('handles error case', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Test error');
      
      mockHook.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: mockError,
      });
      
      render(<TestComponent />);
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });
};
```

### 3. Integration Testing Template

```typescript
const createIntegrationTest = (componentName: string, dependencies: string[]) => {
  return describe(`${componentName} Integration`, () => {
    beforeEach(() => {
      // Mock all dependencies
      dependencies.forEach(dep => {
        vi.mock(dep, () => ({}));
      });
    });
    
    it('integrates all dependencies correctly', () => {
      render(<ComponentUnderTest />);
      
      // Test integration points
      dependencies.forEach(dep => {
        // Verify dependency usage
      });
    });
  });
};
```

## Testing Checklist

### For Dialog Components
- [ ] Dialog opens and closes correctly
- [ ] All buttons trigger correct callbacks
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ARIA attributes are present
- [ ] Focus management is correct
- [ ] Multiple dialogs don't conflict

### For Async Operations
- [ ] Loading states are shown
- [ ] Success cases are handled
- [ ] Error cases are handled
- [ ] Optimistic updates work correctly
- [ ] Race conditions are prevented
- [ ] Cleanup happens on unmount

### For Navigation
- [ ] Router methods are called correctly
- [ ] URL parameters are handled
- [ ] State cleanup happens on navigation
- [ ] Back button behavior is correct
- [ ] Deep linking works

### For Integration
- [ ] Components communicate correctly
- [ ] Shared state is managed properly
- [ ] Event propagation works
- [ ] Error boundaries catch errors
- [ ] Performance is acceptable

---

## Related Documentation

- **[Component Documentation](../components/features/README.md)** - Component-specific testing examples
- **[API Testing](../api/services/README.md)** - API service testing patterns
- **[Architecture Testing](../architecture/README.md)** - System-level testing strategies

---

*This document is part of the Sunnsteel Frontend development documentation. For implementation examples, see the `test/` directory in the project root.*