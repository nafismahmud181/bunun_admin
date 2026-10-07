'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export type Result = { ok: true } | { ok: false; error: string };

/** Saves the same cost lines for each size given (one size, or all sizes of a product). */
export async function saveCostAction(
  variantIds: number[],
  lines: { label: string; amount: number }[],
): Promise<Result> {
  await requireAdmin('settings:write');
  const api = await adminApi();
  for (const variantId of variantIds) {
    const { error } = await api.PUT('/api/v1/admin/product-costs/{variantId}', {
      params: { path: { variantId }, header: {} },
      body: { lines },
    });
    if (error) return { ok: false, error: errorMessage(error) };
  }
  revalidatePath('/product-profit');
  return { ok: true };
}
