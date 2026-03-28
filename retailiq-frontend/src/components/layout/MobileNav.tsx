import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, FileText, Home, ShoppingCart, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';

const items = [
  { label: 'Home', to: '/dashboard', icon: Home },
  { label: 'Inventory', to: '/inventory', icon: Boxes },
  { label: 'POS', to: routes.pos, icon: ShoppingCart },
  { label: 'Transactions', to: routes.transactions, icon: FileText },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
];

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn('mobile-nav__item', isActive && 'mobile-nav__item--active')}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
