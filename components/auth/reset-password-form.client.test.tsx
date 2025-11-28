import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from './reset-password-form';

const mockSearchParams = {
  get: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/lib/auth/actions', () => ({
  resetPasswordWithToken: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { resetPasswordWithToken } from '@/lib/auth/actions';

describe('ResetPasswordForm', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset URL so we can assert redirect changes it
    window.location.href = 'http://localhost/';

    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'token') return 'test-token';
      if (key === 'error') return null;
      return null;
    });
  });

  it('initializes error state when URL has error=INVALID_TOKEN', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'token') return 'test-token';
      if (key === 'error') return 'INVALID_TOKEN';
      return null;
    });

    render(<ResetPasswordForm />);

    expect(screen.getByText('invalidToken')).toBeInTheDocument();
  });

  it('shows password mismatch error when passwords do not match', async () => {
    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('newPassword'), {
      target: { value: 'password-1' },
    });
    fireEvent.change(screen.getByLabelText('confirmPassword'), {
      target: { value: 'password-2' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'resetPassword' }));

    await waitFor(() => {
      expect(screen.getByText('passwordMismatch')).toBeInTheDocument();
    });

    expect(resetPasswordWithToken).not.toHaveBeenCalled();
  });

  it('shows missingToken error when token is not present in URL', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'token') return null;
      if (key === 'error') return null;
      return null;
    });

    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('newPassword'), {
      target: { value: 'password-1' },
    });
    fireEvent.change(screen.getByLabelText('confirmPassword'), {
      target: { value: 'password-1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'resetPassword' }));

    await waitFor(() => {
      expect(screen.getByText('missingToken')).toBeInTheDocument();
    });

    expect(resetPasswordWithToken).not.toHaveBeenCalled();
  });

  it('calls resetPasswordWithToken and shows backend error when server action returns error', async () => {
    (resetPasswordWithToken as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Reset failed' },
    });

    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('newPassword'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('confirmPassword'), {
      target: { value: 'new-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'resetPassword' }));

    await waitFor(() => {
      expect(resetPasswordWithToken).toHaveBeenCalledWith('new-password', 'test-token');
      expect(screen.getByText('Reset failed')).toBeInTheDocument();
    });
  });

  it('redirects to sign-in with reset success query when password reset succeeds', async () => {
    (resetPasswordWithToken as jest.Mock).mockResolvedValue({
      data: { ok: true },
      error: null,
    });

    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('newPassword'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('confirmPassword'), {
      target: { value: 'new-password' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'resetPassword' }));

    await waitFor(() => {
      expect(resetPasswordWithToken).toHaveBeenCalledWith('new-password', 'test-token');
    });
  });
});
