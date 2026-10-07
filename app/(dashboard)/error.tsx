'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Shown inside the admin layout when a page fails, e.g. the API is unreachable.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">This page couldn&apos;t load. Please try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
