import type { Metadata } from 'next';
import PrintButton from '@/components/PrintButton';
import { PAYMENT_LABEL, dhakaDate, taka } from '@/lib/orders';
import { loadPrintableOrder } from '@/lib/print-order';

export async function generateMetadata({ params }: PageProps<'/print/orders/[orderNo]/invoice'>): Promise<Metadata> {
  return { title: `Invoice ${(await params).orderNo}` };
}

export default async function InvoicePage({ params }: PageProps<'/print/orders/[orderNo]/invoice'>) {
  const { order: o, hotline, store } = await loadPrintableOrder((await params).orderNo);
  const due = o.paymentMethod === 'cod' && o.paymentStatus !== 'paid';
  return (
    <article className="space-y-6">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-2xl font-bold">{store.name}</p>
          <p className="mt-2 text-xs text-zinc-600">
            {store.address}
            <br />
            {hotline} · {store.email}
            <br />
            Trade licence {store.tradeLicence}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold">Invoice</p>
          <p className="font-mono">{o.orderNo}</p>
          <p className="text-xs text-zinc-600">Date {dhakaDate(o.createdAt)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Bill and deliver to</p>
          <p className="font-medium">{o.customer.name}</p>
          <p>{o.customer.phone}</p>
          <p>
            {o.address.line}, {o.address.area}, {o.address.district}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase text-zinc-500">Payment</p>
          <p>
            {PAYMENT_LABEL[o.paymentMethod]} · {PAYMENT_LABEL[o.paymentStatus]}
          </p>
        </div>
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-zinc-500">
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.sku} className="border-b">
              <td className="py-2">
                {i.name} · {i.label}
              </td>
              <td className="py-2 font-mono text-xs">{i.sku}</td>
              <td className="py-2 text-right">{taka(i.unitPrice)}</td>
              <td className="py-2 text-right">{i.qty}</td>
              <td className="py-2 text-right">{taka(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="pt-3 text-right">
              Subtotal
            </td>
            <td className="pt-3 text-right">{taka(o.subtotal)}</td>
          </tr>
          {o.discount > 0 && (
            <tr>
              <td colSpan={4} className="text-right">
                Discount
              </td>
              <td className="text-right">−{taka(o.discount)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={4} className="text-right">
              Delivery
            </td>
            <td className="text-right">{o.deliveryFee ? taka(o.deliveryFee) : 'Free'}</td>
          </tr>
          <tr className="text-base font-bold">
            <td colSpan={4} className="pt-2 text-right">
              {due ? 'Amount to pay on delivery' : 'Total'}
            </td>
            <td className="pt-2 text-right">{taka(o.total)}</td>
          </tr>
        </tfoot>
      </table>

      <footer className="border-t pt-4 text-xs text-zinc-600">
        Thank you for shopping with {store.name}. Unused items can be exchanged within 7 days. Questions? Call {hotline}
        .
      </footer>
    </article>
  );
}
