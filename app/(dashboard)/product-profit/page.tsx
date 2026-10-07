import type { Metadata } from 'next';
import Link from 'next/link';
import ProductProfit from '@/components/profit/ProductProfit';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api/client';
import { imgSrc } from '@/lib/images';
import { taka } from '@/lib/orders';
import { keptShare } from '@/lib/product-profit';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Product profit' };

export default async function ProductProfitPage({ searchParams }: PageProps<'/product-profit'>) {
  await requireAdmin('settings:write');
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? '';
  const q = one('q').slice(0, 100);
  const missing = one('missing') === '1';
  const productId = Number(one('product')) || undefined;
  const page = Math.max(1, Number(one('page')) || 1);

  const api = await adminApi();
  const h = { header: {} };
  const [list, chosen, planReply] = await Promise.all([
    api.GET('/api/v1/admin/product-costs', {
      params: { query: { ...(q && { q }), ...(missing && { missing: 'true' as const }), page, limit: 30 }, ...h },
    }),
    productId
      ? api.GET('/api/v1/admin/product-costs', { params: { query: { productId }, ...h } })
      : Promise.resolve(null),
    api.GET('/api/v1/admin/profit-plan', { params: h }),
  ]);
  const product = chosen?.data?.items[0] ?? null;
  const plan = planReply.data?.plan;
  const orders = plan?.orders ?? [];
  const plannedOrders = Math.round(orders.reduce((a, b) => a + b, 0) / Math.max(1, orders.length));
  const fixed = plan?.monthly.reduce((a, c) => a + c.amount, 0) ?? 0;

  const href = (o: { product?: number; page?: number; missing?: boolean }) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (o.missing ?? missing) u.set('missing', '1');
    if ((o.page ?? page) > 1) u.set('page', String(o.page ?? page));
    if (o.product ?? productId) u.set('product', String(o.product ?? productId));
    const s = u.toString();
    return `/product-profit${s ? `?${s}` : ''}`;
  };
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Product profit</h1>
        <p className="text-sm text-muted-foreground">
          Pick a product, type what one costs you, and see how much you keep when you sell it. Delivery, Pathao,
          packaging and returns come from your Profit planner.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        {/* The product list */}
        <Card className={cn('lg:sticky lg:top-4', product && 'order-2 lg:order-1')}>
          <CardContent className="space-y-3">
            <form action="/product-profit" className="flex gap-2">
              {missing && <input type="hidden" name="missing" value="1" />}
              <Input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" />
              <button type="submit" className={buttonVariants({ variant: 'secondary' })}>
                Search
              </button>
            </form>
            <div className="flex gap-1 text-sm">
              <Link
                href={href({ missing: false, page: 1 })}
                className={cn('rounded-md px-2 py-1', !missing ? 'bg-muted font-medium' : 'text-muted-foreground')}
              >
                All products
              </Link>
              <Link
                href={href({ missing: true, page: 1 })}
                className={cn('rounded-md px-2 py-1', missing ? 'bg-muted font-medium' : 'text-muted-foreground')}
              >
                Cost not entered yet
              </Link>
            </div>
            {!list.data ? (
              <p className="text-sm text-destructive">{errorMessage(list.error, 'Could not load products.')}</p>
            ) : list.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products found.</p>
            ) : (
              <ul className="-mx-2 divide-y">
                {list.data.items.map((p) => {
                  const costed = p.variants.filter((v) => v.cost);
                  const first = costed[0];
                  return (
                    <li key={p.id}>
                      <Link
                        href={href({ product: p.id })}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted',
                          p.id === productId && 'bg-muted',
                        )}
                      >
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgSrc(p.image)} alt="" className="size-10 shrink-0 rounded object-cover" />
                        ) : (
                          <span className="size-10 shrink-0 rounded bg-muted" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {taka(Math.min(...p.variants.map((v) => v.price)))}
                            {p.variants.length > 1 && ` · ${p.variants.length} sizes`}
                            {' · '}
                            {costed.length === 0 ? (
                              <span className="text-amber-700">cost not entered</span>
                            ) : costed.length < p.variants.length ? (
                              `${costed.length} of ${p.variants.length} sizes costed`
                            ) : first!.cost!.unitCost >= first!.price ? (
                              <span className="text-destructive">costs more than its price</span>
                            ) : (
                              `you keep ${Math.round(keptShare(first!.price, first!.cost!.unitCost))}% of the price`
                            )}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {pages > 1 && (
              <div className="flex items-center justify-between text-sm">
                {page > 1 ? <Link href={href({ page: page - 1 })}>← Previous</Link> : <span />}
                <span className="text-muted-foreground">
                  Page {page} of {pages}
                </span>
                {page < pages ? <Link href={href({ page: page + 1 })}>Next →</Link> : <span />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* The calculator */}
        <div className={cn(product && 'order-1 lg:order-2')}>
          {!plan ? (
            <p className="text-sm text-destructive">{errorMessage(planReply.error, 'Could not load your figures.')}</p>
          ) : product ? (
            <ProductProfit key={product.id} product={product} plan={plan} fixed={fixed} plannedOrders={plannedOrders} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {productId ? 'That product was not found.' : 'Pick a product from the list to see its profit.'}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
