import { describe, expect, it } from 'vitest';
import {
  canonicalNavItemForPath,
  canonicalizePathname,
  flattenedNavItems,
  resolveBreadcrumbs,
  resolvePageTitle,
  sidebarNavGroups,
} from './navigation';

describe('navigation helpers', () => {
  it('canonicalizes legacy aliases to canonical routes', () => {
    expect(canonicalizePathname('/developer')).toBe('/operations/developer');
    expect(canonicalizePathname('/i18n')).toBe('/settings/i18n');
    expect(canonicalizePathname('/events')).toBe('/financial-calendar');
  });

  it('prefers the most specific title match for nested routes', () => {
    expect(resolvePageTitle('/inventory/receipts')).toBe('Receipts');
    expect(resolvePageTitle('/inventory/barcodes')).toBe('Barcodes');
    expect(resolvePageTitle('/finance/einvoice')).toBe('E-Invoicing');
    expect(resolvePageTitle('/orders')).toBe('Orders');
  });

  it('builds canonical breadcrumbs for aliases and nested routes', () => {
    expect(resolveBreadcrumbs('/developer')).toEqual([
      { label: 'RetailIQ', to: '/dashboard' },
      { label: 'Developer', to: '/operations/developer' },
    ]);

    expect(resolveBreadcrumbs('/inventory/vision')).toEqual([
      { label: 'RetailIQ', to: '/dashboard' },
      { label: 'Vision OCR', to: '/inventory/vision' },
    ]);
  });

  it('filters owner-only navigation for staff users', () => {
    const staffItems = flattenedNavItems('staff');
    expect(staffItems.some((item) => item.label === 'Pricing')).toBe(false);
    expect(staffItems.some((item) => item.label === 'Business Analytics')).toBe(false);
    expect(staffItems.some((item) => item.label === 'Orders')).toBe(true);
    expect(sidebarNavGroups('staff').find((group) => group.title === 'Settings')?.items.some((item) => item.label === 'Internationalization')).toBe(true);
  });

  it('resolves canonical nav items for aliases', () => {
    expect(canonicalNavItemForPath('/developer', 'owner')?.to).toBe('/operations/developer');
    expect(canonicalNavItemForPath('/settings/i18n', 'staff')?.to).toBe('/settings/i18n');
  });
});
