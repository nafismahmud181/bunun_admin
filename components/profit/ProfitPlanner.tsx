'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';
import { saveProfitPlanAction } from '@/app/(dashboard)/profit/actions';
import { useConfirm } from '@/components/ConfirmProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dhakaDateTime } from '@/lib/orders';
import { analyse, money, type Actuals, type Plan } from '@/lib/profit';
import { cn } from '@/lib/utils';
import CumulativeChart from './CumulativeChart';

// Written for an owner who isn't a business student: plain questions instead of finance terms,
// one profit level at a time, and every answer as a sentence.

type PerOrderKey = keyof Plan['perOrder'];
type Unit = 'taka' | 'pct' | 'count';
interface Field {
  key: PerOrderKey;
  label: string;
  unit: Unit;
  hint?: string;
  step?: number;
  real?: keyof Actuals;
}

const MAIN_FIELDS: Field[] = [
  {
    key: 'averageItemValue',
    label: 'How much does a customer spend on products?',
    unit: 'taka',
    hint: 'Average per order, after discounts, without the delivery charge.',
    real: 'averageItemValue',
  },
  {
    key: 'insideDhakaShare',
    label: 'Out of 100 orders, how many are inside Dhaka?',
    unit: 'pct',
    real: 'insideDhakaShare',
  },
  {
    key: 'chargeInside',
    label: 'Delivery charge the customer pays — inside Dhaka',
    unit: 'taka',
    real: 'chargeInside',
  },
  {
    key: 'chargeOutside',
    label: 'Delivery charge the customer pays — outside Dhaka',
    unit: 'taka',
    real: 'chargeOutside',
  },
  {
    key: 'courierFeeInside',
    label: 'What Pathao charges you — inside Dhaka',
    unit: 'taka',
    real: 'courierFeeInside',
  },
  {
    key: 'courierFeeOutside',
    label: 'What Pathao charges you — outside Dhaka',
    unit: 'taka',
    real: 'courierFeeOutside',
  },
  {
    key: 'returnRate',
    label: 'Out of 100 parcels, how many come back?',
    unit: 'pct',
    hint: "The customer refuses it or isn't home. You still pay Pathao, both ways.",
    real: 'returnRate',
  },
  { key: 'packaging', label: 'Box, bag and tape for one order', unit: 'taka' },
];

const MORE_FIELDS: Field[] = [
  {
    key: 'freeDeliveryShare',
    label: 'Out of 100 orders, how many get free delivery?',
    unit: 'pct',
    hint: 'Big orders over the free-delivery amount, or a free-delivery coupon.',
    real: 'freeDeliveryShare',
  },
  {
    key: 'codChargePct',
    label: "Pathao's cash-collection charge",
    unit: 'pct',
    step: 0.1,
    hint: 'A small % of the cash Pathao collects for you.',
  },
  {
    key: 'returnChargePct',
    label: 'Return fee, as a % of the delivery fee',
    unit: 'pct',
    hint: '100 means Pathao charges the full delivery fee again to bring a parcel back.',
  },
  { key: 'smsPerOrder', label: 'Text messages sent per order', unit: 'count' },
  { key: 'smsPrice', label: 'Cost of one text message', unit: 'taka', step: 0.05 },
  {
    key: 'paymentFeePct',
    label: 'Online payment fee (bKash, card)',
    unit: 'pct',
    step: 0.1,
    hint: 'Leave at 0 while customers pay cash on delivery.',
  },
];

const LEVEL_NAMES = ['low', 'typical', 'high'];

const fmt = (v: number, unit: Unit) => (unit === 'taka' ? money(v) : unit === 'pct' ? `${v}%` : String(v));

/** A number box that lets you clear it and type freely; it reports a number (blank = 0). */
function NumberInput({
  value,
  onChange,
  unit,
  step,
  id,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  unit: Unit;
  step?: number;
  id?: string;
  label?: string;
}) {
  const [text, setText] = useState(String(value));
  // Follow changes made elsewhere ("fill from my real orders", "start again"), adjusting during render.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (Number(text || 0) !== value) setText(String(value));
  }
  return (
    <div className="relative">
      {unit === 'taka' && (
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
          ৳
        </span>
      )}
      <Input
        id={id}
        aria-label={label}
        type="number"
        inputMode="decimal"
        min={0}
        max={unit === 'pct' ? 100 : undefined}
        step={step ?? 1}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n >= 0) onChange(n);
        }}
        className={cn('tabular-nums', unit === 'taka' && 'pl-6', unit === 'pct' && 'pr-7')}
      />
      {unit === 'pct' && (
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
          %
        </span>
      )}
    </div>
  );
}

/** An editable list of named costs (startup or monthly). */
function CostList({
  lines,
  onChange,
  total,
}: {
  lines: Plan['startup'];
  onChange: (lines: Plan['startup']) => void;
  total: string;
}) {
  const set = (i: number, patch: Partial<Plan['startup'][number]>) =>
    onChange(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_8rem_auto] items-start gap-2">
          <div>
            <Input
              aria-label="What it's for"
              value={l.label}
              maxLength={80}
              onChange={(e) => set(i, { label: e.target.value })}
            />
            {l.note && <p className="mt-0.5 text-xs text-muted-foreground">{l.note}</p>}
          </div>
          <NumberInput
            label={`${l.label} amount`}
            unit="taka"
            value={l.amount}
            onChange={(amount) => set(i, { amount })}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${l.label}`}
            onClick={() => onChange(lines.filter((_, k) => k !== i))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={lines.length >= 40}
          onClick={() => onChange([...lines, { label: 'New cost', amount: 0, note: '' }])}
        >
          <Plus /> Add a cost
        </Button>
        <span className="text-sm">
          Total <span className="font-semibold tabular-nums">{total}</span>
        </span>
      </div>
    </div>
  );
}

/** One numbered answer: a short question and a sentence with the number in bold. */
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

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-foreground tabular-nums">{children}</strong>
);

export default function ProfitPlanner({
  initial,
  defaults,
  saved,
  updatedAt,
  actuals,
}: {
  initial: Plan;
  defaults: Plan;
  saved: boolean;
  updatedAt: string | null;
  actuals: Actuals;
}) {
  const [plan, setPlan] = useState<Plan>(initial);
  const [base, setBase] = useState({ plan: initial, saved, updatedAt });
  const [level, setLevel] = useState(1);
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  const a = useMemo(() => analyse(plan), [plan]);
  const s = a.scenarios[level]!;
  const u = s.unit;
  const dirty = JSON.stringify(plan) !== JSON.stringify(base.plan);
  const blankLabel = [...plan.startup, ...plan.monthly].some((l) => !l.label.trim());
  const stockMissing = plan.startup.some((l) => /stock/i.test(l.label) && l.amount === 0);
  const examplePrice = 1000;
  const exampleKeep = Math.round((examplePrice * s.margin) / 100);

  const setPer = (key: PerOrderKey, v: number) => setPlan((p) => ({ ...p, perOrder: { ...p.perOrder, [key]: v } }));

  const fillFromReal = () => {
    const per = { ...plan.perOrder };
    let filled = 0;
    for (const f of [...MAIN_FIELDS, ...MORE_FIELDS]) {
      const v = f.real ? actuals[f.real] : null;
      if (typeof v === 'number' && per[f.key] !== v) {
        per[f.key] = v;
        filled++;
      }
    }
    if (!filled) {
      toast.info(
        actuals.orders
          ? 'Your numbers already match your real orders.'
          : 'There are no real orders in the last 90 days yet, so there is nothing to copy.',
      );
      return;
    }
    setPlan({ ...plan, perOrder: per });
    toast.success(`Filled ${filled} number${filled === 1 ? '' : 's'} from your real orders. Press Save to keep them.`);
  };

  const startAgain = async () => {
    const ok = await confirm({
      title: 'Start again with typical figures?',
      description: 'Every number goes back to a typical Bangladesh online shop. Nothing is saved until you press Save.',
      action: 'Start again',
    });
    if (ok) setPlan(defaults);
  };

  const save = () =>
    start(async () => {
      const r = await saveProfitPlanAction(plan);
      if (!r.ok) return void toast.error(r.error);
      setBase({ plan, saved: true, updatedAt: r.updatedAt });
      toast.success('Saved');
    });

  const field = (f: Field) => {
    const real = f.real ? actuals[f.real] : null;
    return (
      <div key={f.key} className="grid content-start gap-1.5">
        <Label htmlFor={`po-${f.key}`} className="leading-snug">
          {f.label}
        </Label>
        <NumberInput
          id={`po-${f.key}`}
          unit={f.unit}
          step={f.step}
          value={plan.perOrder[f.key]}
          onChange={(v) => setPer(f.key, v)}
        />
        {(typeof real === 'number' || f.hint) && (
          <p className="text-xs text-muted-foreground">
            {f.hint}
            {typeof real === 'number' && <span className="block">Your real orders so far: {fmt(real, f.unit)}</span>}
          </p>
        )}
      </div>
    );
  };

  // Where one order's money goes, top to bottom.
  const steps: [string, number][] = [
    ['Buying or making the product', u.costs.product],
    ['Pathao delivery fee', u.costs.courier],
    ['Pathao fee for parcels that come back', u.costs.returns],
    ['Cash-collection and payment fees', u.costs.cod + u.costs.payment],
    ['Box, bag and tape', u.costs.packaging],
    ['Text messages', u.costs.sms],
  ];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={!dirty || pending || blankLabel}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" onClick={() => setPlan(base.plan)} disabled={!dirty || pending}>
          Undo changes
        </Button>
        <Button variant="outline" onClick={fillFromReal}>
          Fill from my real orders
        </Button>
        <Button variant="ghost" onClick={startAgain}>
          Start again
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {dirty
            ? 'You have changes that are not saved'
            : base.saved && base.updatedAt
              ? `Saved ${dhakaDateTime(base.updatedAt)}`
              : 'Showing typical figures for a Bangladesh online shop — not saved yet'}
        </span>
      </div>

      {/* Step 0: pick how much of the price is left after paying for the product */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How much of the price do you keep?</CardTitle>
          <CardDescription>
            After paying for the product itself (buying it, or the cloth and the tailor). You don&apos;t know your
            product costs yet, so try each one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How much of the price you keep">
            {a.scenarios.map((x, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={level === i}
                onClick={() => setLevel(i)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-left text-sm transition-colors',
                  level === i ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                )}
              >
                <span className="block text-lg font-semibold tabular-nums">{x.margin}%</span>
                <span className={level === i ? 'opacity-80' : 'text-muted-foreground'}>{LEVEL_NAMES[i]}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Example at {s.margin}%: you sell a table runner for <B>{money(examplePrice)}</B>. It cost you{' '}
            <B>{money(examplePrice - exampleKeep)}</B>, so <B>{money(exampleKeep)}</B> is left to pay for delivery, ads,
            staff and your profit.
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Change these three choices</summary>
            <div className="mt-2 flex flex-wrap gap-4">
              {plan.margins.map((m, i) => (
                <div key={i} className="grid w-32 gap-1.5">
                  <Label htmlFor={`margin-${i}`}>{LEVEL_NAMES[i]}</Label>
                  <NumberInput
                    id={`margin-${i}`}
                    unit="pct"
                    value={m}
                    onChange={(v) => setPlan({ ...plan, margins: plan.margins.map((x, k) => (k === i ? v : x)) })}
                  />
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      {/* The answers, as sentences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your answers, if you keep {s.margin}% of the price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Answer n={1} question="How many orders do I need?">
            {s.breakEven === null ? (
              <>
                At this level <B>every order loses money</B>. Raise your prices, or lower the costs below.
              </>
            ) : (
              <>
                Your costs every month are <B>{money(a.fixed)}</B>. To pay them you need{' '}
                <B>{s.breakEven.toLocaleString('en-IN')} orders a month</B> (about {Math.ceil(s.breakEven / 30)} a day).
                Fewer orders than that, and you lose money that month.
                {s.firstProfitMonth
                  ? ` With the orders you expect, you get there in month ${s.firstProfitMonth}.`
                  : ' With the orders you expect, you don’t get there in the first year.'}
              </>
            )}
          </Answer>
          <Answer n={2} question="When do I get my starting money back?">
            You spend <B>{money(a.invest)}</B> before opening.{' '}
            {s.paybackMonth ? (
              <>
                You earn it all back by the <B>end of month {s.paybackMonth}</B>.
              </>
            ) : (
              <>
                You <B>don&apos;t earn it back within the first year</B>.
              </>
            )}
          </Answer>
          <Answer n={3} question="How much will I make in the first year?">
            {s.net12 >= 0 ? (
              <>
                After 12 months you have <B>{money(s.net12)} more</B> than you put in
                {s.roi12 !== null && s.roi12 > 0 && (
                  <>
                    {' '}
                    — about <B>৳{s.roi12.toFixed(1)}</B> profit for every ৳1 you put in
                  </>
                )}
                .
              </>
            ) : (
              <>
                After 12 months you are still <B>{money(-s.net12)} short</B> of what you put in.
              </>
            )}
            {stockMissing && (
              <span className="block text-sm text-muted-foreground">
                This doesn&apos;t include your first stock purchase yet (it&apos;s ৳0 below), so the real figure will be
                lower.
              </span>
            )}
          </Answer>
          <Answer n={4} question="How much do I keep from one order?">
            {u.profit >= 0 ? (
              <>
                About <B>{money(u.profit)}</B>, after paying for the product, delivery, packaging and returns. Your
                monthly costs (ads, staff, rent) come out of this.
              </>
            ) : (
              <>
                Nothing: each order <B>loses {money(-u.profit)}</B> before your monthly costs.
              </>
            )}
          </Answer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your money over the first year</CardTitle>
            <CardDescription>
              The line starts below ৳0 because you spend {money(a.invest)} before opening. Where it crosses ৳0, you have
              earned it all back; above that is profit. Point at the line to see each month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CumulativeChart invest={a.invest} months={s.months} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where the money from one order goes</CardTitle>
            <CardDescription>
              An average order. It&apos;s a little less than {money(plan.perOrder.averageItemValue)} plus delivery,
              because {plan.perOrder.returnRate} in 100 parcels come back and pay nothing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between gap-4 font-medium">
                <span>The customer pays (products + delivery)</span>
                <span className="tabular-nums">{money(u.revenue)}</span>
              </li>
              {steps.map(([label, v]) => (
                <li key={label} className="flex justify-between gap-4 text-muted-foreground">
                  <span>− {label}</span>
                  <span className="tabular-nums">−{money(v)}</span>
                </li>
              ))}
              <li
                className={cn(
                  'flex justify-between gap-4 border-t pt-2 font-semibold',
                  u.profit < 0 && 'text-destructive',
                )}
              >
                <span>= You keep</span>
                <span className="tabular-nums">{money(u.profit)}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Month by month</CardTitle>
          <CardDescription>
            Type how many orders you expect each month.
            {actuals.ordersPerMonth !== null && ` Lately you've had about ${actuals.ordersPerMonth} a month.`} Red means
            a loss.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="w-28">Orders you expect</TableHead>
                <TableHead className="text-right">Profit or loss that month</TableHead>
                <TableHead className="text-right">Where you stand</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.months.map((m, i) => (
                <TableRow key={i}>
                  <TableCell>{m.month}</TableCell>
                  <TableCell>
                    <NumberInput
                      label={`Orders you expect in month ${m.month}`}
                      unit="count"
                      value={plan.orders[i]!}
                      onChange={(v) =>
                        setPlan({ ...plan, orders: plan.orders.map((x, k) => (k === i ? Math.round(v) : x)) })
                      }
                    />
                  </TableCell>
                  <TableCell className={cn('text-right tabular-nums', m.profit < 0 && 'text-destructive')}>
                    {money(m.profit)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {m.cumulative < 0 ? (
                      <span className="text-muted-foreground">{money(-m.cumulative)} still to earn back</span>
                    ) : (
                      <span>{money(m.cumulative)} profit</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* The inputs, as three plain steps */}
      <div>
        <h2 className="text-lg font-semibold">Your numbers</h2>
        <p className="text-sm text-muted-foreground">
          These start as typical figures for a Bangladesh online shop. Change any you know; the answers above update as
          you type. Press Save when you&apos;re done.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Money spent before opening</CardTitle>
            <CardDescription>Paid once. This is the money you want to earn back.</CardDescription>
          </CardHeader>
          <CardContent>
            <CostList
              lines={plan.startup}
              onChange={(startup) => setPlan({ ...plan, startup })}
              total={money(a.invest)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Costs you pay every month</CardTitle>
            <CardDescription>Paid whether you get many orders or none.</CardDescription>
          </CardHeader>
          <CardContent>
            <CostList
              lines={plan.monthly}
              onChange={(monthly) => setPlan({ ...plan, monthly })}
              total={`${money(a.fixed)} a month`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. About a typical order</CardTitle>
          <CardDescription>
            {actuals.orders
              ? `Under some boxes you can see the real figure from your last ${actuals.orders} orders.`
              : 'Once real orders come in, you can fill these from them with “Fill from my real orders”.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">{MAIN_FIELDS.map(field)}</div>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              More details (small costs — usually fine as they are)
            </summary>
            <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{MORE_FIELDS.map(field)}</div>
          </details>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Not included: VAT and tax, a salary for yourself, loan interest, and stock that gets damaged or doesn&apos;t
        sell.
      </p>
    </div>
  );
}
