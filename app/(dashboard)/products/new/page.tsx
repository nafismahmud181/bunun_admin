import type { Metadata } from 'next';
import Link from 'next/link';
import NewProductForm from '@/components/catalogue/NewProductForm';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'New product' };

export default async function NewProductPage() {
  await requireAdmin('products:write');
  const { data: categories } = await (await adminApi()).GET('/api/v1/admin/categories', { params: { header: {} } });
  return (
    <div className="space-y-4">
      <Link href="/products" className="text-sm text-muted-foreground hover:underline">
        ← Products
      </Link>
      <h1 className="text-xl font-semibold">New product</h1>
      <NewProductForm categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
