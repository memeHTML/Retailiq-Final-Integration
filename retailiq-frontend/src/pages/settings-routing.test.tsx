/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';
import { routes } from '@/routes/routes';
import StoreProfilePage from '@/pages/StoreProfile';
import StoreCategoriesPage from '@/pages/StoreCategories';
import StoreTaxConfigPage from '@/pages/StoreTaxConfig';
import SecurityPage from '@/pages/Security';

const apiMocks = vi.hoisted(() => ({
  listProducts: vi.fn(),
  getStoreProfile: vi.fn(),
  updateStoreProfile: vi.fn(),
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getStoreTaxConfig: vi.fn(),
  updateStoreTaxConfig: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  mfaSetup: vi.fn(),
  mfaVerify: vi.fn(),
}));

vi.mock('@/api/inventory', () => ({
  listProducts: apiMocks.listProducts,
}));

vi.mock('@/api/store', () => ({
  getStoreProfile: apiMocks.getStoreProfile,
  updateStoreProfile: apiMocks.updateStoreProfile,
  listCategories: apiMocks.listCategories,
  createCategory: apiMocks.createCategory,
  updateCategory: apiMocks.updateCategory,
  deleteCategory: apiMocks.deleteCategory,
  getStoreTaxConfig: apiMocks.getStoreTaxConfig,
  updateStoreTaxConfig: apiMocks.updateStoreTaxConfig,
}));

vi.mock('@/api/auth', () => ({
  forgotPassword: apiMocks.forgotPassword,
  resetPassword: apiMocks.resetPassword,
  mfaSetup: apiMocks.mfaSetup,
  mfaVerify: apiMocks.mfaVerify,
  login: vi.fn(),
  register: vi.fn(),
  verifyOtp: vi.fn(),
  resendOtp: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
}));

describe('Prompt 08 settings routing', () => {
  beforeEach(() => {
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 1,
        role: 'owner',
        store_id: 1,
        mobile_number: '9999999999',
        full_name: 'Owner User',
        email: 'owner@example.com',
        mfa_enabled: false,
      },
      isAuthenticated: true,
      role: 'owner',
    });

    apiMocks.listProducts.mockResolvedValue({
      data: [
        { product_id: 1, category_id: 10, name: 'Olive Oil', sku_code: 'SKU-1', cost_price: 100, selling_price: 120, current_stock: 5, is_active: true },
        { product_id: 2, category_id: 10, name: 'Rice', sku_code: 'SKU-2', cost_price: 50, selling_price: 65, current_stock: 8, is_active: true },
      ],
      page: 1,
      page_size: 50,
      total: 2,
    });
    apiMocks.getStoreProfile.mockResolvedValue({
      store_id: 1,
      owner_user_id: 1,
      store_name: 'RetailIQ Mart',
      store_type: 'general',
      city: 'Mumbai',
      state: 'MH',
      gst_number: 'GSTIN123',
      currency_symbol: '₹',
      working_days: ['Mon', 'Tue'],
      opening_time: '09:00:00',
      closing_time: '21:00:00',
      timezone: 'Asia/Kolkata',
    });
    apiMocks.listCategories.mockResolvedValue({
      categories: [
        { category_id: 10, store_id: 1, name: 'Groceries', color_tag: 'green', is_active: true, gst_rate: 5 },
      ],
    });
    apiMocks.getStoreTaxConfig.mockResolvedValue({ taxes: [] });
    apiMocks.forgotPassword.mockResolvedValue({ message: 'Reset token sent' });
    apiMocks.resetPassword.mockResolvedValue({ message: 'Password reset successfully.' });
    apiMocks.mfaSetup.mockResolvedValue({
      secret: 'SECRET',
      provisioning_uri: 'otpauth://totp/RetailIQ:owner@example.com?secret=SECRET',
      message: 'Verify the MFA code to complete setup.',
    });
    apiMocks.mfaVerify.mockResolvedValue({ message: 'MFA enabled successfully' });
  });

  const renderPath = (path: string, element: React.ReactNode, redirectTo?: string) => {
    document.body.innerHTML = '';
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={path} element={redirectTo ? <Navigate to={redirectTo} replace /> : element} />
            <Route path={routes.settingsProfile} element={<StoreProfilePage />} />
            <Route path={routes.settingsCategories} element={<StoreCategoriesPage />} />
            <Route path={routes.settingsTax} element={<StoreTaxConfigPage />} />
            <Route path={routes.settingsSecurity} element={<SecurityPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders canonical settings routes', async () => {
    renderPath(routes.settingsProfile, <StoreProfilePage />);
    expect(await screen.findByRole('heading', { name: /^Store profile$/i })).toBeTruthy();

    renderPath(routes.settingsCategories, <StoreCategoriesPage />);
    expect(await screen.findByRole('heading', { name: /^Categories$/i })).toBeTruthy();

    renderPath(routes.settingsTax, <StoreTaxConfigPage />);
    expect(await screen.findByRole('heading', { name: /^Tax config$/i })).toBeTruthy();

    renderPath(routes.settingsSecurity, <SecurityPage />);
    expect(await screen.findByRole('heading', { name: /^Security \/ MFA$/i })).toBeTruthy();
  });

  it('keeps legacy store and security routes working through redirects', async () => {
    renderPath(routes.legacyStoreProfile, <StoreProfilePage />, routes.settingsProfile);
    expect(await screen.findByRole('heading', { name: /^Store profile$/i })).toBeTruthy();

    renderPath(routes.legacyStoreCategories, <StoreCategoriesPage />, routes.settingsCategories);
    expect(await screen.findByRole('heading', { name: /^Categories$/i })).toBeTruthy();

    renderPath(routes.legacyStoreTaxConfig, <StoreTaxConfigPage />, routes.settingsTax);
    expect(await screen.findByRole('heading', { name: /^Tax config$/i })).toBeTruthy();

    renderPath(routes.legacySecurity, <SecurityPage />, routes.settingsSecurity);
    expect(await screen.findByRole('heading', { name: /^Security \/ MFA$/i })).toBeTruthy();
  });

  it('supports category editing and delete-cascade errors', async () => {
    const user = userEvent.setup();
    apiMocks.updateCategory.mockResolvedValue({
      category_id: 10,
      store_id: 1,
      name: 'Pantry Staples',
      color_tag: 'green',
      is_active: true,
      gst_rate: 12.5,
    });
    apiMocks.deleteCategory.mockRejectedValue({
      message: 'Cannot delete category with existing products',
      status: 422,
    });

    renderPath(routes.settingsCategories, <StoreCategoriesPage />);

    expect(await screen.findByText('Groceries')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(await screen.findByRole('heading', { name: /^Edit category$/i })).toBeTruthy();
    const editDialog = screen.getByRole('dialog');
    expect(within(editDialog).getByDisplayValue('Groceries')).toBeTruthy();

    await user.clear(within(editDialog).getByDisplayValue('Groceries'));
    await user.type(within(editDialog).getByLabelText(/^Name$/i), 'Pantry Staples');
    await user.click(screen.getByRole('button', { name: /^Save changes$/i }));

    expect(apiMocks.updateCategory).toHaveBeenCalledWith(10, expect.objectContaining({
      name: 'Pantry Staples',
      color_tag: 'green',
      gst_rate: 5,
      is_active: true,
    }));

    await user.click(screen.getByRole('button', { name: /^Delete$/i }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await user.type(screen.getByPlaceholderText(/DELETE/i), 'DELETE');
    await user.click(screen.getByRole('button', { name: /^Delete category$/i }));
    expect(await screen.findByText(/cannot delete category with existing products/i)).toBeTruthy();
  });

  it('renders the MFA provisioning QR and verifies the setup flow', async () => {
    const user = userEvent.setup();

    renderPath(routes.settingsSecurity, <SecurityPage />);

    await user.type(screen.getByLabelText(/^Current password$/i), 'CurrentPassword123!');
    await user.click(screen.getByRole('button', { name: /^Generate MFA secret$/i }));

    expect(await screen.findByRole('img', { name: /provisioning qr code/i })).toBeTruthy();
    expect(screen.getByText('SECRET')).toBeTruthy();

    await user.type(screen.getByLabelText(/^Authenticator code$/i), '123456');
    await user.click(screen.getByRole('button', { name: /^Verify MFA$/i }));

    expect(apiMocks.mfaVerify).toHaveBeenCalledWith({
      code: '123456',
      mfa_code: '123456',
    });
    expect(await screen.findByText(/mfa enabled successfully/i)).toBeTruthy();
  });
});
