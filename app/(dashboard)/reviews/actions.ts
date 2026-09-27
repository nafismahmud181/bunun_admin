'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export type Result = { ok: true } | { ok: false; error: string };

export async function moderateReviewAction(id: number, status: 'approved' | 'rejected'): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/reviews/{id}', { params: { path: { id }, header: {} }, body: { status } });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidatePath('/reviews');
  return { ok: true };
}

export async function deleteReviewAction(id: number): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/reviews/{id}', { params: { path: { id }, header: {} } });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidatePath('/reviews');
  return { ok: true };
}
