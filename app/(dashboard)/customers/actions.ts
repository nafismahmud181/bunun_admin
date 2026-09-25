'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export type Result = { ok: true } | { ok: false; error: string };
const done = (id: number): Result => {
  revalidatePath(`/customers/${id}`);
  revalidatePath('/customers');
  return { ok: true };
};
const path = (id: number) => ({ params: { path: { id }, header: {} } });

export async function saveCustomerNotesAction(id: number, notes: string): Promise<Result> {
  await requireAdmin('customers:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/customers/{id}', { ...path(id), body: { notes: notes.trim() || null } });
  return error ? { ok: false, error: errorMessage(error) } : done(id);
}

export async function blockCustomerAction(id: number, reason: string): Promise<Result> {
  await requireAdmin('customers:write');
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/customers/{id}/block', { ...path(id), body: { reason } });
  return error ? { ok: false, error: errorMessage(error) } : done(id);
}

export async function unblockCustomerAction(id: number): Promise<Result> {
  await requireAdmin('customers:write');
  const { error } = await (await adminApi()).DELETE('/api/v1/admin/customers/{id}/block', path(id));
  return error ? { ok: false, error: errorMessage(error) } : done(id);
}
