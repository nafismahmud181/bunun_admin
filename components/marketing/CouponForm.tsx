'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  type CouponCreate,
  type CouponUpdate,
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from '@/app/(dashboard)/coupons/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Coupon, fromDhakaInput, toDhakaInput } from '@/lib/coupons';
import { cn } from '@/lib/utils';

const TYPES: [Coupon['type'], string][] = [
  ['percent', 'Percentage off'],
  ['fixed', 'Fixed amount off'],
  ['free_delivery', 'Free delivery'],
];

const num = (s: string) => (s.trim() === '' ? null : Number(s));

/** Create a coupon, or edit one (pass `coupon`). A used coupon's discount can't change. */
export default function CouponForm({ coupon, onDone }: { coupon?: Coupon; onDone?: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const locked = !!coupon && coupon.usedCount > 0;
  const [f, setF] = useState({
    code: coupon?.code ?? '',
    description: coupon?.description ?? '',
    type: coupon?.type ?? ('percent' as Coupon['type']),
    value: coupon ? String(coupon.value) : '',
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : '',
    minSubtotal: coupon ? String(coupon.minSubtotal || '') : '',
    startsAt: toDhakaInput(coupon?.startsAt ?? null),
    endsAt: toDhakaInput(coupon?.endsAt ?? null),
    usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : '',
    perPhoneLimit: String(coupon?.perPhoneLimit ?? 1),
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    active: coupon?.active ?? true,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const body: CouponCreate = {
    code: f.code.trim(),
    description: f.description.trim() || null,
    type: f.type,
    value: f.type === 'free_delivery' ? 0 : Number(f.value || 0),
    maxDiscount: f.type === 'percent' ? num(f.maxDiscount) : null,
    minSubtotal: Number(f.minSubtotal || 0),
    startsAt: fromDhakaInput(f.startsAt),
    endsAt: fromDhakaInput(f.endsAt),
    usageLimit: num(f.usageLimit),
    perPhoneLimit: Number(f.perPhoneLimit || 1),
    firstOrderOnly: f.firstOrderOnly,
    active: f.active,
  };
  const valid =
    (coupon || /^[A-Za-z0-9_-]{2,30}$/.test(body.code)) &&
    (f.type === 'free_delivery' || (f.type === 'percent' ? body.value >= 1 && body.value <= 100 : body.value >= 1));

  const save = () =>
    start(async () => {
      if (coupon) {
        // The code never changes; a used coupon's discount is fixed, so it isn't sent.
        const { code, type, value, maxDiscount, ...rest } = body;
        const changes: CouponUpdate = locked ? rest : { ...rest, type, value, maxDiscount };
        void code;
        const r = await updateCouponAction(coupon.id, changes);
        if (!r.ok) return void toast.error(r.error);
        toast.success('Coupon saved');
        router.refresh();
      } else {
        const r = await createCouponAction(body);
        if (!r.ok) return void toast.error(r.error);
        toast.success(`Coupon ${body.code.toUpperCase()} created`);
        onDone?.();
        router.push(`/coupons/${r.id}`);
      }
    });

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="c-code">Code</Label>
          <Input
            id="c-code"
            value={f.code}
            onChange={set('code')}
            disabled={!!coupon}
            placeholder="EID20"
            className="font-mono uppercase"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            {coupon ? "Codes can't be changed." : 'Letters, numbers, - and _. Shoppers can type it in any case.'}
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-desc">Description (optional)</Label>
          <Input
            id="c-desc"
            value={f.description}
            onChange={set('description')}
            placeholder="Eid sale"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">Shown at checkout next to the discount.</p>
        </div>
      </div>

      <fieldset className="grid gap-2" disabled={locked}>
        <legend className="mb-1.5 text-sm font-medium">Discount</legend>
        <div className="flex flex-wrap gap-1">
          {TYPES.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={f.type === value ? 'default' : 'outline'}
              onClick={() => setF({ ...f, type: value })}
            >
              {label}
            </Button>
          ))}
        </div>
        {f.type !== 'free_delivery' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="c-value">{f.type === 'percent' ? 'Percent off' : 'Taka off'}</Label>
              <Input
                id="c-value"
                type="number"
                min={1}
                max={f.type === 'percent' ? 100 : undefined}
                value={f.value}
                onChange={set('value')}
              />
            </div>
            {f.type === 'percent' && (
              <div className="grid gap-1.5">
                <Label htmlFor="c-max">Maximum discount ৳ (optional)</Label>
                <Input id="c-max" type="number" min={0} value={f.maxDiscount} onChange={set('maxDiscount')} />
              </div>
            )}
          </div>
        )}
        {locked && (
          <p className="text-xs text-muted-foreground">
            This coupon has been used, so its discount is fixed. To offer a different deal, disable it and create a new
            one.
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="c-min">Minimum item total ৳</Label>
          <Input
            id="c-min"
            type="number"
            min={0}
            value={f.minSubtotal}
            onChange={set('minSubtotal')}
            placeholder="None"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-limit">Total uses</Label>
          <Input
            id="c-limit"
            type="number"
            min={1}
            value={f.usageLimit}
            onChange={set('usageLimit')}
            placeholder="Unlimited"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-phone">Uses per phone number</Label>
          <Input id="c-phone" type="number" min={1} max={100} value={f.perPhoneLimit} onChange={set('perPhoneLimit')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-start">Starts (optional)</Label>
          <Input id="c-start" type="datetime-local" value={f.startsAt} onChange={set('startsAt')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-end">Ends (optional)</Label>
          <Input id="c-end" type="datetime-local" value={f.endsAt} onChange={set('endsAt')} />
        </div>
        <p className="self-end pb-2 text-xs text-muted-foreground">Times are Bangladesh time.</p>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.firstOrderOnly} onChange={set('firstOrderOnly')} />
          First order only (phone numbers that haven&apos;t ordered before)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.active} onChange={set('active')} />
          Active
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={!valid || pending}>
          {pending ? 'Saving…' : coupon ? 'Save changes' : 'Create coupon'}
        </Button>
        {coupon && coupon.usedCount === 0 && (
          <Button
            variant="ghost"
            className={cn('text-destructive')}
            disabled={pending}
            onClick={() =>
              confirm(`Delete coupon ${coupon.code}?`) &&
              start(async () => {
                const r = await deleteCouponAction(coupon.id);
                if (!r.ok) return void toast.error(r.error);
                toast.success('Coupon deleted');
                router.push('/coupons');
              })
            }
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
