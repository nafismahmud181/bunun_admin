'use server';

import { revalidatePath } from 'next/cache';
import { errorMessage } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { adminApi, requireAdmin } from '@/lib/session';

export type Result = { ok: true } | { ok: false; error: string };
type SettingsInput = Partial<components['schemas']['AdminSettings']>;
const h = { header: {} };
const done = (): Result => {
  revalidatePath('/settings');
  return { ok: true };
};
const fail = (e: unknown): Result => ({ ok: false, error: errorMessage(e) });

export async function saveSettingsAction(changes: SettingsInput): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (await adminApi()).PATCH('/api/v1/admin/settings', { params: h, body: changes });
  return error ? fail(error) : done();
}

export async function addZoneAction(zone: {
  key: string;
  name: string;
  fee: number;
  estimate: string;
}): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (await adminApi()).POST('/api/v1/admin/delivery-zones', { params: h, body: zone });
  return error ? fail(error) : done();
}

export async function updateZoneAction(
  key: string,
  changes: { name?: string; fee?: number; estimate?: string },
): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (
    await adminApi()
  ).PATCH('/api/v1/admin/delivery-zones/{key}', {
    params: { path: { key }, header: {} },
    body: changes,
  });
  return error ? fail(error) : done();
}

export async function deleteZoneAction(key: string): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/delivery-zones/{key}', { params: { path: { key }, header: {} } });
  return error ? fail(error) : done();
}

export async function setAreaZoneAction(areaIds: number[], zoneKey: string | null): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/delivery-zones/areas', { params: h, body: { areaIds, zoneKey } });
  return error ? fail(error) : done();
}

export async function setDistrictZoneAction(districtId: number, zoneKey: string | null): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (
    await adminApi()
  ).PUT('/api/v1/admin/delivery-zones/districts/{id}', {
    params: { path: { id: districtId }, header: {} },
    body: { zoneKey },
  });
  return error ? fail(error) : done();
}

export async function addBlockedAction(kind: 'phone' | 'ip', value: string, reason: string): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (
    await adminApi()
  ).POST('/api/v1/admin/blocked', { params: h, body: { kind, value, reason } });
  return error ? fail(error) : done();
}

export async function removeBlockedAction(id: number): Promise<Result> {
  await requireAdmin('settings:write');
  const { error } = await (
    await adminApi()
  ).DELETE('/api/v1/admin/blocked/{id}', { params: { path: { id }, header: {} } });
  return error ? fail(error) : done();
}

export type DataResetInput = {
  orders: boolean;
  customers: boolean;
  coupons: boolean;
  auditLog: boolean;
  sessions: boolean;
  code: string;
  confirm: 'RESET';
};
export type DataResetOutcome =
  { ok: true; result: components['schemas']['DataResetResult'] } | { ok: false; error: string };

/** Danger zone: deletes the chosen test data after a fresh two-factor code (owner only). */
export async function resetDataAction(input: DataResetInput): Promise<DataResetOutcome> {
  await requireAdmin('data:reset');
  const { data, error } = await (await adminApi()).POST('/api/v1/admin/data-reset', { params: h, body: input });
  if (error || !data) return { ok: false, error: errorMessage(error) };
  revalidatePath('/', 'layout');
  return { ok: true, result: data };
}
