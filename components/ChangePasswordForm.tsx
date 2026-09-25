'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { changePasswordAction } from '@/app/(dashboard)/staff/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [pending, start] = useTransition();
  const mismatch = again.length > 0 && next !== again;
  const valid = current.length > 0 && next.length >= 12 && next === again;

  return (
    <form
      className="max-w-sm space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changePasswordAction(current, next);
          if (r.ok) {
            toast.success('Password changed. Your other sessions were signed out.');
            setCurrent('');
            setNext('');
            setAgain('');
          } else toast.error(r.error);
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="pw-current">Current password</Label>
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pw-next">New password</Label>
        <Input
          id="pw-next"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">At least 12 characters. A few random words work well.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pw-again">New password again</Label>
        <Input
          id="pw-again"
          type="password"
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
        />
        {mismatch && <p className="text-xs text-destructive">The two new passwords don&apos;t match.</p>}
      </div>
      <Button type="submit" disabled={!valid || pending}>
        {pending ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
