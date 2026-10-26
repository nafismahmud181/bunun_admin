import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeEditor } from '@/components/content/ThemeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { errorMessage } from '@/lib/api/client';
import { dhakaDateTime } from '@/lib/orders';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Appearance' };

const STORE = process.env.STOREFRONT_URL || 'http://localhost:3000';

export default async function AppearancePage() {
  await requireAdmin('content:write');
  const { data: c, error } = await (await adminApi()).GET('/api/v1/admin/content', { params: { header: {} } });
  if (!c) return <p className="text-sm text-destructive">{errorMessage(error, 'Could not load the colours.')}</p>;
  const saved = c.updatedAt.theme;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Link href="/content" className="text-sm text-muted-foreground hover:underline">
            ← Content
          </Link>
          <h1 className="text-xl font-semibold">Appearance</h1>
          <p className="text-sm text-muted-foreground">
            The store&apos;s colours. Changes go live on every page within a few seconds of saving.
          </p>
        </div>
        <a href={STORE} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
          Open the store ↗
        </a>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Colour palette</CardTitle>
          <CardDescription>
            {saved ? `Last changed ${dhakaDateTime(saved)}` : 'Showing the original colours'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeEditor key={saved ?? 'default'} theme={c.theme} isDefault={!saved} />
        </CardContent>
      </Card>
    </div>
  );
}
