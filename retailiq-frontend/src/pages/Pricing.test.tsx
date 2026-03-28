/* @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PricingPage from './Pricing';

const toastMock = vi.fn();
const updateRulesMutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: any) =>
    selector({
      addToast: toastMock,
    }),
}));

vi.mock('@/hooks/aiTools', () => ({
  useAiPricingOptimizeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/pricing', () => ({
  usePricingSuggestionsQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  usePricingRulesQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useApplySuggestionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDismissSuggestionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdatePricingRulesMutation: () => updateRulesMutation,
  usePriceHistoryQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
}));

describe('PricingPage', () => {
  it('rejects invalid rule JSON before calling the backend', async () => {
    const user = userEvent.setup();

    render(<PricingPage />);

    await user.click(screen.getByRole('button', { name: /rules/i }));
    await user.type(screen.getByLabelText('Rule type'), 'margin_based');

    const textarea = document.querySelector('textarea');
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea as HTMLTextAreaElement, { target: { value: '{invalid json' } });

    await user.click(screen.getByRole('button', { name: /save rule/i }));

    expect(screen.getByText(/Expected property name/i)).toBeTruthy();
    expect(updateRulesMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
