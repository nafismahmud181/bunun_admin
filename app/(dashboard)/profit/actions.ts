'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { Plan } from '@/lib/profit';
import { adminApi, requireAdmin } from '@/lib/session';

export type Result = { ok: true; updatedAt: string | null } | { ok: false; error: string };

export async function saveProfitPlanAction(plan: Plan): Promise<Result> {
  await requireAdmin('settings:write');
  const { data, error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/profit-plan', { params: { header: {} }, body: plan });
  if (!data) return { ok: false, error: errorMessage(error) };
  revalidatePath('/profit');
  return { ok: true, updatedAt: data.updatedAt };
}
