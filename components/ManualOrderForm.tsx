'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createManualOrderAction,
  searchVariantsAction,
  type ManualOrderInput,
} from '@/app/(dashboard)/manual-orders/actions';
import LocationPicker, { type Locations, type PickedArea } from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { components } from '@/lib/api/schema';
import { taka } from '@/lib/orders';

type Variant = components['schemas']['InventoryRow'];
type Settings = components['schemas']['StoreSettings'];
type Line = Variant & { qty: number };

const SOURCES: [ManualOrderInput['source'], string][] = [
  ['facebook', 'Facebook'],
  ['whatsapp', 'WhatsApp'],
  ['phone', 'Phone call'],
  ['other', 'Other'],
];
const isPhone = (s: string) => /^01[3-9]\d{8}$/.test(s.replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, ''));

export default function ManualOrderForm({ locations, settings }: { locations: Locations; settings: Settings }) {
  const router = useRouter();
  const [source, setSource] = useState<ManualOrderInput['source']>('facebook');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState<PickedArea | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Variant[]>([]);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();
  // One key per order attempt, so a double click or retry can't create the order twice.
  const key = useRef<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => startSearch(async () => setResults(await searchVariantsAction(q))), 250);
  };
  const add = (v: Variant) => {
    setLines((ls) =>
      ls.some((l) => l.sku === v.sku)
        ? ls.map((l) => (l.sku === v.sku ? { ...l, qty: l.qty + 1 } : l))
        : [...ls, { ...v, qty: 1 }],
    );
    setQuery('');
    setResults([]);
  };
  const setQty = (sku: string, qty: number) =>
    setLines((ls) => ls.map((l) => (l.sku === sku ? { ...l, qty: Math.max(1, qty) } : l)));

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const off = Math.max(0, Math.min(Number(discount) || 0, subtotal));
  const zone = area ? settings.zones.find((z) => z.key === area.zone) : undefined;
  const fee = !zone || subtotal - off === 0 ? 0 : subtotal - off >= settings.freeDeliveryThreshold ? 0 : zone.fee;
  const short = lines.filter((l) => l.qty > l.stock);
  const ready =
    name.trim().length >= 2 &&
    isPhone(phone) &&
    area &&
    address.trim().length >= 5 &&
    lines.length > 0 &&
    short.length === 0;

  const submit = () =>
    startSave(async () => {
      if (!area) return;
      key.current ??= crypto.randomUUID();
      const r = await createManualOrderAction({
        source,
        name: name.trim(),
        phone,
        areaId: area.id,
        address: address.trim(),
        notes,
        items: lines.map((l) => ({ sku: l.sku, qty: l.qty })),
        discount: off,
        idempotencyKey: key.current,
      });
      if (r.ok) {
        toast.success(`Order ${r.orderNo} created`);
        router.push(`/orders/${r.orderNo}`);
      } else toast.error(r.error);
    });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-1">
              {SOURCES.map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={source === value ? 'default' : 'outline'}
                  onClick={() => setSource(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="m-name">Name</Label>
                <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="m-phone">Mobile number</Label>
                <Input
                  id="m-phone"
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <LocationPicker locations={locations} onChange={setArea} />
            <div className="grid gap-1.5">
              <Label htmlFor="m-address">Address</Label>
              <Input
                id="m-address"
                placeholder="House, road, block / village"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-notes">Delivery notes (optional)</Label>
              <Textarea
                id="m-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                placeholder="Search products by name or SKU…"
                value={query}
                onChange={(e) => search(e.target.value)}
                aria-label="Search products"
              />
              {(results.length > 0 || (searching && query.length >= 2)) && (
                <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-background shadow-md">
                  {searching && <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>}
                  {results.map((v) => (
                    <li key={v.sku}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                        disabled={v.stock === 0}
                        onClick={() => add(v)}
                      >
                        <span>
                          {v.productName} · {v.label}{' '}
                          <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>
                        </span>
                        <span className="whitespace-nowrap text-muted-foreground">
                          {taka(v.price)} · {v.stock ? `${v.stock} in stock` : 'out of stock'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {lines.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l) => (
                    <TableRow key={l.sku}>
                      <TableCell>
                        {l.productName} · {l.label}
                        {l.qty > l.stock && (
                          <span className="ml-2 text-xs text-destructive">only {l.stock} in stock</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          type="number"
                          min={1}
                          value={l.qty}
                          onChange={(e) => setQty(l.sku, Number(e.target.value))}
                          aria-label={`Quantity of ${l.productName}`}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{taka(l.price)}</TableCell>
                      <TableCell className="text-right tabular-nums">{taka(l.price * l.qty)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLines((ls) => ls.filter((x) => x.sku !== l.sku))}
                          aria-label="Remove"
                        >
                          ✕
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Items</span>
            <span className="tabular-nums">{taka(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="m-discount">Discount ৳</Label>
            <Input
              id="m-discount"
              className="h-8 w-28 text-right"
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <span>Delivery{zone ? ` (${zone.name})` : ''}</span>
            <span className="tabular-nums">{!area ? 'Choose an area' : fee ? taka(fee) : 'Free'}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>To collect (COD)</span>
            <span className="tabular-nums">{taka(subtotal - off + fee)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The order is saved as confirmed and the customer gets an SMS. The API recalculates every amount.
          </p>
          <Button className="w-full" onClick={submit} disabled={!ready || saving}>
            {saving ? 'Creating…' : 'Create order'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
