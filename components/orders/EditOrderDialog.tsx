'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { editOrderAction } from '@/app/(dashboard)/orders/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { components } from '@/lib/api/schema';
import type { OrderDetail } from '@/lib/orders';

type Locations = components['schemas']['LocationTree'];
const select = 'h-9 w-full rounded-md border bg-background px-2 text-sm';

/** The division and district an area belongs to, to preselect the dropdowns. */
function findArea(locations: Locations, areaId: number | null) {
  for (const dv of locations)
    for (const ds of dv.districts)
      if (ds.areas.some((a) => a.id === areaId)) return { divisionId: dv.id, districtId: ds.id };
  return { divisionId: 0, districtId: 0 };
}

/** Correct the customer's name, phone or address before the order is packed. */
export default function EditOrderDialog({ order, locations }: { order: OrderDetail; locations: Locations }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState(() => ({
    ...findArea(locations, order.address.areaId),
    name: order.customer.name,
    phone: order.customer.phone,
    areaId: order.address.areaId ?? 0,
    addressLine: order.address.line,
    notes: order.notes ?? '',
  }));
  const division = locations.find((d) => d.id === form.divisionId);
  const district = division?.districts.find((d) => d.id === form.districtId);

  const save = () =>
    start(async () => {
      if (!form.areaId) return void toast.error('Choose the area.');
      const changes: Parameters<typeof editOrderAction>[1] = {};
      if (form.name.trim() !== order.customer.name) changes.name = form.name.trim();
      if (form.phone.trim() !== order.customer.phone) changes.phone = form.phone.trim();
      if (form.areaId !== order.address.areaId) changes.areaId = form.areaId;
      if (form.addressLine.trim() !== order.address.line) changes.addressLine = form.addressLine.trim();
      if (form.notes.trim() !== (order.notes ?? '')) changes.notes = form.notes.trim() || null;
      const r = await editOrderAction(order.orderNo, changes);
      if (r.ok) {
        toast.success('Order updated');
        setOpen(false);
      } else toast.error(r.error);
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit contact &amp; address
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit contact &amp; address</DialogTitle>
            <DialogDescription>A different area can change the delivery charge and the total.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="e-name">Name</Label>
              <Input id="e-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-phone">Mobile number</Label>
              <Input
                id="e-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                aria-label="Division"
                className={select}
                value={form.divisionId}
                onChange={(e) => setForm({ ...form, divisionId: Number(e.target.value), districtId: 0, areaId: 0 })}
              >
                <option value={0}>Division</option>
                {locations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="District"
                className={select}
                value={form.districtId}
                disabled={!division}
                onChange={(e) => setForm({ ...form, districtId: Number(e.target.value), areaId: 0 })}
              >
                <option value={0}>District</option>
                {division?.districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Area"
                className={select}
                value={form.areaId}
                disabled={!district}
                onChange={(e) => setForm({ ...form, areaId: Number(e.target.value) })}
              >
                <option value={0}>Area</option>
                {district?.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-line">Address</Label>
              <Input
                id="e-line"
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-notes">Customer&apos;s delivery notes</Label>
              <Textarea
                id="e-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
