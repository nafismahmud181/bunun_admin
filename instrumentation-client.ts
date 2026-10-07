import * as Sentry from '@sentry/nextjs';

// Sentry in the browser. Off until NEXT_PUBLIC_SENTRY_DSN is set (a DSN is meant to be public).
// No session replays, no tracing, and no form values, cookies or query strings.
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
