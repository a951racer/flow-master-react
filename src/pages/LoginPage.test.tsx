import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import * as authApi from '../api/auth';

// Mock the auth API
vi.mock('../api/auth', () => ({
  login: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear stores
    useAuthStore.getState().clearToken();
    useNotificationStore.setState({ notifications: [] });
    
    // Clear mocks
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    cleanup();
  });

  it('renders login form with email and password fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls login API and navigates to dashboard on successful login', async () => {
    const user = userEvent.setup();
    const mockToken = 'test-jwt-token';
    
    vi.mocked(authApi.login).mockResolvedValue({ token: mockToken });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'testpass');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify API was called with correct credentials
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'testpass');
    });

    // Verify token was stored
    expect(useAuthStore.getState().token).toBe(mockToken);

    // Verify navigation to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('displays error notification on login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    
    vi.mocked(authApi.login).mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify notification was added
    await waitFor(() => {
      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe(errorMessage);
    });

    // Verify token was NOT stored
    expect(useAuthStore.getState().token).toBeNull();

    // Verify navigation did NOT occur
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('preserves email field on login error', async () => {
    const user = userEvent.setup();
    
    vi.mocked(authApi.login).mockRejectedValue(new Error('Login failed'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpass');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the error to be processed
    await waitFor(() => {
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });

    // Verify email is preserved
    expect(emailInput.value).toBe('test@example.com');
  });

  it('disables submit button while request is in-flight', async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can control
    let resolveLogin: (value: { token: string }) => void;
    const loginPromise = new Promise<{ token: string }>((resolve) => {
      resolveLogin = resolve;
    });
    
    vi.mocked(authApi.login).mockReturnValue(loginPromise);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'testpass');
    
    // Button should be enabled initially
    expect(submitButton).not.toBeDisabled();
    
    // Submit the form
    await user.click(submitButton);

    // Button should be disabled while request is in-flight
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the login
    resolveLogin!({ token: 'test-token' });

    // Button should be enabled again after request completes
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('disables input fields while request is in-flight', async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can control
    let resolveLogin: (value: { token: string }) => void;
    const loginPromise = new Promise<{ token: string }>((resolve) => {
      resolveLogin = resolve;
    });
    
    vi.mocked(authApi.login).mockReturnValue(loginPromise);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Fill in the form
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'testpass');
    
    // Inputs should be enabled initially
    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Inputs should be disabled while request is in-flight
    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    // Resolve the login
    resolveLogin!({ token: 'test-token' });

    // Inputs should be enabled again after request completes
    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });
  });
});
