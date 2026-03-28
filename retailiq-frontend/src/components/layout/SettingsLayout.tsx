import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Boxes, FileText, LockKeyhole, Store } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { authStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';

type SettingsSection = 'profile' | 'categories' | 'tax' | 'security';

type SettingsLayoutProps = {
  active: SettingsSection;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const sections = [
  { key: 'profile' as const, label: 'Store Profile', to: routes.settingsProfile, icon: Store, ownerOnly: false },
  { key: 'categories' as const, label: 'Categories', to: routes.settingsCategories, icon: Boxes, ownerOnly: true },
  { key: 'tax' as const, label: 'Tax Configuration', to: routes.settingsTax, icon: FileText, ownerOnly: true },
  { key: 'security' as const, label: 'Security & MFA', to: routes.settingsSecurity, icon: LockKeyhole, ownerOnly: false },
];

export function SettingsLayout({ active, title, subtitle, actions, children }: SettingsLayoutProps) {
  const role = authStore((state) => state.role);
  const visibleSections = sections.filter((section) => !section.ownerOnly || role === 'owner');

  return (
    <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
      <aside className="card" style={{ position: 'sticky', top: '1rem', overflow: 'hidden' }}>
        <div className="card__header">
          <strong>Settings</strong>
        </div>
        <div className="card__body">
          <nav className="stack" aria-label="Settings sections">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              return (
                <NavLink
                  key={section.to}
                  to={section.to}
                  className={({ isActive }) => cn('sidebar__item', (isActive || active === section.key) && 'sidebar__item--active')}
                  style={{ minHeight: '42px' }}
                >
                  <Icon className="sidebar__item-icon" />
                  <span>{section.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <PageFrame title={title} subtitle={subtitle} actions={actions}>
        {children}
      </PageFrame>
    </div>
  );
}

export type { SettingsSection };
