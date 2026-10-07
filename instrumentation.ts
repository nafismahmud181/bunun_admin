import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
}

// Errors thrown while rendering or in server actions go to Sentry (when it's switched on).
export const onRequestError = Sentry.captureRequestError;
