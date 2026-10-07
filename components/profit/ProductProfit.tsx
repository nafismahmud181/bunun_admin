'use client';

import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';
import { saveCostAction } from '@/app/(dashboard)/product-profit/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { components } from '@/lib/api/schema';
import { imgSrc } from '@/lib/images';
import { averageSale, keptShare, oneSale } from '@/lib/product-profit';
import { money, type Plan } from '@/lib/profit';
import { cn } from '@/lib/utils';

type Product = components['schemas']['CostedProduct'];
type Line = { label: string; amount: number };

// Starting lines for a product with no cost yet: bought ready-made, or made to order.
const STARTER: Line[] = [
  { label: 'Buying price or materials', amount: 0 },
  { label: 'Making (tailor, embroidery)', amount: 0 },
  { label: 'Bringing it to your store', amount: 0 },
];

/** A taka box that lets you clear it and type freely; reports a number (blank = 0). */
function TakaInput({
  value,
  onChange,
  label,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  id?: string;
}) {
  const [text, setText] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (Number(text || 0) !== value) setText(String(value));
  }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
        ৳
      </span>
      <Input
        id={id}
        aria-label={label}
        type="number"
        inputMode="decimal"
        min={0}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n >= 0) onChange(n);
        }}
        className="pl-6 tabular-nums"
      />
    </div>
  );
}

function Answer({ n, question, children }: { n: number; question: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {n}
      </span>
      <div>
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{question}</div>
        <p className="mt-0.5 text-base leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

const B = ({ children, bad }: { children: ReactNode; bad?: boolean }) => (
  <strong className={cn('font-semibold tabular-nums', bad ? 'text-destructive' : 'text-foreground')}>{children}</strong>
);

export default function ProductProfit({
  product,
  plan,
  fixed,
  plannedOrders,
}: {
  product: Product;
  plan: Plan;
  fixed: number;
  plannedOrders: number;
}) {
  const [vi, setVi] = useState(0);
  const variant = product.variants[vi]!;
  const savedLines = (variant.cost?.lines ?? STARTER).map((l) => ({ ...l }));
  // Lines being edited, per size, so switching sizes keeps unsaved typing.
  const [drafts, setDrafts] = useState<Record<number, Line[]>>({});
  const lines = drafts[variant.id] ?? savedLines;
  const setLines = (next: Line[]) => setDrafts({ ...drafts, [variant.id]: next });
  const [prices, setPrices] = useState<Record<number, number>>({});
  const price = prices[variant.id] ?? variant.price;
  const [orders, setOrders] = useState(plannedOrders || 100);
  const [target, setTarget] = useState(300);
  const [allSizes, setAllSizes] = useState(false);
  const [pending, start] = useTransition();

  const cost = lines.reduce((a, l) => a + l.amount, 0);
  const dirty = JSON.stringify(lines) !== JSON.stringify(variant.cost?.lines ?? STARTER);
  const blank = lines.some((l) => !l.label.trim());
  const inside = oneSale(plan, price, cost, true);
  const outside = oneSale(plan, price, cost, false);
  const avg = averageSale(plan, price, cost);
  const perOrderFixed = orders > 0 ? fixed / orders : 0;
  const net = avg.keep - perOrderFixed;
  const kept = keptShare(price, cost);
  const r = plan.perOrder.returnRate;

  const save = () =>
    start(async () => {
      const ids = allSizes ? product.variants.map((v) => v.id) : [variant.id];
      const res = await saveCostAction(
        ids,
        lines.filter((l) => l.amount > 0 || l.label.trim()),
      );
      if (!res.ok) return void toast.error(res.error);
      setDrafts({});
      toast.success(ids.length > 1 ? `Cost saved for all ${ids.length} sizes` : 'Cost saved');
    });

  const rows: [string, number, number][] = [
    ['The customer pays (price + delivery)', inside.paid, outside.paid],
    ['− What one costs you', -cost, -cost],
    ['− Pathao delivery fee', -inside.courier, -outside.courier],
    ['− Cash-collection and payment fees', -inside.fees, -outside.fees],
    ['− Box, bag, tape and text messages', -inside.other, -outside.other],
  ];

  return (
    <div className="space-y-4">
      {/* The product */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc(product.image)} alt="" className="size-16 rounded-md object-cover" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-sm text-muted-foreground">
              {product.category} ·{' '}
              <Link href={`/products/${product.id}`} className="underline underline-offset-2">
                Edit product
              </Link>
            </p>
          </div>
          {product.variants.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Size">
              {product.variants.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={vi === i}
                  onClick={() => setVi(i)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm',
                    vi === i ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                  )}
                >
                  {v.label}
                  {!v.cost && <span className="ml-1 opacity-70">· no cost</span>}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* 1. Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. What does one cost you?</CardTitle>
            <CardDescription>
              Everything you pay to have one {variant.label !== 'Default' ? `(${variant.label}) ` : ''}ready to sell.
              Leave a line at 0 if it doesn&apos;t apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
                <Input
                  aria-label="What it's for"
                  value={l.label}
                  maxLength={80}
                  onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
                />
                <TakaInput
                  label={`${l.label} amount`}
                  value={l.amount}
                  onChange={(amount) => setLines(lines.map((x, k) => (k === i ? { ...x, amount } : x)))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${l.label}`}
                  onClick={() => setLines(lines.filter((_, k) => k !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={lines.length >= 20}
                onClick={() => setLines([...lines, { label: 'Other cost', amount: 0 }])}
              >
                <Plus /> Add a line
              </Button>
              <span className="text-sm">
                One costs you <span className="font-semibold tabular-nums">{money(cost)}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={save} disabled={pending || blank || (!dirty && !allSizes)}>
                {pending ? 'Saving…' : 'Save cost'}
              </Button>
              {product.variants.length > 1 && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={allSizes} onChange={(e) => setAllSizes(e.target.checked)} />
                  Same cost for all {product.variants.length} sizes
                </label>
              )}
              <span className="text-xs text-muted-foreground">
                {dirty ? 'Not saved yet' : variant.cost ? 'Saved' : 'No cost saved for this size yet'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Price */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. The selling price</CardTitle>
            <CardDescription>
              Your shop sells it for <B>{money(variant.price)}</B>. Try another price here to see what changes; this
              doesn&apos;t change the price in your shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid max-w-56 gap-1.5">
              <Label htmlFor="try-price">Try a price</Label>
              <TakaInput id="try-price" value={price} onChange={(v) => setPrices({ ...prices, [variant.id]: v })} />
            </div>
            {price !== variant.price && (
              <Button variant="ghost" size="sm" onClick={() => setPrices({ ...prices, [variant.id]: variant.price })}>
                Back to the real price ({money(variant.price)})
              </Button>
            )}
            <div className="space-y-2 border-t pt-3">
              <Label htmlFor="target">How much do you want to keep from each order?</Label>
              <div className="max-w-56">
                <TakaInput id="target" value={target} onChange={setTarget} />
              </div>
              {cost > 0 ? (
                <ul className="space-y-1 text-sm">
                  <li>
                    To keep {money(target)}, sell it for at least <B>{money(avg.priceFor(target))}</B>.
                  </li>
                  <li className="text-muted-foreground">
                    The lowest price that doesn&apos;t lose money on the order: {money(avg.priceFor(0))}.
                  </li>
                  <li className="text-muted-foreground">
                    The lowest price that also pays its share of your monthly costs:{' '}
                    {money(avg.priceFor(perOrderFixed))}.
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Enter what one costs you first.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Your answers at {money(price)}
            {price !== variant.price && ' (a price you are trying)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {cost === 0 ? (
            <p className="text-sm text-muted-foreground">
              Type what one costs you in step 1 and your answers appear here.
            </p>
          ) : (
            <>
              <Answer n={1} question="How much of the price do I keep?">
                {cost < price ? (
                  <>
                    After paying for the product, <B>{Math.round(kept)}%</B> of the price is left ({money(price - cost)}{' '}
                    of {money(price)}). You can use this number in the{' '}
                    <Link href="/profit" className="underline underline-offset-2">
                      Profit planner
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Nothing. One costs you {money(cost)} but sells for {money(price)}, so you{' '}
                    <B bad>lose {money(cost - price)}</B> on the product alone, before delivery. Raise the price or
                    lower the cost.
                  </>
                )}
              </Answer>
              <Answer n={2} question="What do I keep from one sale?">
                Delivered inside Dhaka, you keep <B bad={inside.keep < 0}>{money(inside.keep)}</B>. Outside Dhaka,{' '}
                <B bad={outside.keep < 0}>{money(outside.keep)}</B>.
              </Answer>
              <Answer n={3} question="And on average?">
                Counting free delivery and the {r} in 100 parcels that come back, you keep about{' '}
                <B bad={avg.keep < 0}>{money(avg.keep)}</B> per order.
              </Answer>
              <Answer n={4} question="After my monthly costs?">
                Your monthly costs ({money(fixed)}: ads, staff and so on) come to about {money(perOrderFixed)} per order
                if you sell{' '}
                <input
                  aria-label="Orders a month"
                  type="number"
                  min={1}
                  value={orders || ''}
                  onChange={(e) => setOrders(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                  className="mx-1 inline-block h-7 w-20 rounded-md border bg-background px-2 text-sm tabular-nums"
                />{' '}
                orders a month. So each order {net >= 0 ? 'makes' : 'loses'} about{' '}
                <B bad={net < 0}>{money(Math.abs(net))}</B> after everything.
              </Answer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where the money from one sale goes</CardTitle>
          <CardDescription>
            One {product.name.length > 40 ? 'item' : product.name} in an order on its own, delivered. Delivery charges
            and Pathao fees come from the{' '}
            <Link href="/profit" className="underline underline-offset-2">
              Profit planner
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1.5 font-medium" />
                <th className="py-1.5 text-right font-medium">Inside Dhaka</th>
                <th className="py-1.5 text-right font-medium">Outside Dhaka</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b], i) => (
                <tr key={label} className={cn('border-t', i > 0 && 'text-muted-foreground')}>
                  <td className="py-1.5">{label}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(a)}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(b)}</td>
                </tr>
              ))}
              <tr className="border-t font-semibold">
                <td className="py-1.5">= You keep</td>
                <td className={cn('py-1.5 text-right tabular-nums', inside.keep < 0 && 'text-destructive')}>
                  {money(inside.keep)}
                </td>
                <td className={cn('py-1.5 text-right tabular-nums', outside.keep < 0 && 'text-destructive')}>
                  {money(outside.keep)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            If a customer buys two or more items in one order, you keep more per item, because delivery and packaging
            are shared. Coupon discounts are not included.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
