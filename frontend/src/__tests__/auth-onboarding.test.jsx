// frontend/src/__tests__/auth-onboarding.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import Signup from '../pages/Signup';
import StatementUpload from '../components/StatementUpload';
import DetectedList from '../components/DetectedList';
import Dashboard from '../pages/Dashboard';
import AppDirectory from '../pages/AppDirectory';
import { mockAuthApi } from '../mock/auth';
import { calculatePasswordStrength } from '../components/PasswordMeter';

describe('Auth & Onboarding Flow', () => {
  beforeEach(async () => {
    await mockAuthApi.logout();
  });

  // Test 1: Sign Up won't advance with invalid email or mismatched passwords
  it('Sign Up won’t advance with invalid email or mismatched passwords', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Signup />
        </AuthProvider>
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText(/Aahana Rao/i);
    const emailInput = screen.getByPlaceholderText(/aahana@example.com/i);
    const passInput = screen.getByPlaceholderText(/At least 8 characters/i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter password/i);
    const terms = screen.getByRole('checkbox');
    const submitBtn = screen.getByRole('button', { name: /Continue to Profile/i });

    // Invalid email test
    fireEvent.change(nameInput, { target: { value: 'Aahana Rao' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passInput, { target: { value: 'Secret123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Secret123!' } });
    fireEvent.click(terms);
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/Please enter a valid email address/i);

    // Mismatched password test
    fireEvent.change(emailInput, { target: { value: 'valid@paypal.com' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPass123!' } });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/Passwords do not match/i);
  });

  // Test 2: Protected routes redirect to /login when logged out
  it('Protected routes redirect to /login when logged out', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page Screen</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Dashboard Area</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected Dashboard Area')).not.toBeInTheDocument();
  });

  // Test 3: Upload rejects wrong file types and oversize files
  it('Upload rejects wrong file types and oversize files', async () => {
    render(<StatementUpload onUploadSuccess={() => {}} onBackToOAuth={() => {}} />);

    const input = screen.getByLabelText(/Upload PayPal Statement/i);

    // Invalid file type (.exe)
    const badFile = new File(['dummy content'], 'ledger.exe', { type: 'application/x-msdownload' });
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText(/Invalid file format/i)).toBeInTheDocument();

    // Oversize file (> 10MB)
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'giant.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(screen.getByText(/File exceeds 10 MB limit/i)).toBeInTheDocument();
  });

  // Test 4: The review step preselects only high-confidence items
  it('The review step preselects only high-confidence items', () => {
    const mockSubs = [
      { id: '1', name: 'High Conf Sub', confidence_score: 0.95, amount: 10, billing_cycle: 'monthly' },
      { id: '2', name: 'Low Conf Sub', confidence_score: 0.72, amount: 20, billing_cycle: 'monthly' },
    ];

    render(<DetectedList subscriptions={mockSubs} onConfirm={() => {}} loading={false} />);

    const check1 = screen.getByLabelText(/Select High Conf Sub/i);
    const check2 = screen.getByLabelText(/Select Low Conf Sub/i);

    expect(check1).toBeChecked();
    expect(check2).not.toBeChecked();
    expect(screen.getByText(/Needs review/i)).toBeInTheDocument();
  });

  // Test 5: Confirm saves the selected subscriptions and the dashboard shows them
  it('Confirm saves the selected subscriptions and the dashboard shows them', async () => {
    await mockAuthApi.login('judge@paypalhackathon.com', 'Pass1234!');
    const newItems = [
      { id: 'sub-new-1', name: 'Super AI Tool', amount: 30, billing_cycle: 'monthly', confidence_score: 0.99 }
    ];

    await mockAuthApi.confirmBulkSubscriptions(newItems);

    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Super AI Tool')).toBeInTheDocument();
    });
  });

  // Test 6: Buy and Cancel show the connect prompt when PayPal isn't connected
  it('Buy and Cancel show the connect prompt when PayPal isn’t connected', async () => {
    // Session where PayPal is disconnected
    await mockAuthApi.signup({ name: 'Unlinked User', email: 'unlinked@domain.com' });
    await mockAuthApi.disconnectPayPal();

    // Test in Directory (Buy / Subscribe)
    const { unmount } = render(
      <MemoryRouter>
        <AuthProvider>
          <AppDirectory />
        </AuthProvider>
      </MemoryRouter>
    );

    const subscribeButtons = screen.getAllByRole('button', { name: /Pay with/i });
    fireEvent.click(subscribeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Connect PayPal to Subscribe/i)).toBeInTheDocument();
    });

    unmount();

    // Test in Dashboard (Pause / Cancel)
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Spotify Premium|Streamly/i)).toBeInTheDocument();
    });

    const pauseButtons = screen.getAllByRole('button', { name: /Pause/i });
    fireEvent.click(pauseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Connect PayPal to Manage Subscriptions/i)).toBeInTheDocument();
    });
  });
});
