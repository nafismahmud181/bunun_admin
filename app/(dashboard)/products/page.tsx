import type { Metadata } from 'next';
import Link from 'next/link';
import ProductStatusBadge from '@/components/catalogue/ProductStatusBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { imgSrc } from '@/lib/images';
import { taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Products' };

const STATUSES = ['draft', 'active', 'archived'] as const;
const select = 'h-9 rounded-md border bg-background px-2 text-sm';

export default async function ProductsPage({ searchParams }: PageProps<'/products'>) {
  const admin = await requireAdmin('products:read');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const q = one('q').slice(0, 100);
  const status = STATUSES.find((s) => s === one('status'));
  const categoryId = Number(one('categoryId')) || undefined;
  const page = Math.max(1, Number(one('page')) || 1);

  const api = await adminApi();
  const [{ data, error }, { data: categories }] = await Promise.all([
    api.GET('/api/v1/admin/products', {
      params: {
        query: { ...(q && { q }), ...(status && { status }), ...(categoryId && { categoryId }), page, limit: 25 },
        header: {},
      },
    }),
    api.GET('/api/v1/admin/categories', { params: { header: {} } }),
  ]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const pageHref = (p: number) => {
    const u = new URLSearchParams(
      Object.entries({ q, status: status ?? '', categoryId: categoryId ? String(categoryId) : '' }).filter(
        ([, v]) => v,
      ),
    );
    if (p > 1) u.set('page', String(p));
    return `/products?${u}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Products</h1>
        {admin.permissions.includes('products:write') && (
          <Link href="/products/new" className={buttonVariants({ size: 'sm' })}>
            New product
          </Link>
        )}
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/products">
        <Input name="q" defaultValue={q} placeholder="Name or SKU" className="w-56 bg-background" />
        <select name="categoryId" defaultValue={categoryId ?? ''} className={select} aria-label="Category">
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ''} className={select} aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Live</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load products.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">From</TableHead>
                <TableHead className="text-right">Options</TableHead>
                <TableHead className="text-right">In stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No products match.
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgSrc(p.image, 400)} alt="" className="size-10 rounded object-cover" />
                    ) : (
                      <div className="size-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    {p.tag && <span className="ml-2 text-xs text-muted-foreground">{p.tag}</span>}
                  </TableCell>
                  <TableCell>{p.category.name}</TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.variantCount ? taka(p.priceFrom) : '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.variantCount}</TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${p.stock === 0 && p.variantCount ? 'text-destructive' : ''}`}
                  >
                    {p.stock}
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
            Page {page} of {pages} · {data.total} products
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
