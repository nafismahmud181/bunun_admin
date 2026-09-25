'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addNoteAction } from '@/app/(dashboard)/orders/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function NoteForm({ orderNo }: { orderNo: string }) {
  const [body, setBody] = useState('');
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addNoteAction(orderNo, body);
          if (r.ok) setBody('');
          else toast.error(r.error);
        });
      }}
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add an internal note (the customer never sees these)"
        maxLength={2000}
        rows={2}
        aria-label="New note"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending || !body.trim()}>
        {pending ? 'Saving…' : 'Add note'}
      </Button>
    </form>
  );
}
