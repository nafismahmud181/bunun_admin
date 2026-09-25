import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import NoteForm from '@/components/orders/NoteForm';
import StatusActions from '@/components/orders/StatusActions';
import StatusBadge from '@/components/orders/StatusBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient, errorMessage } from '@/lib/api/client';
import { PAYMENT_LABEL, STATUS_LABEL, dhakaDateTime, taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export async function generateMetadata({ params }: PageProps<'/orders/[orderNo]'>): Promise<Metadata> {
  return { title: (await params).orderNo };
}

const SMS_LABEL: Record<string, string> = {
  order_placed: 'Order received',
  order_confirmed: 'Order confirmed',
  order_shipped: 'On its way',
  order_cancelled: 'Cancelled',
};

export default async function OrderPage({ params }: PageProps<'/orders/[orderNo]'>) {
  const admin = await requireAdmin('orders:read');
  const { orderNo } = await params;
  const {
    data: o,
    error,
    response,
  } = await (
    await adminApi()
  ).GET('/api/v1/admin/orders/{orderNo}', {
    params: { path: { orderNo }, header: {} },
  });
  if (response.status === 404) notFound();
  if (!o) return <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the order.')}</p>;

  const canWrite = admin.permissions.includes('orders:write');
  const locations = canWrite && o.editable ? ((await apiClient().GET('/api/v1/locations')).data ?? []) : [];
  const c = o.customer;
  const finished = c.delivered + c.returned;
  const successRate = finished ? Math.round((c.delivered / finished) * 100) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
            ← Orders
          </Link>
          <h1 className="flex items-center gap-3 text-xl font-semibold">
            {o.orderNo} <StatusBadge status={o.status} />
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {dhakaDateTime(o.createdAt)} · {o.source === 'web' ? 'Website' : o.source} ·{' '}
            {PAYMENT_LABEL[o.paymentMethod]} · {PAYMENT_LABEL[o.paymentStatus]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${c.phone}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Call {c.phone}
          </a>
          <Link
            href={`/print/orders/${o.orderNo}/invoice`}
            target="_blank"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Invoice
          </Link>
          <Link
            href={`/print/orders/${o.orderNo}/packing-slip`}
            target="_blank"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Packing slip
          </Link>
        </div>
      </div>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Next step</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusActions orderNo={o.orderNo} allowed={o.allowedTransitions} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.items.map((i) => (
                    <TableRow key={i.sku}>
                      <TableCell>
                        {i.name} <span className="text-muted-foreground">· {i.label}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">{taka(i.unitPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums">{i.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{taka(i.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Subtotal</TableCell>
                    <TableCell className="text-right tabular-nums">{taka(o.subtotal)}</TableCell>
                  </TableRow>
                  {o.discount > 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>Discount</TableCell>
                      <TableCell className="text-right tabular-nums">−{taka(o.discount)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4}>
                      Delivery ({o.address.zone === 'inside-dhaka' ? 'inside Dhaka' : 'outside Dhaka'})
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.deliveryFee ? taka(o.deliveryFee) : 'Free'}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell colSpan={4}>
                      {o.paymentMethod === 'cod' && o.paymentStatus !== 'paid' ? 'To collect' : 'Total'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{taka(o.total)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Staff notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canWrite && <NoteForm orderNo={o.orderNo} />}
              {o.staffNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              <ul className="space-y-3">
                {o.staffNotes.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.by} · {dhakaDateTime(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l pl-4">
                {o.history.map((h, i) => (
                  <li key={i} className="text-sm">
                    <p>
                      <span className="font-medium">{STATUS_LABEL[h.to]}</span>{' '}
                      <span className="text-muted-foreground">
                        by {h.by} · {dhakaDateTime(h.at)}
                      </span>
                    </p>
                    {h.note && <p className="text-muted-foreground">“{h.note}”</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{c.name}</p>
              <p>{c.phone}</p>
              <p className="pt-2 text-muted-foreground">
                {c.orders} order{c.orders === 1 ? '' : 's'} · {c.delivered} delivered · {c.cancelled} cancelled ·{' '}
                {c.returned} returned
              </p>
              <p className="text-muted-foreground">
                {successRate === null ? 'No completed deliveries yet' : `${successRate}% delivery success`} · spent{' '}
                {taka(c.spent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Delivery address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                {o.address.line}
                <br />
                {o.address.area}, {o.address.district}
                <br />
                {o.address.division} Division
              </p>
              {o.notes && (
                <p className="rounded-md bg-muted p-2">
                  <span className="text-xs text-muted-foreground">Customer note: </span>
                  {o.notes}
                </p>
              )}
              {canWrite && o.editable && <EditOrderDialog order={o} locations={locations} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">SMS</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {o.sms.map((m, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{SMS_LABEL[m.template] ?? m.template}</span>
                    <span className="text-muted-foreground">
                      {m.status === 'sent' ? 'Sent' : m.status === 'failed' ? 'Failed' : 'Queued'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
