import type { Metadata } from 'next';
import Link from 'next/link';
import OrdersTable from '@/components/orders/OrdersTable';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api/client';
import { STATUS_LABEL, type OrderStatus } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Orders' };

const TABS: { key: OrderStatus | 'open' | ''; label: string }[] = [
  { key: 'open', label: 'Open' },
  ...(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const).map((s) => ({
    key: s,
    label: STATUS_LABEL[s],
  })),
  { key: '', label: 'All' },
];
const STATUSES = new Set([
  'open',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function OrdersPage({ searchParams }: PageProps<'/orders'>) {
  await requireAdmin('orders:read');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  // Keep only valid values, so a hand-edited URL can't make the API refuse the request.
  const status = STATUSES.has(one('status'))
    ? (one('status') as OrderStatus | 'open')
    : sp.status === undefined
      ? 'open'
      : '';
  const q = one('q').slice(0, 100);
  const from = DAY.test(one('from')) ? one('from') : '';
  const to = DAY.test(one('to')) ? one('to') : '';
  const page = Math.max(1, Number(one('page')) || 1);

  const query = {
    ...(status && { status }),
    ...(q && { q }),
    ...(from && { from }),
    ...(to && { to }),
    page,
    limit: 25,
  };
  const { data, error } = await (await adminApi()).GET('/api/v1/admin/orders', { params: { query } });

  const href = (changes: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q, from, to, page: String(page), ...changes };
    for (const [k, v] of Object.entries(merged))
      if (v !== undefined && v !== '' && !(k === 'page' && v === '1')) p.set(k, String(v));
    if (merged.status === '') p.set('status', '');
    return `/orders?${p}`;
  };
  const exportParams = new URLSearchParams(
    Object.entries({ status, q, from, to }).filter(([, v]) => v) as [string, string][],
  );
  const counts = data?.counts ?? {};
  const openCount = (counts.pending ?? 0) + (counts.confirmed ?? 0) + (counts.processing ?? 0);
  const totalCount = Object.values(counts).reduce((a, n) => a + n, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Orders</h1>
        <a href={`/orders/export?${exportParams}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Export CSV
        </a>
      </div>

      <nav className="flex flex-wrap gap-1" aria-label="Order status">
        {TABS.map((t) => {
          const n = t.key === 'open' ? openCount : t.key === '' ? totalCount : (counts[t.key] ?? 0);
          return (
            <Link
              key={t.key || 'all'}
              href={href({ status: t.key, page: 1 })}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm',
                status === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground/80 hover:bg-muted',
              )}
            >
              {t.label} <span className="tabular-nums opacity-70">{n}</span>
            </Link>
          );
        })}
      </nav>

      <form className="flex flex-wrap items-end gap-2" action="/orders">
        <input type="hidden" name="status" value={status} />
        <Input name="q" defaultValue={q} placeholder="Order number, phone or name" className="w-64 bg-background" />
        <label className="text-xs text-muted-foreground">
          From
          <Input type="date" name="from" defaultValue={from} className="bg-background" />
        </label>
        <label className="text-xs text-muted-foreground">
          To
          <Input type="date" name="to" defaultValue={to} className="bg-background" />
        </label>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {(q || from || to) && (
          <Link href={href({ q: '', from: '', to: '', page: 1 })} className={buttonVariants({ variant: 'ghost' })}>
            Clear
          </Link>
        )}
      </form>

      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load orders.')}</p>
      ) : (
        <OrdersTable rows={data?.items ?? []} />
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages} · {data.total} orders
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={href({ page: page + 1 })} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
