import type { Permission } from './session';

// Admin modules from ROADMAP.md Section 5. `built` modules have their own route folder; the rest
// show a placeholder page. The sidebar only lists modules the admin's role allows.
export interface AdminModule {
  slug: string;
  label: string;
  summary: string;
  permission?: Permission;
  built?: boolean;
}

export const MODULES: AdminModule[] = [
  { slug: '', label: 'Dashboard', summary: 'Sales, orders by status, top products, low-stock alerts.', built: true },
  {
    slug: 'orders',
    label: 'Orders',
    summary: 'Filter, update status, notes, invoices, courier booking, refunds.',
    permission: 'orders:read',
    built: true,
  },
  {
    slug: 'manual-orders',
    label: 'Manual orders',
    summary: 'Enter orders taken on Facebook, WhatsApp or by phone.',
    permission: 'orders:write',
  },
  {
    slug: 'products',
    label: 'Products',
    summary: 'Bangla and English fields, variants, images, SEO, CSV import.',
    permission: 'products:read',
    built: true,
  },
  {
    slug: 'categories',
    label: 'Categories',
    summary: 'Create, edit, reorder and set images.',
    permission: 'products:read',
    built: true,
  },
  {
    slug: 'inventory',
    label: 'Inventory',
    summary: 'Adjust stock with a reason, stock history, low-stock levels.',
    // Everyone who sees products can see stock; only inventory:write can change it.
    permission: 'products:read',
    built: true,
  },
  {
    slug: 'customers',
    label: 'Customers',
    summary: 'Profile, order history, delivery success rate, block.',
    permission: 'customers:read',
  },
  { slug: 'coupons', label: 'Coupons', summary: 'Create coupons, set rules, see usage.', permission: 'settings:write' },
  {
    slug: 'content',
    label: 'Content',
    summary: 'Banners, countdown, homepage sections, FAQ, pages.',
    permission: 'products:write',
  },
  { slug: 'reviews', label: 'Reviews', summary: 'Approve or reject customer reviews.', permission: 'products:write' },
  {
    slug: 'settings',
    label: 'Settings',
    summary: 'Delivery zones, payment methods, courier and SMS keys.',
    permission: 'settings:write',
  },
  { slug: 'staff', label: 'Staff', summary: 'Roles, invites, disable accounts.', permission: 'staff:manage' },
  {
    slug: 'reports',
    label: 'Reports',
    summary: 'Sales by day, product and category; payment and courier performance.',
    permission: 'audit:read',
  },
];

export const findModule = (slug: string) => MODULES.find((m) => m.slug !== '' && m.slug === slug);
export const visibleModules = (permissions: readonly string[]) =>
  MODULES.filter((m) => !m.permission || permissions.includes(m.permission));
