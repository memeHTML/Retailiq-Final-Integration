import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, Home, ShoppingCart, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';

const items = [
  { label: 'Home', to: routes.dashboard, icon: Home },
  { label: 'Inventory', to: routes.inventory, icon: Boxes },
  { label: 'POS', to: routes.ordersPos, icon: ShoppingCart },
  { label: 'Customers', to: routes.customers, icon: Users },
  { label: 'Analytics', to: routes.analytics, icon: BarChart3 },
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
