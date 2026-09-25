import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:block">
        <div className="flex h-14 items-center border-b border-zinc-200 px-5 font-semibold">Bunun Admin</div>
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
          <span className="font-semibold md:hidden">Bunun Admin</span>
          <span className="hidden text-sm text-zinc-500 md:block">Store management</span>
          <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">
            Sign in
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
