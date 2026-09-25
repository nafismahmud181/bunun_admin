import type { Metadata } from 'next';
import CategoriesEditor from '@/components/catalogue/CategoriesEditor';
import { errorMessage } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const admin = await requireAdmin('products:read');
  const { data, error } = await (await adminApi()).GET('/api/v1/admin/categories', { params: { header: {} } });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          The order here is the order in the store menu. Click an image to change it. Hidden categories and their
          products stay off the store.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{errorMessage(error, 'Could not load categories.')}</p>
      ) : (
        <CategoriesEditor categories={data ?? []} canWrite={admin.permissions.includes('products:write')} />
      )}
    </div>
  );
}
