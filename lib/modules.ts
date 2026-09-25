// Admin modules from ROADMAP.md Section 5. Each one is a placeholder page until it is built.
export const MODULES = [
  { slug: '', label: 'Dashboard', summary: 'Sales, orders by status, top products, low-stock alerts.' },
  { slug: 'orders', label: 'Orders', summary: 'Filter, update status, notes, invoices, courier booking, refunds.' },
  { slug: 'manual-orders', label: 'Manual orders', summary: 'Enter orders taken on Facebook, WhatsApp or by phone.' },
  { slug: 'products', label: 'Products', summary: 'Bangla and English fields, variants, images, SEO, CSV import.' },
  { slug: 'categories', label: 'Categories', summary: 'Create, edit, reorder and set images.' },
  { slug: 'inventory', label: 'Inventory', summary: 'Adjust stock with a reason, stock history, low-stock levels.' },
  { slug: 'customers', label: 'Customers', summary: 'Profile, order history, delivery success rate, block.' },
  { slug: 'coupons', label: 'Coupons', summary: 'Create coupons, set rules, see usage.' },
  { slug: 'content', label: 'Content', summary: 'Banners, countdown, homepage sections, FAQ, pages.' },
  { slug: 'reviews', label: 'Reviews', summary: 'Approve or reject customer reviews.' },
  { slug: 'settings', label: 'Settings', summary: 'Delivery zones, payment methods, courier and SMS keys.' },
  { slug: 'staff', label: 'Staff', summary: 'Roles, invites, disable accounts.' },
  {
    slug: 'reports',
    label: 'Reports',
    summary: 'Sales by day, product and category; payment and courier performance.',
  },
] as const;

export const findModule = (slug: string) => MODULES.find((m) => m.slug !== '' && m.slug === slug);
