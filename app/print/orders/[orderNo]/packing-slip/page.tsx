import type { Metadata } from 'next';
import PrintButton from '@/components/PrintButton';
import { dhakaDate, taka } from '@/lib/orders';
import { loadPrintableOrder } from '@/lib/print-order';
import { STORE_INFO } from '@/lib/store-info';

export async function generateMetadata({
  params,
}: PageProps<'/print/orders/[orderNo]/packing-slip'>): Promise<Metadata> {
  return { title: `Packing slip ${(await params).orderNo}` };
}

// For the packer: what goes in the parcel, and a large address label. No prices except the
// amount the courier collects.
export default async function PackingSlipPage({ params }: PageProps<'/print/orders/[orderNo]/packing-slip'>) {
  const { order: o, hotline } = await loadPrintableOrder((await params).orderNo);
  const collect = o.paymentMethod === 'cod' && o.paymentStatus !== 'paid' ? o.total : 0;
  const units = o.items.reduce((a, i) => a + i.qty, 0);
  return (
    <article className="space-y-6">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-xl font-bold">Packing slip</p>
          <p className="font-mono text-lg">{o.orderNo}</p>
          <p className="text-xs text-zinc-600">Placed {dhakaDate(o.createdAt)}</p>
        </div>
        <div className="text-right text-xs text-zinc-600">
          <p className="font-semibold text-black">{STORE_INFO.name}</p>
          <p>{STORE_INFO.address}</p>
          <p>{hotline}</p>
        </div>
      </header>

      <section className="rounded-md border-2 border-black p-4">
        <p className="text-xs font-semibold uppercase">Deliver to</p>
        <p className="text-lg font-bold">{o.customer.name}</p>
        <p className="text-lg">{o.customer.phone}</p>
        <p className="text-base">
          {o.address.line}
          <br />
          {o.address.area}, {o.address.district}
        </p>
        {o.notes && <p className="mt-2 italic">Note: {o.notes}</p>}
        <p className="mt-3 text-lg font-bold">
          {collect ? `Collect ${taka(collect)} (Cash on Delivery)` : 'Paid: collect nothing'}
        </p>
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-zinc-500">
            <th className="w-10 py-2">✓</th>
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.sku} className="border-b">
              <td className="py-3">
                <span className="inline-block h-4 w-4 border border-black" />
              </td>
              <td className="py-3">
                {i.name} · {i.label}
              </td>
              <td className="py-3 font-mono text-xs">{i.sku}</td>
              <td className="py-3 text-right text-base font-semibold">{i.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-right text-xs text-zinc-600">
        {units} item{units === 1 ? '' : 's'} in total
      </p>
    </article>
  );
}
