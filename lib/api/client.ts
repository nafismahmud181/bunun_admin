import 'server-only';
import createClient from 'openapi-fetch';
import type { paths } from './schema';

// Server-side only: the browser never calls the backend directly. The admin server holds the
// session in an httpOnly cookie and calls the API with it as a bearer token (see lib/session.ts).
export const API_URL = process.env.API_URL || 'http://localhost:4000';

/** A typed API client, authenticated when a session token is given. */
export function apiClient(token?: string | null, forwarded?: Record<string, string>) {
  return createClient<paths>({
    baseUrl: API_URL,
    headers: { ...forwarded, ...(token && { authorization: `Bearer ${token}` }) },
    // Admin data must always be fresh.
    fetch: (input: Request) => fetch(input, { cache: 'no-store' }),
  });
}

export type ApiError = { statusCode: number; code: string; message: string; details?: Record<string, unknown> };

/** A readable message from an API error body. */
export const errorMessage = (e: unknown, fallback = 'Something went wrong. Please try again.') =>
  e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' ? e.message : fallback;
