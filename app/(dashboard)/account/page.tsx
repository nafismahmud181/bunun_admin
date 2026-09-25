import type { Metadata } from 'next';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Account' };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          {me.name} · {me.email}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Lost your authenticator phone? Ask an owner to reset your account from the Staff page.
      </p>
    </div>
  );
}
