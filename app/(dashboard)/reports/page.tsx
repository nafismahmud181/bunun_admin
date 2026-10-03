import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import RevenueChart from '@/components/dashboard/RevenueChart';
import CsvButton from '@/components/reports/CsvButton';
import RangePicker from '@/components/reports/RangePicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { STATUS_LABEL, type OrderStatus, taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Reports' };

// The dashboard's single series colour (validated against the white card surface).
const SERIES = '#2a78d6';
const SOURCE: Record<string, string> = {
  web: 'Website',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  phone: 'Phone call',
  other: 'Other',
};
const COURIER: Record<string, string> = { pathao: 'Pathao', 'pathao-sandbox': 'Pathao (sandbox tests)' };
const METHOD: Record<string, string> = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', card: 'Card' };
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00+06:00`).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** "▲ 12% vs previous 30 days" in muted ink; the arrow carries the direction, not a colour alone. */
function Change({ value, days }: { value: number | null; days: number }) {
  if (value === null) return <span>No sales in the previous {days} days to compare</span>;
  return (
    <span>
      <span className={value >= 0 ? 'text-emerald-700' : 'text-red-700'}>
        {value >= 0 ? '▲' : '▼'} {Math.abs(value)}%
      </span>{' '}
      vs previous {days} days
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardHeader>
    </Card>
  );
}

/** A thin horizontal bar for a share of the total, with the percentage written next to it. */
function Share({ part, whole }: { part: number; whole: number }) {
  const pct = whole ? Math.round((part / whole) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SERIES }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

function Section({
  title,
  description,
  csv,
  children,
}: {
  title: string;
  description?: string;
  csv?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {csv}
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;

export default async function ReportsPage({ searchParams }: PageProps<'/reports'>) {
  await requireAdmin('audit:read');
  const sp = await searchParams;
  const one = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k][0] : sp[k];
    return v && DAY.test(v) ? v : undefined;
  };
  const query = { ...(one('from') && { from: one('from') }), ...(one('to') && { to: one('to') }) };
  const { data: r, error } = await (await adminApi()).GET('/api/v1/admin/reports', { params: { query, header: {} } });

  if (!r)
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Reports</h1>
        <RangePicker from={query.from ?? ''} to={query.to ?? ''} />
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the report.')}</p>
      </div>
    );

  const s = r.summary;
  const file = (name: string) => `bunon-${name}-${r.range.from}-to-${r.range.to}.csv`;
  const productTotal = r.products.reduce((a, p) => a + p.revenue, 0);
  const categoryTotal = r.categories.reduce((a, c) => a + c.revenue, 0);
  const sourceTotal = r.sources.reduce((a, c) => a + c.revenue, 0);
  const statusTotal = r.statuses.reduce((a, c) => a + c.orders, 0);
  const cod = r.payments.cod;
  const statusOrder = Object.keys(STATUS_LABEL) as OrderStatus[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          {fmtDay(r.range.from)} – {fmtDay(r.range.to)} ({r.range.days} day{r.range.days === 1 ? '' : 's'}), Bangladesh
          time. Sales count orders placed in this period, without cancelled, returned and refunded ones.
        </p>
      </div>
      <RangePicker from={r.range.from} to={r.range.to} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sales" value={taka(s.revenue)} sub={<Change value={s.revenueChange} days={r.range.days} />} />
        <Stat label="Orders" value={String(s.orders)} sub={<Change value={s.ordersChange} days={r.range.days} />} />
        <Stat label="Average order" value={taka(s.averageOrder)} sub={`${s.itemsSold} items sold`} />
        <Stat
          label="Customers"
          value={String(s.customers)}
          sub={`${s.newCustomers} new · ${s.customers - s.newCustomers} returning`}
        />
        <Stat
          label="Return rate"
          value={s.returnRate === null ? '—' : `${s.returnRate}%`}
          sub={`${s.delivered} delivered · ${s.returned} returned`}
        />
        <Stat label="Cancelled" value={String(s.cancelled)} sub={`of ${s.allOrders} orders placed`} />
        <Stat label="Discounts given" value={taka(s.discounts)} sub="Coupons and manual discounts" />
        <Stat label="Delivery charged" value={taka(s.deliveryFees)} sub="Paid by customers" />
      </div>

      <Section
        title={`Sales per ${r.range.bucket === 'month' ? 'month' : 'day'}`}
        description={`Order totals, by the ${r.range.bucket === 'month' ? 'month' : 'day'} they were placed.`}
        csv={
          <CsvButton
            filename={file('sales')}
            header={[r.range.bucket === 'month' ? 'Month' : 'Day', 'Orders', 'Sales (BDT)']}
            rows={r.series.map((d) => [d.day, d.orders, d.revenue])}
          />
        }
      >
        <RevenueChart days={r.series} bucket={r.range.bucket} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Top products"
          description="By item sales (without delivery), top 15."
          csv={
            <CsvButton
              filename={file('products')}
              header={['Product', 'Units', 'Item sales (BDT)']}
              rows={r.products.map((p) => [p.name, p.qty, p.revenue])}
            />
          }
        >
          {r.products.length === 0 ? (
            <Empty>No sales in this period.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.products.map((p) => (
                  <TableRow key={`${p.productId}-${p.name}`}>
                    <TableCell className="max-w-64 truncate" title={p.name}>
                      {p.productId ? (
                        <Link href={`/products/${p.productId}`} className="hover:underline">
                          {p.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{p.name} (deleted)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(p.revenue)}</TableCell>
                    <TableCell>
                      <Share part={p.revenue} whole={productTotal} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>

        <Section
          title="Categories"
          description="Item sales per category."
          csv={
            <CsvButton
              filename={file('categories')}
              header={['Category', 'Orders', 'Units', 'Item sales (BDT)']}
              rows={r.categories.map((c) => [c.name, c.orders, c.qty, c.revenue])}
            />
          }
        >
          {r.categories.length === 0 ? (
            <Empty>No sales in this period.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.categories.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(c.revenue)}</TableCell>
                    <TableCell>
                      <Share part={c.revenue} whole={categoryTotal} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>

        <Section
          title="Where orders come from"
          description="Website, or entered by staff from Facebook, WhatsApp or phone."
        >
          {r.sources.length === 0 ? (
            <Empty>No orders in this period.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.sources.map((c) => (
                  <TableRow key={c.source}>
                    <TableCell>{SOURCE[c.source] ?? c.source}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(c.revenue)}</TableCell>
                    <TableCell>
                      <Share part={c.revenue} whole={sourceTotal} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>

        <Section
          title="Where those orders are now"
          description="Every order placed in this period, by its status today."
        >
          {statusTotal === 0 ? (
            <Empty>No orders in this period.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusOrder
                  .map((st) => r.statuses.find((x) => x.status === st))
                  .filter((x) => !!x)
                  .map((x) => (
                    <TableRow key={x.status}>
                      <TableCell>
                        <Link href={`/orders?status=${x.status}`} className="hover:underline">
                          {STATUS_LABEL[x.status as OrderStatus] ?? x.status}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{x.orders}</TableCell>
                      <TableCell className="text-right tabular-nums">{taka(x.total)}</TableCell>
                      <TableCell>
                        <Share part={x.orders} whole={statusTotal} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Payments" description="Cash on Delivery money for orders placed in this period.">
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ['Collected', cod.collected, 'Delivered and paid'],
                ['With the courier', cod.withCourier, 'Shipped, not yet delivered'],
                ['Not shipped yet', cod.notShipped, 'Pending, confirmed or packing'],
              ] as const
            ).map(([label, v, hint]) => (
              <div key={label} className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold tabular-nums">{taka(v.amount)}</div>
                <div className="text-xs text-muted-foreground">
                  {v.orders} order{v.orders === 1 ? '' : 's'} · {hint}
                </div>
              </div>
            ))}
          </div>
          {r.payments.methods.length > 0 && (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Paid so far</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.payments.methods.map((m) => (
                  <TableRow key={m.method}>
                    <TableCell>{METHOD[m.method] ?? m.method}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(m.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(m.paid)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Cancelled, returned and refunded orders are left out of the methods table.
          </p>
        </Section>
        <Section
          title="Coupons"
          description="Coupons used on orders placed in this period."
          csv={
            <CsvButton
              filename={file('coupons')}
              header={['Code', 'Uses', 'Given away (BDT)', 'Order value (BDT)']}
              rows={r.coupons.map((c) => [c.code, c.uses, c.saved, c.revenue])}
            />
          }
        >
          {r.coupons.length === 0 ? (
            <Empty>No coupons used in this period.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Uses</TableHead>
                  <TableHead className="text-right">Given away</TableHead>
                  <TableHead className="text-right">Order value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.coupons.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.uses}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(c.saved)}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(c.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>

      <Section title="Courier performance" description="Parcels booked in this period.">
        {r.couriers.length === 0 ? (
          <Empty>No parcels booked in this period.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Courier</TableHead>
                <TableHead className="text-right">Booked</TableHead>
                <TableHead className="text-right">On the way</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead className="text-right">Avg days</TableHead>
                <TableHead className="text-right">Fees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.couriers.map((c) => (
                <TableRow key={c.courier}>
                  <TableCell>
                    {COURIER[c.courier] ?? c.courier}
                    {c.cancelled > 0 && <div className="text-xs text-muted-foreground">{c.cancelled} cancelled</div>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.booked}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.inTransit}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.delivered}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.returned}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.successRate === null ? '—' : `${c.successRate}%`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.averageDays ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{taka(c.fees)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Success = delivered ÷ (delivered + returned). Avg days = booking to delivery.
        </p>
      </Section>
    </div>
  );
}
