import type { Metadata } from 'next';
import ProfitPlanner from '@/components/profit/ProfitPlanner';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Profit planner' };

export default async function ProfitPage() {
  await requireAdmin('settings:write');
  const { data, error } = await (await adminApi()).GET('/api/v1/admin/profit-plan', { params: { header: {} } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profit planner</h1>
        <p className="text-sm text-muted-foreground">
          Answers three questions: how many orders you need, when you get your starting money back, and how much you
          make in the first year.
        </p>
      </div>
      {data ? (
        <ProfitPlanner
          initial={data.plan}
          defaults={data.defaults}
          saved={data.saved}
          updatedAt={data.updatedAt}
          actuals={data.actuals}
        />
      ) : (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the profit planner.')}</p>
      )}
    </div>
  );
}
