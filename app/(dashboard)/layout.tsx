import { signOut } from '@/app/login/actions';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { visibleModules } from '@/lib/modules';
import { requireAdmin } from '@/lib/session';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  order_handler: 'Order handler',
  content_editor: 'Content editor',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const modules = visibleModules(admin.permissions).map(({ slug, label }) => ({ slug, label }));
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-background md:block print:hidden">
        <div className="flex h-14 items-center border-b px-5 font-semibold">Bunon Admin</div>
        <Sidebar modules={modules} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4 md:px-6 print:hidden">
          <span className="font-semibold md:hidden">Bunon Admin</span>
          <span className="hidden text-sm text-muted-foreground md:block">Store management</span>
          <div className="flex items-center gap-3">
            <span className="text-right text-sm leading-tight">
              <span className="block font-medium">{admin.name}</span>
              <span className="block text-xs text-muted-foreground">{ROLE_LABEL[admin.role] ?? admin.role}</span>
            </span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
