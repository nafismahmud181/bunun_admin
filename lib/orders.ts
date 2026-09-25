import type { components } from './api/schema';

export type OrderStatus = components['schemas']['OrderStatus'];
export type OrderRow = components['schemas']['AdminOrderRow'];
export type OrderDetail = components['schemas']['AdminOrderDetail'];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Packing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

/** What the button for moving to a status says. */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: 'Mark pending',
  confirmed: 'Confirm order',
  processing: 'Start packing',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
  returned: 'Mark returned',
  refunded: 'Mark refunded',
};

export const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  processing: 'bg-indigo-100 text-indigo-900',
  shipped: 'bg-violet-100 text-violet-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-zinc-200 text-zinc-700',
  returned: 'bg-rose-100 text-rose-900',
  refunded: 'bg-zinc-200 text-zinc-700',
};

export const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Part paid',
  paid: 'Paid',
  refunded: 'Refunded',
  cod: 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  card: 'Card',
};

export const taka = (n: number) => '৳' + Math.round(n).toLocaleString('en-IN');

export const dhakaDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

export const dhakaDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
