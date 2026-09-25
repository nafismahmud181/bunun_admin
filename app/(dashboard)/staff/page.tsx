import type { Metadata } from 'next';
import StaffManager from '@/components/StaffManager';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Staff' };

export default async function StaffPage() {
  const me = await requireAdmin('staff:manage');
  const { data, error } = await (await adminApi()).GET('/api/v1/admin/staff', { params: { header: {} } });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-sm text-muted-foreground">
          Owners can do everything. Managers run orders, products and stock. Order handlers take and process orders.
          Content editors edit products. Changing someone&apos;s role or disabling them signs them out at once.
        </p>
      </div>
      {data ? (
        <StaffManager staff={data} meId={me.id} />
      ) : (
        <p className="text-sm text-destructive">{errorMessage(error)}</p>
      )}
    </div>
  );
}
