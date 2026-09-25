import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { currentAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await currentAdmin()) redirect('/');
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <LoginForm />
    </main>
  );
}
