import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

const field = 'mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Bunun Admin</h1>
          <p className="text-sm text-zinc-500">Sign in to manage the store.</p>
        </div>
        <label className="block text-sm font-medium">
          Email
          <input className={field} type="email" name="email" autoComplete="username" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input className={field} type="password" name="password" autoComplete="current-password" />
        </label>
        <label className="block text-sm font-medium">
          Two-factor code
          <input className={field} inputMode="numeric" name="otp" autoComplete="one-time-code" maxLength={6} />
        </label>
        <button
          type="submit"
          disabled
          className="w-full rounded-md bg-brand py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sign in
        </button>
        <p className="text-center text-xs text-zinc-500">Auth arrives in Phase 3.</p>
      </form>
    </main>
  );
}
