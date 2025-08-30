---
trigger: always_on
---

## Testing Practices and Maintenance

### Test Architecture Overview

- **Backend**: Jest + Supertest for unit and E2E tests with PostgreSQL integration
- **Frontend**: Vitest + React Testing Library with jsdom environment
- **CI/CD**: GitHub Actions for automated testing on push/PR events

### Current Test Coverage

#### Backend Tests

- **Auth Module**: AuthController, AuthService (login/register/logout/refresh)
- **Users Module**: UsersController, UsersService (profile management)
- **Exercises Module**: ExercisesController, ExercisesService (exercise catalog)
- **Token Module**: TokenService (JWT and refresh token management)
- **E2E Tests**: Complete API endpoint integration testing

#### Frontend Tests

- **Auth Components**: Login page, auth hooks (useLogin, useRegister, useLogout)
- **Routine Components**: WorkoutsList component and routine hooks
- **Workout Sessions**: Active session pages, session management
- **UI Components**: Button and base component testing
- **Utilities**: Time helpers and common functions

### Test Maintenance Guidelines

⚠️ **Critical**: When making code changes, ALWAYS:

1. **Update existing tests** if component interfaces or behavior changes
2. **Add new tests** for new features, components, or bug fixes
3. **Mock external dependencies** appropriately for unit tests
4. **Use proper test patterns**:
   - Backend: Mock Prisma, use test database for E2E
   - Frontend: Use `createQueryWrapper` for React Query components
5. **Test user interactions** with fireEvent or userEvent
6. **Verify accessibility** attributes in component tests
7. **Run tests locally** before committing to catch issues early
8. **Update documentation** if test structure changes

### Writing New Tests

Frontend (Vitest + React Testing Library)

```typescript
// Component test pattern
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { createQueryWrapper } from '@/test/utils';
import MyComponent from './MyComponent';

vi.mock('@/lib/api/services/myService');

describe('MyComponent', () => {
  it('should render and handle interaction', () => {
    render(<MyComponent />, { wrapper: createQueryWrapper() });

    expect(screen.getByRole('button')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    // Assert expected behavior
  });
});
```
