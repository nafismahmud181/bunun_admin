import Link from 'next/link';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TopProducts from '@/components/dashboard/TopProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_URL, apiClient } from '@/lib/api/client';
import { STATUS_LABEL, taka, type OrderStatus } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

type ApiStatus = { state: 'ok' | 'degraded' | 'unreachable'; detail: string };

async function getApiStatus(): Promise<ApiStatus> {
  try {
    const { data, error } = await apiClient().GET('/health', { signal: AbortSignal.timeout(3000) });
    const body = data ?? error;
    if (body?.status === 'ok') return { state: 'ok', detail: `Database ${body.database} · up ${body.uptimeSeconds}s` };
    if (body) return { state: 'degraded', detail: `Database ${body.database}` };
    return { state: 'degraded', detail: 'Unexpected response' };
  } catch {
    return { state: 'unreachable', detail: `No response from ${API_URL}` };
  }
}

const OPEN_STEPS = [
  ['pending', 'To confirm by phone'],
  ['confirmed', 'To pack'],
  ['processing', 'To hand to courier'],
] as const;
const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
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

export default async function DashboardPage({ searchParams }: PageProps<'/'>) {
  const admin = await requireAdmin();
  const denied = (await searchParams).denied === '1';
  const canOrders = admin.permissions.includes('orders:read');
  const [status, dash] = await Promise.all([
    getApiStatus(),
    canOrders
      ? (await adminApi()).GET('/api/v1/admin/dashboard', { params: { header: {} } }).then((r) => r.data ?? null)
      : null,
  ]);
  const byStatus = dash?.byStatus ?? {};
  const month = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', month: 'long' });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      {denied && (
        <Alert variant="destructive">
          <AlertDescription>Your role doesn&apos;t allow that page.</AlertDescription>
        </Alert>
      )}

      {dash && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Sales today"
              value={taka(dash.today.revenue)}
              sub={`${dash.today.orders} order${dash.today.orders === 1 ? '' : 's'}`}
            />
            <Stat label={`Sales in ${month}`} value={taka(dash.month.revenue)} sub={`${dash.month.orders} orders`} />
            <Stat label="Average order" value={taka(dash.month.averageOrder)} sub={`in ${month}`} />
            <Stat
              label="Waiting for action"
              value={String(OPEN_STEPS.reduce((a, [k]) => a + (byStatus[k] ?? 0), 0))}
              sub="pending, confirmed or packing"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {OPEN_STEPS.map(([key, label]) => (
              <Link key={key} href={`/orders?status=${key}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardDescription>{label}</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{byStatus[key] ?? 0}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Revenue per day, last 30 days</CardTitle>
                <CardDescription>
                  Orders placed, excluding cancelled and returned ones. Bangladesh time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart days={dash.last30Days} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top products, last 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <TopProducts rows={dash.topProducts} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">All orders by status</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {STATUS_ORDER.map((s) => (
                    <li key={s} className="flex justify-between">
                      <Link href={`/orders?status=${s}`} className="hover:underline">
                        {STATUS_LABEL[s]}
                      </Link>
                      <span className="tabular-nums">{byStatus[s] ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  Low stock (≤ {dash.lowStockThreshold})
                  <Link href="/inventory?low=true" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                    All low stock
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dash.lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing is running low.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {dash.lowStock.map((v) => (
                      <li key={v.sku} className="flex items-center justify-between gap-3 py-1.5">
                        <Link href={`/products/${v.productId}`} className="hover:underline">
                          {v.name} · {v.label}
                        </Link>
                        <span
                          className={`tabular-nums font-medium ${v.stock === 0 ? 'text-destructive' : 'text-amber-700'}`}
                        >
                          {v.stock === 0 ? 'Out of stock' : `${v.stock} left`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            API status
            <Badge data-api-status={status.state} variant={status.state === 'ok' ? 'secondary' : 'destructive'}>
              {status.state}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{status.detail}</CardContent>
      </Card>
    </div>
  );
}
