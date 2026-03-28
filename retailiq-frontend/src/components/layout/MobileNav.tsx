import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { uiStore } from '@/stores/uiStore';
import { authStore } from '@/stores/authStore';
import { primaryMobileNavItems, sidebarNavGroups, type ShellRole } from './navigation';
import { Sheet } from '@/components/ui/Sheet';

export function MobileNav() {
  const open = uiStore((state) => state.mobileNavOpen);
  const setOpen = uiStore((state) => state.setMobileNavOpen);
  const role = authStore((state) => state.role);
  const groups = sidebarNavGroups(role as ShellRole);
  const items = primaryMobileNavItems(role as ShellRole);

  return (
    <>
      <nav className="mobile-nav" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('mobile-nav__item', isActive && 'mobile-nav__item--active')}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Sheet open={open} onOpenChange={setOpen} title="Navigation" description="Jump to any RetailIQ section" side="left">
        <div className="grid gap-5">
          {groups.map((group) => (
            <section key={group.title} className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{group.title}</div>
              <div className="grid gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => cn('sidebar__item', 'h-11', isActive && 'sidebar__item--active')}
                    >
                      <Icon className="sidebar__item-icon" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Sheet>
    </>
  );
}
