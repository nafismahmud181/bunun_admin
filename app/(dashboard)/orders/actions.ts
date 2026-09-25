'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { OrderStatus } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export type ActionResult = { ok: true } | { ok: false; error: string };

const done = (orderNo: string): ActionResult => {
  revalidatePath(`/orders/${orderNo}`);
  revalidatePath('/orders');
  return { ok: true };
};

export async function changeStatusAction(
  orderNo: string,
  input: { to: OrderStatus; note?: string; restock?: boolean },
): Promise<ActionResult> {
  await requireAdmin('orders:write');
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/orders/{orderNo}/status', {
    params: { path: { orderNo }, header: {} },
    body: { to: input.to, ...(input.note?.trim() && { note: input.note.trim() }), restock: input.restock ?? true },
  });
  return error ? { ok: false, error: errorMessage(error) } : done(orderNo);
}

export async function addNoteAction(orderNo: string, body: string): Promise<ActionResult> {
  await requireAdmin('orders:write');
  if (!body.trim()) return { ok: false, error: 'Write a note first.' };
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/orders/{orderNo}/notes', {
    params: { path: { orderNo }, header: {} },
    body: { body: body.trim() },
  });
  return error ? { ok: false, error: errorMessage(error) } : done(orderNo);
}

export async function editOrderAction(
  orderNo: string,
  changes: { name?: string; phone?: string; areaId?: number; addressLine?: string; notes?: string | null },
): Promise<ActionResult> {
  await requireAdmin('orders:write');
  if (Object.keys(changes).length === 0) return { ok: false, error: 'Nothing changed.' };
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/orders/{orderNo}', {
    params: { path: { orderNo }, header: {} },
    body: changes,
  });
  return error ? { ok: false, error: errorMessage(error) } : done(orderNo);
}
