'use client';

import { useActionState } from 'react';
import { submitCode, submitPassword, type LoginState } from '@/app/login/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  // One form action; each submission goes to the step the form is on.
  const [state, action, pending] = useActionState(
    (prev: LoginState, form: FormData) =>
      prev.step === 'password' ? submitPassword(prev, form) : submitCode(prev, form),
    { step: 'password' } as LoginState,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Bunon Admin</CardTitle>
        <CardDescription>
          {state.step === 'password'
            ? 'Sign in to manage the store.'
            : state.setup
              ? 'Set up two-factor authentication to finish signing in.'
              : 'Enter the code from your authenticator app.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.step === 'password' ? (
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Checking…' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form action={action} className="space-y-4">
            {state.setup && (
              <div className="space-y-2 text-sm">
                <p>
                  1. Scan this with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.setup.qr} alt="Authenticator QR code" width={220} height={220} className="mx-auto" />
                <p className="text-muted-foreground">
                  Can&apos;t scan? Enter this key:{' '}
                  <code className="break-all font-mono text-foreground">{state.setup.secret}</code>
                </p>
                <p>2. Enter the 6-digit code it shows.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Authenticator code</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                required
                autoFocus
                className="font-mono tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Checking…' : state.setup ? 'Turn on and sign in' : 'Sign in'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
