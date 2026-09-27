import type { components } from '@/lib/api/schema';

export type Coupon = components['schemas']['AdminCoupon'];
export type CouponState = components['schemas']['CouponState'];

export const STATE_LABEL: Record<CouponState, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  used_up: 'Used up',
  disabled: 'Disabled',
};

export const STATE_CLASS: Record<CouponState, string> = {
  active: 'bg-emerald-50 text-emerald-800',
  scheduled: 'bg-sky-50 text-sky-800',
  expired: 'bg-muted text-muted-foreground',
  used_up: 'bg-amber-50 text-amber-800',
  disabled: 'bg-muted text-muted-foreground',
};

export { fromDhakaInput, toDhakaInput } from './dhaka';
