import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { dhakaDate, successRate, taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Customers' };

export default async function CustomersPage({ searchParams }: PageProps<'/customers'>) {
  await requireAdmin('customers:read');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const q = one('q').slice(0, 100);
  const blocked = one('blocked') === 'true';
  const page = Math.max(1, Number(one('page')) || 1);
  const { data, error } = await (
    await adminApi()
  ).GET('/api/v1/admin/customers', {
    params: { query: { ...(q && { q }), ...(blocked && { blocked: 'true' as const }), page, limit: 25 }, header: {} },
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const href = (changes: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q && { q }), ...(blocked && { blocked: 'true' }), ...changes });
    for (const [k, v] of [...u]) if (!v || (k === 'page' && v === '1')) u.delete(k);
    return `/customers?${u}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Customers</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={href({ blocked: '', page: '1' })}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            !blocked ? 'bg-primary text-primary-foreground' : 'bg-background',
          )}
        >
          All
        </Link>
        <Link
          href={href({ blocked: 'true', page: '1' })}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            blocked ? 'bg-primary text-primary-foreground' : 'bg-background',
          )}
        >
          Blocked
        </Link>
        <form action="/customers" className="ml-auto flex gap-2">
          {blocked && <input type="hidden" name="blocked" value="true" />}
          <Input name="q" defaultValue={q} placeholder="Phone or name" className="w-56 bg-background" />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load customers.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Last order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No customers match.
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.blocked && (
                      <span className="ml-2 rounded bg-destructive/10 px-1.5 text-xs text-destructive">blocked</span>
                    )}
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.delivered}</TableCell>
                  <TableCell className="text-right tabular-nums">{successRate(c.delivered, c.returned)}</TableCell>
                  <TableCell className="text-right tabular-nums">{taka(c.spent)}</TableCell>
                  <TableCell>{c.lastOrderAt ? dhakaDate(c.lastOrderAt) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages} · {data.total} customers
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={href({ page: String(page - 1) })}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={href({ page: String(page + 1) })}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
