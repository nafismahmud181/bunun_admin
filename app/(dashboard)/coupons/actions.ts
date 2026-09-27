'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';
import { adminApi, requireAdmin } from '@/lib/session';

export type CouponCreate = paths['/api/v1/admin/coupons']['post']['requestBody']['content']['application/json'];
export type CouponUpdate = paths['/api/v1/admin/coupons/{id}']['patch']['requestBody']['content']['application/json'];

export type Result = { ok: true; id?: number } | { ok: false; error: string };
const done = (id?: number): Result => {
  revalidatePath('/coupons');
  if (id) revalidatePath(`/coupons/${id}`);
  return { ok: true, id };
};

export async function createCouponAction(input: CouponCreate): Promise<Result> {
  await requireAdmin('coupons:write');
  const { data, error } = await (
    await adminApi()
  ).POST('/api/v1/admin/coupons', { params: { header: {} }, body: input });
  return data ? done(data.id) : { ok: false, error: errorMessage(error) };
}

export async function updateCouponAction(id: number, changes: CouponUpdate): Promise<Result> {
  await requireAdmin('coupons:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/coupons/{id}', { params: { path: { id }, header: {} }, body: changes });
  return error ? { ok: false, error: errorMessage(error) } : done(id);
}

export async function deleteCouponAction(id: number): Promise<Result> {
  await requireAdmin('coupons:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/coupons/{id}', { params: { path: { id }, header: {} } });
  return error ? { ok: false, error: errorMessage(error) } : done();
}
