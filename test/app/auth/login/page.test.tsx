import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import { useLogin } from '@/lib/api/hooks/useLogin';
import { useAuth } from '@/providers/auth-provider';
import { createQueryWrapper } from '@/test/utils';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/api/hooks/useLogin');
jest.mock('@/providers/auth-provider');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const mockLogin = jest.fn();
const mockUseLogin = {
  mutate: mockLogin,
  isPending: false,
  error: null,
};

const mockAuth = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLogin as jest.Mock).mockReturnValue(mockUseLogin);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  it('should render login form', () => {
    render(<LoginPage />, { wrapper: createQueryWrapper() });

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    render(<LoginPage />, { wrapper: createQueryWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show validation errors for invalid email', async () => {
    render(<LoginPage />, { wrapper: createQueryWrapper() });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors for short password', async () => {
    render(<LoginPage />, { wrapper: createQueryWrapper() });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should display loading state during submission', () => {
    (useLogin as jest.Mock).mockReturnValue({
      ...mockUseLogin,
      isPending: true,
    });

    render(<LoginPage />, { wrapper: createQueryWrapper() });

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    expect(submitButton).toBeDisabled();
  });

  it('should display error message on login failure', () => {
    (useLogin as jest.Mock).mockReturnValue({
      ...mockUseLogin,
      error: { message: 'Invalid credentials' },
    });

    render(<LoginPage />, { wrapper: createQueryWrapper() });

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('should redirect authenticated users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    });

    render(<LoginPage />, { wrapper: createQueryWrapper() });

    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });

  it('should have link to signup page', () => {
    render(<LoginPage />, { wrapper: createQueryWrapper() });

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});
