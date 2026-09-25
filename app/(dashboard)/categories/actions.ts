'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import { adminApi, adminUpload, requireAdmin } from '@/lib/session';

export type Result = { ok: true } | { ok: false; error: string };

const done = (): Result => {
  revalidatePath('/categories');
  return { ok: true };
};

export async function createCategoryAction(name: string, nameBn: string): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/categories', {
    params: { header: {} },
    body: { name, nameBn: nameBn || null, active: true },
  });
  return error ? { ok: false, error: errorMessage(error) } : done();
}

export async function updateCategoryAction(
  id: number,
  changes: { name?: string; nameBn?: string | null; slug?: string; active?: boolean },
): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/categories/{id}', {
    params: { path: { id }, header: {} },
    body: changes,
  });
  return error ? { ok: false, error: errorMessage(error) } : done();
}

export async function reorderCategoriesAction(ids: number[]): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/categories/order', { params: { header: {} }, body: { ids } });
  return error ? { ok: false, error: errorMessage(error) } : done();
}

export async function deleteCategoryAction(id: number): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/categories/{id}', { params: { path: { id }, header: {} } });
  return error ? { ok: false, error: errorMessage(error) } : done();
}

export async function uploadCategoryImageAction(id: number, form: FormData): Promise<Result> {
  await requireAdmin('products:write');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an image.' };
  const { ok, body } = await adminUpload(`/api/v1/admin/categories/${id}/image`, form);
  return ok ? done() : { ok: false, error: errorMessage(body, 'Upload failed.') };
}
