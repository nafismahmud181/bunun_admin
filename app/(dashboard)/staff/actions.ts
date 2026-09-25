'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { SESSION_COOKIE, adminApi, requireAdmin } from '@/lib/session';
import { cookies } from 'next/headers';

type Role = components['schemas']['AdminRole'];
export type Result = { ok: true; password?: string } | { ok: false; error: string };
const done = (password?: string): Result => {
  revalidatePath('/staff');
  return { ok: true, ...(password && { password }) };
};

export async function inviteStaffAction(email: string, name: string, role: Role): Promise<Result> {
  await requireAdmin('staff:manage');
  const { data, error } = await (
    await adminApi()
  ).POST('/api/v1/admin/staff', { params: { header: {} }, body: { email, name, role } });
  return data ? done(data.password) : { ok: false, error: errorMessage(error) };
}

export async function updateStaffAction(
  id: number,
  changes: { role?: Role; active?: boolean; name?: string },
): Promise<Result> {
  await requireAdmin('staff:manage');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/staff/{id}', { params: { path: { id }, header: {} }, body: changes });
  return error ? { ok: false, error: errorMessage(error) } : done();
}

export async function resetStaffAction(id: number): Promise<Result> {
  await requireAdmin('staff:manage');
  const { data, error } = await (
    await adminApi()
  ).POST('/api/v1/admin/staff/{id}/reset', { params: { path: { id }, header: {} } });
  return data ? done(data.password) : { ok: false, error: errorMessage(error) };
}

export async function signOutStaffAction(id: number): Promise<Result> {
  await requireAdmin('staff:manage');
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/staff/{id}/sign-out', { params: { path: { id }, header: {} } });
  return error ? { ok: false, error: errorMessage(error) } : done();
}

/** The signed-in admin's own password. Other sessions are signed out; this one stays. */
export async function changePasswordAction(current: string, next: string): Promise<Result> {
  await requireAdmin();
  if (!(await cookies()).get(SESSION_COOKIE)) return { ok: false, error: 'Please sign in again.' };
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/auth/password', { params: { header: {} }, body: { current, next } });
  return error ? { ok: false, error: errorMessage(error) } : { ok: true };
}
