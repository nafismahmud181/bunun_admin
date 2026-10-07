'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Last-resort page when even the root layout fails. It replaces the whole page, so it brings its
// own <html> and plain styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Something went wrong</h1>
        <p style={{ color: '#666' }}>Please try again in a moment.</p>
        <button onClick={reset} style={{ padding: '8px 16px', marginTop: 12 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
