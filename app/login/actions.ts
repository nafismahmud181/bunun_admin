'use server';

import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { errorMessage } from '@/lib/api/client';
import { PENDING_COOKIE, SESSION_COOKIE, adminApi, clearCookie, setSessionCookie } from '@/lib/session';

export type LoginState =
  { step: 'password'; error?: string } | { step: 'code'; setup?: { secret: string; qr: string }; error?: string };

/** Step 1: email and password. On success the next step is the authenticator code (and setup, the first time). */
export async function submitPassword(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { step: 'password', error: 'Enter your email and password.' };

  const { data, error } = await (await adminApi()).POST('/api/v1/admin/auth/login', { body: { email, password } });
  if (!data) return { step: 'password', error: errorMessage(error) };
  await setSessionCookie(PENDING_COOKIE, data.token, data.expiresAt);
  if (!data.setup) return { step: 'code' };
  return {
    step: 'code',
    setup: { secret: data.setup.secret, qr: await QRCode.toDataURL(data.setup.otpauthUrl, { margin: 1, width: 220 }) },
  };
}

/** Step 2: the 6-digit code. Turns the short-lived token into a full session. */
export async function submitCode(prev: LoginState, form: FormData): Promise<LoginState> {
  const code = String(form.get('code') ?? '').replace(/\D/g, '');
  const setup = prev.step === 'code' ? prev.setup : undefined;
  if (code.length !== 6) return { step: 'code', setup, error: 'Enter the 6-digit code from your authenticator app.' };

  const { data, error } = await (
    await adminApi(PENDING_COOKIE)
  ).POST('/api/v1/admin/auth/2fa', {
    params: { header: {} },
    body: { code },
  });
  if (!data) {
    const expired = error && 'code' in error && error.code === 'SESSION_EXPIRED';
    if (expired) await clearCookie(PENDING_COOKIE);
    return expired
      ? { step: 'password', error: errorMessage(error) }
      : { step: 'code', setup, error: errorMessage(error) };
  }
  await clearCookie(PENDING_COOKIE);
  await setSessionCookie(SESSION_COOKIE, data.token, data.expiresAt);
  redirect('/');
}

export async function signOut() {
  await (await adminApi()).POST('/api/v1/admin/auth/logout', { params: { header: {} } }).catch(() => {});
  await clearCookie(SESSION_COOKIE);
  redirect('/login');
}
