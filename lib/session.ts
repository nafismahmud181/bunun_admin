import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { API_URL, apiClient } from './api/client';
import type { components } from './api/schema';

export type AdminProfile = components['schemas']['AdminProfile'];
export type Permission = AdminProfile['permissions'][number];

// The session token lives in an httpOnly cookie on the admin site only. SameSite=Strict keeps
// other sites from using it; Next.js server actions also check the request origin.
export const SESSION_COOKIE = 'bunon_admin';
// Between the password and the authenticator code (10 minutes).
export const PENDING_COOKIE = 'bunon_admin_2fa';

const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: maxAgeSeconds,
});

export async function setSessionCookie(name: string, token: string, expiresAt: string) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  (await cookies()).set(name, token, cookieOptions(maxAge));
}

export async function clearCookie(name: string) {
  (await cookies()).delete(name);
}

/** The shopper-facing IP and browser, passed on so the API's rate limits and audit log see the real person. */
async function forwardedHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const out: Record<string, string> = {};
  // The last entry is the one added by our own proxy (Caddy); earlier ones can be set by anyone.
  const ip = h.get('x-forwarded-for')?.split(',').pop()?.trim() || h.get('x-real-ip');
  if (ip) out['x-forwarded-for'] = ip;
  const ua = h.get('user-agent');
  if (ua) out['user-agent'] = ua;
  return out;
}

/** An API client for the signed-in admin (or anonymous, for sign-in). */
export async function adminApi(tokenCookie: string = SESSION_COOKIE) {
  const token = (await cookies()).get(tokenCookie)?.value;
  return apiClient(token, await forwardedHeaders());
}

/** Sends a file upload (multipart form) to the API as the signed-in admin. */
export async function adminUpload(path: string, form: FormData) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { ...(await forwardedHeaders()), ...(token && { authorization: `Bearer ${token}` }) },
    body: form,
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, body };
}

/** The signed-in admin, or null. Cached for the rest of the request. */
export const currentAdmin = cache(async (): Promise<AdminProfile | null> => {
  if (!(await cookies()).get(SESSION_COOKIE)) return null;
  const { data } = await (await adminApi()).GET('/api/v1/admin/auth/me');
  return data ?? null;
});

/** The signed-in admin; sends everyone else to the sign-in page. Optionally requires a permission. */
export async function requireAdmin(permission?: Permission): Promise<AdminProfile> {
  const admin = await currentAdmin();
  if (!admin) redirect('/login');
  if (permission && !admin.permissions.includes(permission)) redirect('/?denied=1');
  return admin;
}
