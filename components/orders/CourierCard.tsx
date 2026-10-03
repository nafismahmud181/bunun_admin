'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { bookShipmentAction, cancelShipmentAction, refreshShipmentAction } from '@/app/(dashboard)/orders/actions';
import { useConfirm } from '@/components/ConfirmProvider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { components } from '@/lib/api/schema';
import { type OrderStatus, dhakaDateTime, taka } from '@/lib/orders';

type Shipment = components['schemas']['AdminShipment'];
type Courier = components['schemas']['CourierInfo'];
type Parcel = components['schemas']['ParcelDefaults'];

const SOURCE: Record<string, string> = { booking: 'booked', webhook: 'update', sync: 'check', staff: 'staff' };

/** Book the order with the courier, then follow the parcel. */
export default function CourierCard({
  orderNo,
  status,
  shipments,
  courier,
  parcel,
  canWrite,
}: {
  orderNo: string;
  status: OrderStatus;
  shipments: Shipment[];
  courier: Courier | null;
  parcel: Parcel | null;
  canWrite: boolean;
}) {
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [weight, setWeight] = useState(parcel ? String(parcel.weightKg) : '0.5');
  const [note, setNote] = useState('');
  const current = shipments.find((s) => s.state !== 'cancelled');
  const past = shipments.filter((s) => s.state === 'cancelled');
  const label = courier?.label ?? 'Pathao';
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(msg);
      else toast.error(r.error, { duration: 10_000 });
    });

  if (!courier?.enabled && !current)
    return (
      <p className="text-sm text-muted-foreground">
        Courier booking isn&apos;t set up yet. Add the Pathao credentials (PATHAO_…) to the API&apos;s .env file.
      </p>
    );

  if (current)
    return (
      <div className="space-y-3 text-sm">
        {current.state === 'booking' ? (
          <div className="rounded-md bg-amber-50 p-3 text-amber-900">
            <p className="font-medium">{label} didn&apos;t confirm this booking.</p>
            <p className="mt-1 text-xs">
              {current.lastError} Look for order {orderNo} in the {label} merchant panel. If it&apos;s there, wait for
              the next status check; if not, mark it as not booked and book again.
            </p>
            {canWrite && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={pending}
                onClick={async () =>
                  (await confirm({
                    title: `Is order ${orderNo} missing from ${label}?`,
                    description: `Only confirm after checking the ${label} merchant panel, or the parcel may be booked twice.`,
                    action: "It wasn't booked",
                  })) && run(() => cancelShipmentAction(orderNo, current.id), 'Marked as not booked')
                }
              >
                It wasn&apos;t booked
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-mono font-medium">{current.consignmentId}</p>
                <p className={current.state === 'returned' ? 'text-destructive' : ''}>{current.statusLabel}</p>
              </div>
              {current.trackingUrl && (
                <a
                  href={current.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Track on {label} ↗
                </a>
              )}
              {!current.trackingUrl && current.courier === 'pathao-sandbox' && (
                <span className="text-xs text-muted-foreground">
                  Sandbox test parcel: not on Pathao&apos;s tracking page
                </span>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">To collect</dt>
                <dd className="font-medium tabular-nums">{taka(current.codAmount)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd className="font-medium tabular-nums">
                  {current.deliveryFee !== null ? taka(current.deliveryFee) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Weight</dt>
                <dd className="font-medium tabular-nums">{current.weightKg} kg</dd>
              </div>
            </dl>
            <ol className="space-y-1 border-l pl-3 text-xs">
              {current.events.map((e, i) => (
                <li key={i}>
                  <span className="font-medium">{e.label}</span>{' '}
                  <span className="text-muted-foreground">
                    · {dhakaDateTime(e.at)} · {SOURCE[e.source] ?? e.source}
                  </span>
                </li>
              ))}
            </ol>
            {current.state === 'active' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || !courier?.enabled}
                  onClick={() => run(() => refreshShipmentAction(orderNo, current.id), 'Status checked')}
                >
                  {pending ? 'Checking…' : 'Check status now'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {current.checkedAt ? `Checked ${dhakaDateTime(current.checkedAt)}` : ''}
                </span>
                {canWrite && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive"
                    disabled={pending}
                    onClick={async () =>
                      (await confirm({
                        title: `Cancelled in ${label}?`,
                        description: `Use this after cancelling ${current.consignmentId} in the ${label} merchant panel. The order can then be booked again.`,
                        action: 'Mark as cancelled',
                        destructive: true,
                      })) && run(() => cancelShipmentAction(orderNo, current.id), 'Booking marked as cancelled')
                    }
                  >
                    Cancelled in {label}?
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );

  const ready = status === 'confirmed' || status === 'processing';
  if (!ready || !canWrite || !parcel)
    return (
      <p className="text-sm text-muted-foreground">
        {ready ? 'Not booked yet.' : 'Book a courier once the order is confirmed and packed.'}
        {past.length > 0 && ` ${past.length} earlier booking${past.length === 1 ? ' was' : 's were'} cancelled.`}
      </p>
    );

  const kg = Number(weight);
  return (
    <div className="space-y-3 text-sm">
      {courier?.mode === 'sandbox' && (
        <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {label} <b>sandbox</b>: bookings are tests and no rider will come.
        </p>
      )}
      <p className="text-muted-foreground">
        {parcel.address}
        <br />
        {parcel.description}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="c-weight">Weight (kg)</Label>
          <Input
            id="c-weight"
            type="number"
            min={0.5}
            max={10}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">To collect</span>
          <span className="flex h-9 items-center font-medium tabular-nums">{taka(parcel.codAmount)}</span>
        </div>
      </div>
      {!parcel.weightKnown && (
        <p className="text-xs text-amber-700">
          Some options have no shipping weight, so this is a guess. Check it, or add weights on the product pages.
        </p>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="c-note">Note for the rider (optional)</Label>
        <Input
          id="c-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="e.g. Fragile, call before arriving"
        />
      </div>
      <Button
        className="w-full"
        disabled={pending || !(kg >= 0.5 && kg <= 10)}
        onClick={() => run(() => bookShipmentAction(orderNo, { weightKg: kg, note }), `Booked with ${label}`)}
      >
        {pending ? 'Booking…' : `Book with ${label}`}
      </Button>
      {past.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {past.length} earlier booking{past.length === 1 ? ' was' : 's were'} cancelled.
        </p>
      )}
    </div>
  );
}
