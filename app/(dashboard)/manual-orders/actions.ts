'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { adminApi, requireAdmin } from '@/lib/session';

type InventoryRow = components['schemas']['InventoryRow'];

/** Products and sizes matching a name or SKU, with price and stock, for the order form. */
export async function searchVariantsAction(q: string): Promise<InventoryRow[]> {
  await requireAdmin('orders:write');
  if (q.trim().length < 2) return [];
  const { data } = await (
    await adminApi()
  ).GET('/api/v1/admin/inventory', {
    params: { query: { q: q.trim(), limit: 20 }, header: {} },
  });
  return (data?.items ?? []).filter((r) => r.productStatus !== 'archived');
}

export type ManualOrderInput = {
  source: 'facebook' | 'whatsapp' | 'phone' | 'other';
  name: string;
  phone: string;
  areaId: number;
  address: string;
  notes?: string;
  items: { sku: string; qty: number }[];
  discount: number;
  idempotencyKey: string;
};

export async function createManualOrderAction(
  input: ManualOrderInput,
): Promise<{ ok: true; orderNo: string } | { ok: false; error: string }> {
  await requireAdmin('orders:write');
  const { data, error } = await (
    await adminApi()
  ).POST('/api/v1/admin/orders', {
    params: { header: {} },
    body: { ...input, ...(input.notes?.trim() ? { notes: input.notes.trim() } : { notes: undefined }) },
  });
  if (!data) return { ok: false, error: errorMessage(error) };
  revalidatePath('/orders');
  return { ok: true, orderNo: data.orderNo };
}
