import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAiPricingOptimizeMutation } from '@/hooks/aiTools';
import {
  useApplySuggestionMutation,
  useDismissSuggestionMutation,
  usePriceHistoryQuery,
  usePricingRulesQuery,
  usePricingSuggestionsQuery,
  useUpdatePricingRulesMutation,
} from '@/hooks/pricing';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import type { PriceHistoryEntry, PricingRule, PricingSuggestion } from '@/types/models';

const formatPercent = (value: number | string | null | undefined) => {
  if (value == null || value === '') {
    return '-';
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return '-';
  }

  const sign = numeric > 0 ? '+' : '';
  return `${sign}${numeric.toFixed(2)}%`;
};

const confidenceLabel = (suggestion: PricingSuggestion) => {
  const value = suggestion.confidence_score ?? suggestion.confidence;
  if (value == null) {
    return '-';
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return '-';
  }

  return `${Math.round(numeric * 100)}%`;
};

const suggestionVariant = (suggestionType: string) => {
  if (suggestionType === 'RAISE') return 'success' as const;
  if (suggestionType === 'LOWER') return 'warning' as const;
  return 'secondary' as const;
};

export default function PricingPage() {
  const addToast = uiStore((state) => state.addToast);
  const suggestionsQuery = usePricingSuggestionsQuery();
  const rulesQuery = usePricingRulesQuery();
  const applySuggestionMutation = useApplySuggestionMutation();
  const dismissSuggestionMutation = useDismissSuggestionMutation();
  const updateRulesMutation = useUpdatePricingRulesMutation();
  const optimizePricingMutation = useAiPricingOptimizeMutation();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'rules' | 'history' | 'optimize'>('suggestions');
  const [confirmAction, setConfirmAction] = useState<{ type: 'apply' | 'dismiss'; id: number } | null>(null);
  const [historyProductId, setHistoryProductId] = useState('');
  const [optimizeProductIds, setOptimizeProductIds] = useState('');
  const [optimizeResult, setOptimizeResult] = useState<unknown>(null);
  const [ruleForm, setRuleForm] = useState({
    rule_type: '',
    parametersJson: '{}',
    is_active: true,
  });
  const [ruleFormError, setRuleFormError] = useState<string | null>(null);

  const historyQuery = usePriceHistoryQuery(historyProductId ? Number(historyProductId) : 0);
  const suggestions = Array.isArray(suggestionsQuery.data) ? suggestionsQuery.data : [];
  const pricingRules: PricingRule[] = Array.isArray(rulesQuery.data) ? rulesQuery.data : [];

  if (suggestionsQuery.isError) {
    return (
      <PageFrame title="Pricing Engine">
        <ErrorState error={normalizeApiError(suggestionsQuery.error)} onRetry={() => void suggestionsQuery.refetch()} />
      </PageFrame>
    );
  }

  const onConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    try {
      if (confirmAction.type === 'apply') {
        await applySuggestionMutation.mutateAsync(confirmAction.id);
        addToast({ title: 'Suggestion applied', message: `Pricing suggestion ${confirmAction.id} was applied.`, variant: 'success' });
      } else {
        await dismissSuggestionMutation.mutateAsync(confirmAction.id);
        addToast({ title: 'Suggestion dismissed', message: `Pricing suggestion ${confirmAction.id} was dismissed.`, variant: 'info' });
      }
      setConfirmAction(null);
    } catch (error) {
      addToast({ title: 'Pricing action failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const onSelectRule = (rule: PricingRule) => {
    setRuleFormError(null);
    setRuleForm({
      rule_type: rule.rule_type,
      parametersJson: JSON.stringify(rule.parameters ?? {}, null, 2),
      is_active: rule.is_active,
    });
  };

  const onNewRule = () => {
    setRuleFormError(null);
    setRuleForm({
      rule_type: '',
      parametersJson: '{}',
      is_active: true,
    });
  };

  const onSaveRules = async () => {
    const ruleType = ruleForm.rule_type.trim();
    if (!ruleType) {
      setRuleFormError('Rule type is required.');
      return;
    }

    let parameters: Record<string, unknown>;

    try {
      const parsed = JSON.parse(ruleForm.parametersJson || '{}') as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Parameters must be a JSON object.');
      }
      parameters = parsed as Record<string, unknown>;
    } catch (error) {
      setRuleFormError(error instanceof Error ? error.message : 'Parameters must be valid JSON.');
      return;
    }

    try {
      await updateRulesMutation.mutateAsync({
        rule_type: ruleType,
        parameters,
        is_active: ruleForm.is_active,
      });
      setRuleFormError(null);
      addToast({ title: 'Rule saved', message: 'Pricing rule was updated successfully.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Rule update failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const onOptimizePricing = async () => {
    const productIds = optimizeProductIds.split(',').map((value) => value.trim()).filter(Boolean);
    if (productIds.length === 0) {
      addToast({ title: 'Product IDs required', message: 'Enter one or more product IDs to call the AI pricing optimizer.', variant: 'warning' });
      return;
    }

    try {
      const result = await optimizePricingMutation.mutateAsync({ product_ids: productIds });
      setOptimizeResult(result);
      addToast({ title: 'Optimization complete', message: `Received AI pricing output for ${productIds.length} product(s).`, variant: 'success' });
    } catch (error) {
      addToast({ title: 'Optimization failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  return (
    <PageFrame title="Pricing Engine" subtitle="Pricing suggestions, rules, price history, and AI v2 optimization flows.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'suggestions' ? 'primary' : 'ghost'} onClick={() => setActiveTab('suggestions')}>
            Suggestions
          </Button>
          <Button variant={activeTab === 'rules' ? 'primary' : 'ghost'} onClick={() => setActiveTab('rules')}>
            Rules
          </Button>
          <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')}>
            History
          </Button>
          <Button variant={activeTab === 'optimize' ? 'primary' : 'ghost'} onClick={() => setActiveTab('optimize')}>
            AI Optimize
          </Button>
        </div>

        {activeTab === 'suggestions' ? (
          suggestionsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={280} />
          ) : suggestions.length === 0 ? (
            <EmptyState title="No pending suggestions" body="The backend returned no pending pricing suggestions." />
          ) : (
            <DataTable<PricingSuggestion>
              columns={[
                { key: 'product_name', header: 'Product', render: (row) => row.product_name },
                { key: 'current_price', header: 'Current', render: (row) => `Rs ${Number(row.current_price).toLocaleString()}` },
                { key: 'suggested_price', header: 'Suggested', render: (row) => `Rs ${Number(row.suggested_price).toLocaleString()}` },
                {
                  key: 'price_change_pct',
                  header: 'Change',
                  render: (row) => <Badge variant={row.price_change_pct == null ? 'secondary' : row.price_change_pct >= 0 ? 'success' : 'warning'}>{formatPercent(row.price_change_pct)}</Badge>,
                },
                {
                  key: 'suggestion_type',
                  header: 'Type',
                  render: (row) => <Badge variant={suggestionVariant(row.suggestion_type)}>{row.suggestion_type}</Badge>,
                },
                { key: 'confidence', header: 'Confidence', render: (row) => confidenceLabel(row) },
                {
                  key: 'current_margin_pct',
                  header: 'Current Margin',
                  render: (row) => formatPercent(row.current_margin_pct),
                },
                {
                  key: 'suggested_margin_pct',
                  header: 'Suggested Margin',
                  render: (row) => formatPercent(row.suggested_margin_pct),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <Badge variant={row.status === 'PENDING' ? 'warning' : 'secondary'}>{row.status}</Badge>,
                },
                { key: 'reason', header: 'Reason', render: (row) => row.reason },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setConfirmAction({ type: 'apply', id: row.id })}>Apply</Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmAction({ type: 'dismiss', id: row.id })}>Dismiss</Button>
                    </div>
                  ),
                },
              ]}
              data={suggestions}
            />
          )
        ) : null}

        {activeTab === 'rules' ? (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {rulesQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : rulesQuery.isError ? (
                <ErrorState error={normalizeApiError(rulesQuery.error)} onRetry={() => void rulesQuery.refetch()} />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={onNewRule}>
                      New rule
                    </Button>
                    <span className="text-sm text-gray-500">
                      Rules are upserted by `rule_type` with backend-managed `parameters` and `is_active`.
                    </span>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    {pricingRules.length === 0 ? (
                      <EmptyState
                        title="No pricing rules"
                        body="The backend returned no rules for this store. Use the form to upsert a rule."
                      />
                    ) : (
                      <DataTable<PricingRule>
                        columns={[
                          { key: 'rule_type', header: 'Rule Type', render: (row) => row.rule_type },
                          {
                            key: 'parameters',
                            header: 'Parameters',
                            render: (row) => (
                              <pre className="max-w-[30rem] whitespace-pre-wrap break-words text-xs text-gray-600">
                                {JSON.stringify(row.parameters, null, 2)}
                              </pre>
                            ),
                          },
                          {
                            key: 'is_active',
                            header: 'Status',
                            render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
                          },
                          {
                            key: 'created_at',
                            header: 'Created',
                            render: (row) => row.created_at,
                          },
                          {
                            key: 'actions',
                            header: 'Actions',
                            render: (row) => (
                              <Button size="sm" variant="secondary" onClick={() => onSelectRule(row)}>
                                Edit
                              </Button>
                            ),
                          },
                        ]}
                        data={pricingRules}
                        emptyMessage="No pricing rules returned by the backend."
                      />
                    )}

                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle>{ruleForm.rule_type ? `Edit ${ruleForm.rule_type}` : 'Upsert rule'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          label="Rule type"
                          value={ruleForm.rule_type}
                          onChange={(event) => setRuleForm((current) => ({ ...current, rule_type: event.target.value }))}
                          placeholder="e.g. margin_based"
                        />
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Parameters JSON</label>
                          <Textarea
                            value={ruleForm.parametersJson}
                            onChange={(event) => setRuleForm((current) => ({ ...current, parametersJson: event.target.value }))}
                            rows={10}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Enter a JSON object. The backend stores this as the rule parameters payload.
                        </p>
                        <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={ruleForm.is_active}
                            onChange={(event) => setRuleForm((current) => ({ ...current, is_active: event.target.checked }))}
                          />
                          Active
                        </label>
                        {ruleFormError ? <p className="text-sm text-red-600">{ruleFormError}</p> : null}
                          <Button onClick={() => void onSaveRules()} loading={updateRulesMutation.isPending}>
                            Save rule
                          </Button>
                        </CardContent>
                      </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'history' ? (
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Input label="Product ID" value={historyProductId} onChange={(event) => setHistoryProductId(event.target.value)} placeholder="Enter a product ID" />
              </div>
              {!historyProductId ? (
                <EmptyState title="Product required" body="Enter a product ID to inspect historical pricing changes." />
              ) : historyQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : historyQuery.isError ? (
                <ErrorState error={normalizeApiError(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />
              ) : (
                <DataTable<PriceHistoryEntry>
                  columns={[
                    { key: 'changed_at', header: 'Changed At', render: (row) => row.changed_at },
                    { key: 'old_price', header: 'Old Price', render: (row) => (row.old_price == null ? '-' : `Rs ${row.old_price.toLocaleString()}`) },
                    { key: 'new_price', header: 'New Price', render: (row) => (row.new_price == null ? '-' : `Rs ${row.new_price.toLocaleString()}`) },
                    { key: 'reason', header: 'Reason', render: (row) => row.reason || '-' },
                    { key: 'changed_by', header: 'Changed By', render: (row) => (row.changed_by == null ? '-' : String(row.changed_by)) },
                  ]}
                  data={historyQuery.data ?? []}
                  emptyMessage="No price history exists for this product."
                />
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'optimize' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI v2 Pricing Optimizer</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Product IDs"
                  value={optimizeProductIds}
                  onChange={(event) => setOptimizeProductIds(event.target.value)}
                  placeholder="Comma-separated product IDs"
                />
                <Button onClick={() => void onOptimizePricing()} loading={optimizePricingMutation.isPending}>
                  Optimize pricing
                </Button>
              </CardContent>
            </Card>

            {optimizeResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                    {JSON.stringify(optimizeResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="No optimization run yet" body="Call the AI v2 optimizer to review the backend pricing output." />
            )}
          </div>
        ) : null}
      </div>

      {confirmAction ? (
        <ConfirmDialog
          open
          title={confirmAction.type === 'apply' ? 'Apply pricing suggestion' : 'Dismiss pricing suggestion'}
          body={confirmAction.type === 'apply' ? 'This will apply the backend pricing recommendation.' : 'This will dismiss the backend pricing recommendation.'}
          onConfirm={() => void onConfirmAction()}
          onCancel={() => setConfirmAction(null)}
          confirmLabel={confirmAction.type === 'apply' ? 'Apply' : 'Dismiss'}
        />
      ) : null}
    </PageFrame>
  );
}
