import type { Metadata } from 'next';
import ManualOrderForm from '@/components/ManualOrderForm';
import { apiClient } from '@/lib/api/client';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Manual order' };

export default async function ManualOrderPage() {
  await requireAdmin('orders:write');
  const api = apiClient();
  const [{ data: locations }, { data: settings }] = await Promise.all([
    api.GET('/api/v1/locations'),
    api.GET('/api/v1/settings'),
  ]);
  if (!locations || !settings)
    return <p className="text-sm text-destructive">Could not load locations or delivery settings.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Manual order</h1>
        <p className="text-sm text-muted-foreground">For orders taken on Facebook, WhatsApp or by phone.</p>
      </div>
      <ManualOrderForm locations={locations} settings={settings} />
    </div>
  );
}
