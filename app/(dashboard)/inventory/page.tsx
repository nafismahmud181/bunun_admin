import type { Metadata } from 'next';
import Link from 'next/link';
import StockDialog from '@/components/catalogue/StockDialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage({ searchParams }: PageProps<'/inventory'>) {
  const admin = await requireAdmin('products:read');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const q = one('q').slice(0, 100);
  const low = one('low') === 'true';
  const page = Math.max(1, Number(one('page')) || 1);
  const { data, error } = await (
    await adminApi()
  ).GET('/api/v1/admin/inventory', {
    params: { query: { ...(q && { q }), ...(low && { low: 'true' as const }), page, limit: 50 }, header: {} },
  });
  const canStock = admin.permissions.includes('inventory:write');
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const href = (changes: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q && { q }), ...(low && { low: 'true' }), ...changes });
    for (const [k, v] of [...u]) if (!v || (k === 'page' && v === '1')) u.delete(k);
    return `/inventory?${u}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Inventory</h1>
        <Link href="/inventory/history" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Stock history
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={href({ low: '', page: '1' })}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            !low ? 'bg-primary text-primary-foreground' : 'bg-background',
          )}
        >
          All
        </Link>
        <Link
          href={href({ low: 'true', page: '1' })}
          className={cn('rounded-md px-3 py-1.5 text-sm', low ? 'bg-primary text-primary-foreground' : 'bg-background')}
        >
          Low stock{data ? ` (≤ ${data.lowStockThreshold})` : ''}
        </Link>
        <form action="/inventory" className="ml-auto flex gap-2">
          {low && <input type="hidden" name="low" value="true" />}
          <Input name="q" defaultValue={q} placeholder="Product or SKU" className="w-56 bg-background" />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load inventory.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Option</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {low ? 'Nothing is running low.' : 'No products match.'}
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((r) => (
                <TableRow key={r.sku}>
                  <TableCell>
                    <Link href={`/products/${r.productId}`} className="hover:underline">
                      {r.productName}
                    </Link>
                    {r.productStatus === 'draft' && <span className="ml-2 text-xs text-muted-foreground">draft</span>}
                  </TableCell>
                  <TableCell>{r.label}</TableCell>
                  <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{taka(r.price)}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      r.stock === 0 ? 'text-destructive' : r.low && 'text-amber-700',
                    )}
                  >
                    {r.stock}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Link
                      href={`/inventory/history?sku=${encodeURIComponent(r.sku)}`}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      History
                    </Link>
                    {canStock && (
                      <StockDialog
                        key={`${r.sku}-${r.stock}`}
                        sku={r.sku}
                        label={`${r.productName} · ${r.label}`}
                        stock={r.stock}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
