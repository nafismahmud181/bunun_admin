import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { dhakaDateTime } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Audit log' };

// Filters by group; the API matches an action prefix ending in ".".
const GROUPS: [string, string][] = [
  ['', 'All actions'],
  ['auth.', 'Sign-in and passwords'],
  ['order.', 'Orders'],
  ['product.', 'Products'],
  ['variant.', 'Variants'],
  ['image.', 'Photos'],
  ['category.', 'Categories'],
  ['inventory.', 'Stock'],
  ['customer.', 'Customers'],
  ['settings.', 'Settings'],
  ['zone.', 'Delivery zones'],
  ['blocked.', 'Block list'],
  ['staff.', 'Staff'],
];
const select = 'h-9 rounded-md border bg-background px-2 text-sm';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Where an entry points, when there is a page for it. */
function entityLink(type: string | null, id: string | null) {
  if (!type || !id) return null;
  if (type === 'order') return `/orders/${id}`;
  if (type === 'product') return `/products/${id}`;
  if (type === 'customer') return `/customers/${id}`;
  if (type === 'variant') return `/inventory/history?sku=${encodeURIComponent(id)}`;
  return null;
}

/** A short readable summary of an entry's details. */
function details(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const text = JSON.stringify(data);
  return text.length > 160 ? text.slice(0, 157) + '…' : text;
}

export default async function AuditPage({ searchParams }: PageProps<'/audit'>) {
  await requireAdmin('audit:read');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const adminId = Number(one('adminId')) || undefined;
  const action = GROUPS.some(([g]) => g === one('action')) ? one('action') : '';
  const from = DAY.test(one('from')) ? one('from') : '';
  const to = DAY.test(one('to')) ? one('to') : '';
  const page = Math.max(1, Number(one('page')) || 1);
  const { data, error } = await (
    await adminApi()
  ).GET('/api/v1/admin/audit', {
    params: {
      query: {
        ...(adminId && { adminId }),
        ...(action && { action }),
        ...(from && { from }),
        ...(to && { to }),
        page,
        limit: 50,
      },
      header: {},
    },
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const href = (p: number) => {
    const u = new URLSearchParams(
      Object.entries({ adminId: adminId ? String(adminId) : '', action, from, to }).filter(([, v]) => v),
    );
    if (p > 1) u.set('page', String(p));
    return `/audit?${u}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">Every change made in the admin panel, and every sign-in.</p>
      </div>
      <form className="flex flex-wrap items-end gap-2" action="/audit">
        <select name="adminId" defaultValue={adminId ?? ''} className={select} aria-label="Person">
          <option value="">Everyone</option>
          {data?.admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select name="action" defaultValue={action} className={select} aria-label="Action">
          {GROUPS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="text-xs text-muted-foreground">
          From
          <Input type="date" name="from" defaultValue={from} className="bg-background" />
        </label>
        <label className="text-xs text-muted-foreground">
          To
          <Input type="date" name="to" defaultValue={to} className="bg-background" />
        </label>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the audit log.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>About</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nothing matches.
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((e) => {
                const link = entityLink(e.entityType, e.entityId);
                const about = e.entityType ? `${e.entityType}${e.entityId ? ` ${e.entityId}` : ''}` : '';
                return (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{dhakaDateTime(e.at)}</TableCell>
                    <TableCell>{e.admin ?? 'System'}</TableCell>
                    <TableCell className="font-mono text-xs">{e.action}</TableCell>
                    <TableCell>
                      {link ? (
                        <Link href={link} className="text-primary hover:underline">
                          {about}
                        </Link>
                      ) : (
                        about
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-md truncate font-mono text-xs text-muted-foreground"
                      title={JSON.stringify(e.data)}
                    >
                      {details(e.data)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.ip}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href(page - 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Newer
              </Link>
            )}
            {page < pages && (
              <Link href={href(page + 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Older
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
