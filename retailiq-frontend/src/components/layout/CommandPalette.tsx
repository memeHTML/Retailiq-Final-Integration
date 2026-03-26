import { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COMMAND_PALETTE_RECENTS_KEY } from '@/lib/constants';
import { routes } from '@/routes/routes';

type CommandItem = {
  label: string;
  description: string;
  to: string;
};

const commandItems: CommandItem[] = [
  { label: 'Dashboard', description: 'Overview and KPIs', to: routes.dashboard },
  { label: 'Smart Alerts', description: 'Critical store alerts', to: routes.smartAlerts },
  { label: 'Reports', description: 'Operational and financial reports', to: routes.reports },
  { label: 'Financial Calendar', description: 'Upcoming finance dates', to: routes.financialCalendar },
  { label: 'POS / New Sale', description: 'Create a new transaction', to: routes.pos },
  { label: 'Transactions', description: 'Sales and returns', to: routes.transactions },
  { label: 'Returns', description: 'Return and refund operations', to: routes.returns },
  { label: 'Inventory', description: 'Products and stock', to: routes.inventory },
  { label: 'Stock Audit', description: 'Counted stock reconciliation', to: routes.stockAudit },
  { label: 'Receipts Queue', description: 'Receipt processing queue', to: routes.receiptsQueue },
  { label: 'Vision OCR', description: 'OCR upload and review', to: routes.visionOcr },
  { label: 'Suppliers', description: 'Supplier records and product links', to: routes.suppliers },
  { label: 'Purchase Orders', description: 'Drafts, receiving, and PDF export', to: routes.purchaseOrders },
  { label: 'Marketplace', description: 'Supplier marketplace tools', to: routes.marketplace },
  { label: 'Customers', description: 'Customer records', to: routes.customers },
  { label: 'Loyalty', description: 'Rewards program', to: routes.loyalty },
  { label: 'Credit', description: 'Customer credit accounts', to: routes.credit },
  { label: 'WhatsApp', description: 'Messaging and campaigns', to: routes.whatsapp },
  { label: 'Analytics', description: 'Reports and insights', to: routes.analytics },
  { label: 'Market Intelligence', description: 'Competitor and price signals', to: routes.marketIntelligence },
  { label: 'Financials', description: 'Ledger and treasury', to: routes.finance },
  { label: 'GST / Tax', description: 'Tax and compliance', to: routes.financeGst },
  { label: 'E-Invoicing', description: 'Invoice generation and status', to: routes.financeEinvoice },
  { label: 'AI Assistant', description: 'Ask the assistant', to: routes.ai },
  { label: 'Store Profile', description: 'Business settings', to: routes.storeProfile },
  { label: 'Store Categories', description: 'Category management', to: routes.storeCategories },
  { label: 'Tax Config', description: 'Store tax rules', to: routes.storeTaxConfig },
  { label: 'MFA', description: 'Security and verification setup', to: routes.mfa },
  { label: 'Operations', description: 'Ops and maintenance tooling', to: routes.operations },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(COMMAND_PALETTE_RECENTS_KEY);
      if (!raw) {
        setRecentItems([]);
        return;
      }

      const parsed = JSON.parse(raw) as CommandItem[];
      setRecentItems(Array.isArray(parsed) ? parsed.filter((item) => item && item.to) : []);
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
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return commandItems;
    }

    return commandItems.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle));
  }, [search]);

  const persistRecentItem = (item: CommandItem) => {
    const nextRecent = [item, ...recentItems.filter((recent) => recent.to !== item.to)].slice(0, 6);
    setRecentItems(nextRecent);
    window.localStorage.setItem(COMMAND_PALETTE_RECENTS_KEY, JSON.stringify(nextRecent));
  };

  const handleSelect = (item: CommandItem) => {
    persistRecentItem(item);
    navigate(item.to);
    onOpenChange(false);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="command-palette" role="dialog" aria-modal="true" aria-label="Quick search" onClick={() => onOpenChange(false)}>
      <div className="command-palette__panel" onClick={(event) => event.stopPropagation()}>
        <Command className="w-full">
          <div className="command-palette__search">
            <Search size={16} />
            <Command.Input
              autoFocus
              onValueChange={setSearch}
              placeholder="Search pages and actions..."
              className="w-full border-0 bg-transparent text-text outline-none placeholder:text-text-muted"
            />
          </div>

          <Command.List className="command-palette__list">
            <Command.Empty className="command-palette__section">
              <div className="command-palette__item">
                <div>No results found</div>
                <span>Try a different page, action, or report name.</span>
              </div>
            </Command.Empty>

            {!search.trim() && recentItems.length > 0 ? (
              <>
                <div className="command-palette__section-title">Recent</div>
                <Command.Group className="command-palette__section">
                  {recentItems.map((item) => (
                    <Command.Item
                      key={`recent-${item.to}`}
                      value={`${item.label} ${item.description}`}
                      className="command-palette__item"
                      onSelect={() => handleSelect(item)}
                    >
                      <div>{item.label}</div>
                      <span>{item.description}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            ) : null}

            <>
              {!search.trim() ? <div className="command-palette__section-title">Pages and actions</div> : null}
              <Command.Group className="command-palette__section">
                {filtered.map((item) => (
                  <Command.Item
                    key={item.to}
                    value={`${item.label} ${item.description}`}
                    className="command-palette__item"
                    onSelect={() => handleSelect(item)}
                  >
                    <div>{item.label}</div>
                    <span>{item.description}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
