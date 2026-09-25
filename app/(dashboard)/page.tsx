import { API_URL, api } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

type ApiStatus = { state: 'ok' | 'degraded' | 'unreachable'; detail: string };

async function getApiStatus(): Promise<ApiStatus> {
  try {
    const { data, error } = await api.GET('/health', { cache: 'no-store', signal: AbortSignal.timeout(3000) });
    const body = data ?? error;
    if (body?.status === 'ok') return { state: 'ok', detail: `Database ${body.database} · up ${body.uptimeSeconds}s` };
    if (body) return { state: 'degraded', detail: `Database ${body.database}` };
    return { state: 'degraded', detail: 'Unexpected response' };
  } catch {
    return { state: 'unreachable', detail: `No response from ${API_URL}` };
  }
}

const badge: Record<ApiStatus['state'], string> = {
  ok: 'bg-emerald-100 text-emerald-800',
  degraded: 'bg-amber-100 text-amber-800',
  unreachable: 'bg-red-100 text-red-800',
};

export default async function DashboardPage() {
  const status = await getApiStatus();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <section className="max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-600">API status</h2>
          <span
            data-api-status={status.state}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge[status.state]}`}
          >
            {status.state}
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">{status.detail}</p>
      </section>
      <p className="text-sm text-zinc-500">Sales, orders and stock widgets arrive in Phase 3.</p>
    </div>
  );
}
