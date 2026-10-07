import * as Sentry from '@sentry/nextjs';

// Sentry on the server (pages, server actions, route handlers). Off until NEXT_PUBLIC_SENTRY_DSN
// is set. Sends the error and where it happened, never request bodies, headers, cookies or query
// strings, so customer phone numbers and addresses stay out of Sentry.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;
Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  },
});
