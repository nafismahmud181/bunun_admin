'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { errorMessage } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { adminApi, adminUpload, requireAdmin } from '@/lib/session';

export type Result = { ok: true } | { ok: false; error: string };
export type ProductUpdate = Partial<
  Pick<
    components['schemas']['AdminProduct'],
    | 'nameEn'
    | 'nameBn'
    | 'slug'
    | 'descriptionEn'
    | 'descriptionBn'
    | 'categoryId'
    | 'tag'
    | 'status'
    | 'seoTitle'
    | 'seoDescription'
  >
>;
type VariantInput = {
  label: string;
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  weightGrams?: number | null;
  openingStock?: number;
};

const refreshed = (id: number): Result => {
  revalidatePath(`/products/${id}`);
  revalidatePath('/products');
  return { ok: true };
};
const path = (id: number) => ({ params: { path: { id }, header: {} } });

export async function createProductAction(form: FormData): Promise<Result> {
  await requireAdmin('products:write');
  const { data, error } = await (
    await adminApi()
  ).POST('/api/v1/admin/products', {
    params: { header: {} },
    body: {
      nameEn: String(form.get('nameEn') ?? ''),
      categoryId: Number(form.get('categoryId')),
      descriptionEn: String(form.get('descriptionEn') ?? '') || null,
      status: 'draft',
    },
  });
  if (!data) return { ok: false, error: errorMessage(error) };
  redirect(`/products/${data.id}`);
}

export async function updateProductAction(id: number, changes: ProductUpdate): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (await adminApi()).PATCH('/api/v1/admin/products/{id}', { ...path(id), body: changes });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}

export async function duplicateProductAction(id: number): Promise<Result> {
  await requireAdmin('products:write');
  const { data, error } = await (await adminApi()).POST('/api/v1/admin/products/{id}/duplicate', path(id));
  if (!data) return { ok: false, error: errorMessage(error) };
  redirect(`/products/${data.id}`);
}

export async function addVariantAction(id: number, v: VariantInput): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/products/{id}/variants', { ...path(id), body: { openingStock: 0, ...v } });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}

export async function updateVariantAction(id: number, variantId: number, v: Partial<VariantInput>): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/products/{id}/variants/{variantId}', {
    params: { path: { id, variantId }, header: {} },
    body: v,
  });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}

export async function deleteVariantAction(id: number, variantId: number): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/products/{id}/variants/{variantId}', {
    params: { path: { id, variantId }, header: {} },
  });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}

/** One photo per call (the form holds "file" and optional "alt"). */
export async function uploadImageAction(id: number, form: FormData): Promise<Result> {
  await requireAdmin('products:write');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an image.' };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: `${file.name} is larger than 10 MB.` };
  const { ok, body } = await adminUpload(`/api/v1/admin/products/${id}/images`, form);
  return ok ? refreshed(id) : { ok: false, error: errorMessage(body, 'Upload failed.') };
}

export async function updateImageAction(id: number, imageId: number, alt: string): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/products/{id}/images/{imageId}', {
    params: { path: { id, imageId }, header: {} },
    body: { alt: alt.trim() || null },
  });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}

export async function reorderImagesAction(id: number, ids: number[]): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/products/{id}/images/order', { ...path(id), body: { ids } });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}

export async function deleteImageAction(id: number, imageId: number): Promise<Result> {
  await requireAdmin('products:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/products/{id}/images/{imageId}', {
    params: { path: { id, imageId }, header: {} },
  });
  return error ? { ok: false, error: errorMessage(error) } : refreshed(id);
}
