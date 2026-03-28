import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { routes } from '@/routes/routes';

type CommandItem = {
  label: string;
  description: string;
  to: string;
};

const items: CommandItem[] = [
  { label: 'Dashboard', description: 'Overview and KPIs', to: routes.dashboard },
  { label: 'Smart Alerts', description: 'Operational alert center', to: routes.dashboardAlerts },
  { label: 'Financial Calendar', description: 'Events and deadlines', to: routes.dashboardCalendar },
  { label: 'Reports', description: 'Exports and launchers', to: routes.dashboardReports },
  { label: 'Point of sale', description: 'Create new sales', to: routes.pos },
  { label: 'Transactions', description: 'Sales and returns', to: routes.transactions },
  { label: 'Inventory', description: 'Products and stock', to: routes.inventory },
  { label: 'Inventory Sync', description: 'Offline snapshot and batch sync', to: routes.inventorySync },
  { label: 'Orders Hub', description: 'Sales, purchase orders, and marketplace shortcuts', to: routes.orders },
  { label: 'Omnichannel', description: 'Marketplace and WhatsApp hub', to: routes.omnichannel },
  { label: 'Customers', description: 'Customer records', to: routes.customers },
  { label: 'Analytics', description: 'Reports and insights', to: routes.analytics },
  { label: 'Financials', description: 'Ledger and treasury', to: routes.finance },
  { label: 'Finance Accounts', description: 'Financial account list', to: routes.financeAccounts },
  { label: 'Finance Credit Score', description: 'Merchant credit score', to: routes.financeCreditScore },
  { label: 'Finance KYC', description: 'Compliance status', to: routes.financeKyc },
  { label: 'AI Assistant', description: 'Ask the assistant', to: routes.ai },
  { label: 'AI Decisions', description: 'Recommended business actions', to: routes.decisions },
  { label: 'AI Tools', description: 'Recommendations and vision utilities', to: routes.aiTools },
  { label: 'Store Profile', description: 'Business settings', to: routes.settingsProfile },
  { label: 'Categories', description: 'Category management', to: routes.settingsCategories },
  { label: 'Tax Config', description: 'GST mappings', to: routes.settingsTax },
  { label: 'Security / MFA', description: 'Password and MFA', to: routes.settingsSecurity },
  { label: 'Forecasting', description: 'Demand forecast insights', to: routes.analyticsForecasting },
  { label: 'Pricing', description: 'Price suggestions and rules', to: routes.inventoryPricing },
  { label: 'Market Intelligence', description: 'Market signals and trends', to: routes.analyticsMarket },
  { label: 'Staff Performance', description: 'Team metrics and sessions', to: routes.analyticsStaff },
  { label: 'Offline Analytics', description: 'Snapshot and sync insights', to: routes.analyticsOffline },
];

const recentKey = 'retailiq-command-recent';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(recentKey);
      if (!raw) {
        setRecentItems([]);
        return;
      }

      const parsed = JSON.parse(raw) as string[];
      setRecentItems(parsed.map((to) => items.find((item) => item.to === to)).filter((item): item is CommandItem => Boolean(item)));
    } catch {
      setRecentItems([]);
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(true);
      }

      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }

    return [...items]
      .filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle))
      .sort((left, right) => {
        const leftExact = left.label.toLowerCase().startsWith(needle) ? 0 : 1;
        const rightExact = right.label.toLowerCase().startsWith(needle) ? 0 : 1;
        return leftExact - rightExact || left.label.localeCompare(right.label);
      });
  }, [query]);

  const persistRecent = (item: CommandItem) => {
    setRecentItems((current) => {
      const next = [item, ...current.filter((entry) => entry.to !== item.to)].slice(0, 5);
      try {
        window.localStorage.setItem(recentKey, JSON.stringify(next.map((entry) => entry.to)));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="command-palette" role="dialog" aria-modal="true" aria-label="Quick search" onClick={() => onOpenChange(false)}>
      <div className="command-palette__panel" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette__search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions..."
            autoFocus
          />
        </div>
        <div className="command-palette__list">
          {!query && recentItems.length > 0 ? (
            <div className="command-palette__section">
              <div className="command-palette__section-label">Recent</div>
              {recentItems.map((item) => (
                <button
                  key={`recent-${item.to}`}
                  type="button"
                  className="command-palette__item"
                  onClick={() => {
                    persistRecent(item);
                    navigate(item.to);
                    onOpenChange(false);
                  }}
                >
                  <div>{item.label}</div>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="command-palette__section">
            <div className="command-palette__section-label">{query ? 'Results' : 'All destinations'}</div>
          {filtered.map((item) => (
            <button
              key={item.to}
              type="button"
              className="command-palette__item"
              onClick={() => {
                persistRecent(item);
                navigate(item.to);
                onOpenChange(false);
              }}
            >
              <div>{item.label}</div>
              <span>{item.description}</span>
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
