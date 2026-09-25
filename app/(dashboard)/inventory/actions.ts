'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export type Result = { ok: true; stock: number } | { ok: false; error: string };

/** Add/remove units (`change`) or record a stocktake (`count`), always with a reason. */
export async function adjustStockAction(input: {
  sku: string;
  reason: string;
  change?: number;
  count?: number;
}): Promise<Result> {
  await requireAdmin('inventory:write');
  const { data, error } = await (
    await adminApi()
  ).POST('/api/v1/admin/inventory/adjust', { params: { header: {} }, body: input });
  if (!data) return { ok: false, error: errorMessage(error) };
  revalidatePath('/inventory');
  revalidatePath('/products', 'layout');
  return { ok: true, stock: data.stock };
}
