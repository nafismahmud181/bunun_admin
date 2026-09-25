'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULES } from '@/lib/modules';

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {MODULES.map((m) => {
        const href = '/' + m.slug;
        const active = m.slug === '' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={m.label}
            href={href}
            className={`rounded-md px-3 py-2 text-sm ${
              active ? 'bg-brand font-medium text-white' : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
