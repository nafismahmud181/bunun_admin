import type { Metadata } from 'next';
import BlockList from '@/components/settings/BlockList';
import SettingsForm from '@/components/settings/SettingsForm';
import { AreaZones, ZonesTable } from '@/components/settings/ZonesEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { adminApi, requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireAdmin('settings:write');
  const api = await adminApi();
  const h = { params: { header: {} } };
  const [{ data: settings }, { data: zones }, { data: blocked }, { data: locations }] = await Promise.all([
    api.GET('/api/v1/admin/settings', h),
    api.GET('/api/v1/admin/delivery-zones', h),
    api.GET('/api/v1/admin/blocked', h),
    apiClient().GET('/api/v1/locations'),
  ]);
  if (!settings || !zones || !blocked || !locations)
    return <p className="text-sm text-destructive">Could not load settings.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Store and delivery</CardTitle>
          <CardDescription>Changes show on the storefront within seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Delivery zones</CardTitle>
          <CardDescription>
            Each area uses one zone&apos;s fee. Areas without a zone use &quot;Outside Dhaka&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ZonesTable zones={zones} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Which areas use which zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaZones locations={locations} zones={zones} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Block list</CardTitle>
          <CardDescription>
            Phone numbers and IP addresses that can&apos;t order on the website. Customers can also be blocked from
            their page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlockList items={blocked} />
        </CardContent>
      </Card>
    </div>
  );
}
