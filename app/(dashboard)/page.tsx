import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_URL, apiClient } from '@/lib/api/client';
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

export default async function DashboardPage({ searchParams }: PageProps<'/'>) {
  const admin = await requireAdmin();
  const denied = (await searchParams).denied === '1';
  const [status, orders] = await Promise.all([
    getApiStatus(),
    admin.permissions.includes('orders:read')
      ? (await adminApi()).GET('/api/v1/admin/orders', { params: { query: { status: 'open', limit: 1 } } })
      : Promise.resolve(null),
  ]);
  const counts = orders?.data?.counts ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      {denied && (
        <Alert variant="destructive">
          <AlertDescription>Your role doesn&apos;t allow that page.</AlertDescription>
        </Alert>
      )}
      {orders && (
        <div className="grid gap-4 sm:grid-cols-3">
          {OPEN_STEPS.map(([key, label]) => (
            <Link key={key} href={`/orders?status=${key}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{counts[key] ?? 0}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
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
      <p className="text-sm text-muted-foreground">Sales, stock and top-product widgets arrive in part 3c.</p>
    </div>
  );
}
