import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CouponForm from '@/components/marketing/CouponForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATE_CLASS, STATE_LABEL } from '@/lib/coupons';
import { STATUS_CLASS, STATUS_LABEL, type OrderStatus, dhakaDateTime, taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Coupon' };

export default async function CouponPage({ params }: PageProps<'/coupons/[id]'>) {
  const admin = await requireAdmin('coupons:write');
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const { data: c } = await (
    await adminApi()
  ).GET('/api/v1/admin/coupons/{id}', { params: { path: { id }, header: {} } });
  if (!c) notFound();
  const canSeeOrders = admin.permissions.includes('orders:read');

  const stats: [string, string][] = [
    ['Orders', c.usageLimit !== null ? `${c.usedCount} of ${c.usageLimit}` : String(c.usedCount)],
    ['Given away', taka(c.saved)],
    ['Order value', taka(c.orderTotal)],
  ];

  return (
    <div className="space-y-4">
      <Link href="/coupons" className="text-sm text-muted-foreground hover:underline">
        ← Coupons
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{c.code}</h1>
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', STATE_CLASS[c.state])}>
          {STATE_LABEL[c.state]}
        </span>
        <span className="text-muted-foreground">{c.summary}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <CouponForm key={`${c.id}-${c.usedCount}-${c.active}`} coupon={c} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orders that used it</CardTitle>
            <CardDescription>A cancelled order gives its use back.</CardDescription>
          </CardHeader>
          <CardContent>
            {c.redemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not used yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Saved</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.redemptions.map((r) => (
                    <TableRow key={r.orderNo}>
                      <TableCell>
                        {canSeeOrders ? (
                          <Link href={`/orders/${r.orderNo}`} className="font-medium hover:underline">
                            {r.orderNo}
                          </Link>
                        ) : (
                          r.orderNo
                        )}
                        <div className="text-xs text-muted-foreground">
                          {r.phone} · {dhakaDateTime(r.at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{taka(r.amount)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-xs',
                            STATUS_CLASS[r.status as OrderStatus] ?? 'bg-muted',
                          )}
                        >
                          {STATUS_LABEL[r.status as OrderStatus] ?? r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
