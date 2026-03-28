import { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COMMAND_PALETTE_RECENTS_KEY } from '@/lib/constants';
import { authStore } from '@/stores/authStore';
import { canonicalNavItemForPath, canonicalizePathname, flattenedNavItems, type ShellNavItem, type ShellRole } from './navigation';

type CommandItem = {
  label: string;
  description: string;
  to: string;
};

type RecentCommandItem = Pick<ShellNavItem, 'label' | 'description' | 'to'>;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const role = authStore((state) => state.role);
  const [search, setSearch] = useState('');
  const [recentItems, setRecentItems] = useState<RecentCommandItem[]>([]);
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

      const parsed = JSON.parse(raw) as Array<Partial<CommandItem> | null | undefined>;
      const canonicalRecents = Array.isArray(parsed)
        ? parsed
            .map((item): RecentCommandItem | null => {
              if (!item?.to) {
                return null;
              }

              const canonicalItem = canonicalNavItemForPath(canonicalizePathname(item.to), role as ShellRole);
              return canonicalItem
                ? { label: canonicalItem.label, description: canonicalItem.description, to: canonicalItem.to }
                : null;
            })
            .filter((item): item is RecentCommandItem => Boolean(item))
            .filter((item, index, items) => items.findIndex((recent) => recent.to === item.to) === index)
        : [];
      setRecentItems(canonicalRecents);
      window.localStorage.setItem(COMMAND_PALETTE_RECENTS_KEY, JSON.stringify(canonicalRecents));
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

  const commandItems = useMemo<CommandItem[]>(
    () => flattenedNavItems(role as ShellRole).map((item) => ({ label: item.label, description: item.description, to: item.to })),
    [role],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return commandItems;
    }

    return commandItems.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(needle));
  }, [commandItems, search]);

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
