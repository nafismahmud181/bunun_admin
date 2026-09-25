import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlockButton, CustomerNotes } from '@/components/CustomerActions';
import StatusBadge from '@/components/orders/StatusBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api/client';
import { dhakaDate, dhakaDateTime, successRate, taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Customer' };
const SOURCE: Record<string, string> = {
  web: 'Website',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
  other: 'Other',
};

export default async function CustomerPage({ params }: PageProps<'/customers/[id]'>) {
  const admin = await requireAdmin('customers:read');
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const {
    data: c,
    error,
    response,
  } = await (await adminApi()).GET('/api/v1/admin/customers/{id}', { params: { path: { id }, header: {} } });
  if (response.status === 404) notFound();
  if (!c) return <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the customer.')}</p>;
  const canWrite = admin.permissions.includes('customers:write');

  return (
    <div className="space-y-4">
      <Link href="/customers" className="text-sm text-muted-foreground hover:underline">
        ← Customers
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">
            {c.phone}
            {c.email && ` · ${c.email}`} · customer since {dhakaDate(c.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${c.phone}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Call
          </a>
          {canWrite && <BlockButton id={c.id} phone={c.phone} blocked={!!c.blocked} />}
        </div>
      </div>
      {c.blocked && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Blocked from ordering online since {dhakaDateTime(c.blocked.since)}
          {c.blocked.reason && `: ${c.blocked.reason}`}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Orders', String(c.orders)],
          ['Delivered', String(c.delivered)],
          ['Delivery success', successRate(c.delivered, c.returned)],
          ['Spent', taka(c.spent)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <p className="text-xs text-muted-foreground">{label}</p>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.recentOrders.map((o) => (
                  <TableRow key={o.orderNo}>
                    <TableCell>
                      <Link href={`/orders/${o.orderNo}`} className="font-medium hover:underline">
                        {o.orderNo}
                      </Link>
                    </TableCell>
                    <TableCell>{dhakaDate(o.createdAt)}</TableCell>
                    <TableCell>{SOURCE[o.source] ?? o.source}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.items}</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(o.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerNotes key={c.notes ?? ''} id={c.id} notes={c.notes} canWrite={canWrite} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
