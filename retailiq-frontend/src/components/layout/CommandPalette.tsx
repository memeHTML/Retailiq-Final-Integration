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
  { label: 'Inventory', description: 'Products and stock', to: routes.inventory },
  { label: 'Transactions', description: 'Sales and returns', to: routes.transactions },
  { label: 'Customers', description: 'Customer records', to: routes.customers },
  { label: 'Analytics', description: 'Reports and insights', to: routes.analytics },
  { label: 'Financials', description: 'Ledger and treasury', to: routes.finance },
  { label: 'AI Assistant', description: 'Ask the assistant', to: routes.ai },
  { label: 'Store Profile', description: 'Business settings', to: routes.settings },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
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

    return items.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle));
  }, [query]);

  if (!open) {
    return null;
  }

  return (
    <div className="command-palette" role="dialog" aria-modal="true" aria-label="Quick search" onClick={() => onOpenChange(false)}>
      <div className="command-palette__panel" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette__search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…" autoFocus />
        </div>
        <div className="command-palette__list">
          {filtered.map((item) => (
            <button
              key={item.to}
              type="button"
              className="command-palette__item"
              onClick={() => {
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
  );
}
