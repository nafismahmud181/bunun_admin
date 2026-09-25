import type { NextRequest } from 'next/server';
import { currentAdmin, adminApi } from '@/lib/session';

// Streams the backend's CSV export to the browser, authenticated with the admin's session cookie.
export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin?.permissions.includes('orders:read')) return new Response('Not allowed', { status: 403 });
  const allowed = ['status', 'q', 'from', 'to', 'paymentStatus'];
  const query = Object.fromEntries([...request.nextUrl.searchParams].filter(([k, v]) => allowed.includes(k) && v));
  const { response } = await (
    await adminApi()
  ).GET('/api/v1/admin/orders/export.csv', {
    params: { query },
    parseAs: 'stream',
  });
  if (!response.ok) return new Response('Export failed', { status: response.status });
  return new Response(response.body, {
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'text/csv; charset=utf-8',
      'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment; filename="orders.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
