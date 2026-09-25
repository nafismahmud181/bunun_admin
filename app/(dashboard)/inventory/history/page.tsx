import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { dhakaDateTime } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Stock history' };

export default async function StockHistoryPage({ searchParams }: PageProps<'/inventory/history'>) {
  await requireAdmin('products:read');
  const sp = await searchParams;
  const sku = (Array.isArray(sp.sku) ? sp.sku[0] : sp.sku)?.slice(0, 64) ?? '';
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const { data, error } = await (
    await adminApi()
  ).GET('/api/v1/admin/inventory/movements', {
    params: { query: { ...(sku && { sku }), page, limit: 50 }, header: {} },
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const href = (p: number) =>
    `/inventory/history?${new URLSearchParams({ ...(sku && { sku }), ...(p > 1 && { page: String(p) }) })}`;

  return (
    <div className="space-y-4">
      <Link href="/inventory" className="text-sm text-muted-foreground hover:underline">
        ← Inventory
      </Link>
      <h1 className="text-xl font-semibold">
        Stock history{sku && <span className="ml-2 font-mono text-base text-muted-foreground">{sku}</span>}
      </h1>
      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the history.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No stock changes yet.
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap">{dhakaDateTime(m.at)}</TableCell>
                  <TableCell>
                    {m.productName} · {m.label} <span className="font-mono text-xs text-muted-foreground">{m.sku}</span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${m.change < 0 ? 'text-destructive' : 'text-emerald-700'}`}
                  >
                    {m.change > 0 ? `+${m.change}` : m.change}
                  </TableCell>
                  <TableCell>
                    {m.reason}
                    {m.orderNo && (
                      <Link href={`/orders/${m.orderNo}`} className="ml-1 text-primary hover:underline">
                        {m.orderNo}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>{m.by ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {data && data.total > data.limit && (
        <div className="flex justify-end gap-2">
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
      )}
    </div>
  );
}
