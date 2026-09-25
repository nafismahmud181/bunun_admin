'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  inviteStaffAction,
  resetStaffAction,
  signOutStaffAction,
  updateStaffAction,
} from '@/app/(dashboard)/staff/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/lib/api/schema';
import { dhakaDateTime } from '@/lib/orders';

type Member = components['schemas']['StaffMember'];
type Role = components['schemas']['AdminRole'];
const ROLES: [Role, string][] = [
  ['owner', 'Owner'],
  ['manager', 'Manager'],
  ['order_handler', 'Order handler'],
  ['content_editor', 'Content editor'],
];
const select = 'h-8 rounded-md border bg-background px-2 text-sm';

/** Shows a one-time password once, with a copy button. */
function PasswordDialog({
  shown,
  onClose,
}: {
  shown: { email: string; password: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={shown !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>One-time password</DialogTitle>
          <DialogDescription>
            Give this to {shown?.email} privately (not by email or chat). It is shown only now. They set up two-factor
            authentication when they first sign in, and can change the password under Account.
          </DialogDescription>
        </DialogHeader>
        <code className="block rounded-md bg-muted p-3 text-center font-mono text-lg tracking-wide">
          {shown?.password}
        </code>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => shown && navigator.clipboard.writeText(shown.password).then(() => toast.success('Copied'))}
          >
            Copy
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffManager({ staff, meId }: { staff: Member[]; meId: number }) {
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'order_handler' as Role });
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; password?: string }>, msg: string, email?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(msg);
      if (r.password && email) setShown({ email, password: r.password });
    });

  return (
    <div className="space-y-3">
      <Button onClick={() => setInviting(true)}>Add staff member</Button>
      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Two-factor</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((m) => {
              const me = m.id === meId;
              return (
                <TableRow key={m.id} className={m.active ? '' : 'opacity-60'}>
                  <TableCell>
                    <div className="font-medium">
                      {m.name}
                      {me && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      {!m.active && <span className="ml-2 text-xs text-destructive">disabled</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </TableCell>
                  <TableCell>
                    <select
                      key={m.role}
                      className={select}
                      defaultValue={m.role}
                      disabled={me || pending}
                      aria-label={`Role of ${m.name}`}
                      onChange={(e) =>
                        run(
                          () => updateStaffAction(m.id, { role: e.target.value as Role }),
                          'Role changed; they were signed out',
                        )
                      }
                    >
                      {ROLES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    {m.twoFactorSetUp ? 'On' : <span className="text-amber-700">Not set up yet</span>}
                  </TableCell>
                  <TableCell>{m.lastLoginAt ? dhakaDateTime(m.lastLoginAt) : 'Never'}</TableCell>
                  <TableCell className="tabular-nums">{m.activeSessions}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {!me && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending || m.activeSessions === 0}
                          onClick={() => run(() => signOutStaffAction(m.id), 'Signed out everywhere')}
                        >
                          Sign out
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() =>
                            confirm(`Give ${m.name} a new password? Their two-factor setup is reset too.`) &&
                            run(() => resetStaffAction(m.id), 'Password reset', m.email)
                          }
                        >
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant={m.active ? 'destructive' : 'outline'}
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => updateStaffAction(m.id, { active: !m.active }),
                              m.active ? 'Disabled and signed out' : 'Enabled',
                            )
                          }
                        >
                          {m.active ? 'Disable' : 'Enable'}
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={inviting} onOpenChange={(o) => !pending && setInviting(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
            <DialogDescription>You&apos;ll get a one-time password to give them.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="s-name">Name</Label>
              <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-email">Email</Label>
              <Input
                id="s-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-role">Role</Label>
              <select
                id="s-role"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviting(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              disabled={pending || form.name.trim().length < 2 || !form.email.includes('@')}
              onClick={() =>
                start(async () => {
                  const r = await inviteStaffAction(form.email.trim(), form.name.trim(), form.role);
                  if (!r.ok) return void toast.error(r.error);
                  setInviting(false);
                  setShown({ email: form.email.trim(), password: r.password! });
                  setForm({ email: '', name: '', role: 'order_handler' });
                })
              }
            >
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PasswordDialog shown={shown} onClose={() => setShown(null)} />
    </div>
  );
}
