import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ImageManager from '@/components/catalogue/ImageManager';
import ProductDetailsForm from '@/components/catalogue/ProductDetailsForm';
import DeleteProductButton from '@/components/catalogue/DeleteProductButton';
import ProductStatusBar from '@/components/catalogue/ProductStatusBar';
import VariantsEditor from '@/components/catalogue/VariantsEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { errorMessage } from '@/lib/api/client';
import { taka } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Product' };

export default async function ProductPage({ params }: PageProps<'/products/[id]'>) {
  const admin = await requireAdmin('products:read');
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const api = await adminApi();
  const [{ data: p, error, response }, { data: categories }] = await Promise.all([
    api.GET('/api/v1/admin/products/{id}', { params: { path: { id }, header: {} } }),
    api.GET('/api/v1/admin/categories', { params: { header: {} } }),
  ]);
  if (response.status === 404) notFound();
  if (!p) return <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the product.')}</p>;

  const canWrite = admin.permissions.includes('products:write');
  const canStock = admin.permissions.includes('inventory:write');
  const stock = p.variants.reduce((a, v) => a + v.stock, 0);
  const category = categories?.find((c) => c.id === p.categoryId);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link href="/products" className="text-sm text-muted-foreground hover:underline">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold">{p.nameEn}</h1>
        <p className="text-sm text-muted-foreground">
          {p.variants.length ? `From ${taka(p.priceFrom)}` : 'No price yet'} · {stock} in stock · in {p.orderCount}{' '}
          order
          {p.orderCount === 1 ? '' : 's'}
          {p.legacyId && ` · old id ${p.legacyId}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ProductStatusBar
          id={p.id}
          status={p.status}
          slug={p.slug}
          storefrontUrl={process.env.STOREFRONT_URL || 'http://localhost:3000'}
          canWrite={canWrite}
        />
        {canWrite && (
          <DeleteProductButton id={p.id} name={p.nameEn} orderCount={p.orderCount} afterDelete="/products" />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{category?.optionLabel ?? 'Size'} options and prices</CardTitle>
          <CardDescription>
            Each option has its own SKU, price and stock. The old price shows crossed out as a sale. The details
            recorded for each option are set per category (Categories → Options).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VariantsEditor
            productId={p.id}
            variants={p.variants}
            fields={category?.variantFields ?? []}
            optionLabel={category?.optionLabel ?? 'Size'}
            canWrite={canWrite}
            canStock={canStock}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageManager
            key={p.images.map((i) => `${i.id}:${i.alt}`).join(',')}
            productId={p.id}
            images={p.images}
            canWrite={canWrite}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductDetailsForm
            key={p.updatedAt}
            product={p}
            categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
            canWrite={canWrite}
          />
        </CardContent>
      </Card>
    </div>
  );
}
