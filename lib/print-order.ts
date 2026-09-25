import 'server-only';
import { notFound } from 'next/navigation';
import { apiClient } from './api/client';
import { adminApi } from './session';

/** The order and store settings a printable document needs. */
export async function loadPrintableOrder(orderNo: string) {
  const [{ data: order, response }, { data: settings }] = await Promise.all([
    (await adminApi()).GET('/api/v1/admin/orders/{orderNo}', { params: { path: { orderNo }, header: {} } }),
    apiClient().GET('/api/v1/settings'),
  ]);
  if (response.status === 404 || !order) notFound();
  return { order, hotline: settings?.hotline ?? '' };
}
