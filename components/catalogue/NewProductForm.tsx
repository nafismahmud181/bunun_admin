'use client';

import { useActionState } from 'react';
import { createProductAction, type Result } from '@/app/(dashboard)/products/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewProductForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(
    async (_prev: Result | null, form: FormData) => createProductAction(form),
    null,
  );
  return (
    <form action={action} className="max-w-xl space-y-4">
      {state && !state.ok && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="nameEn">Name</Label>
        <Input
          id="nameEn"
          name="nameEn"
          required
          minLength={2}
          maxLength={150}
          placeholder="e.g. Nakshi Kantha Table Runner"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Choose…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="descriptionEn">Description</Label>
        <Textarea id="descriptionEn" name="descriptionEn" rows={4} maxLength={5000} />
      </div>
      <p className="text-sm text-muted-foreground">
        The product starts as a draft. Add sizes, prices and photos next, then publish it.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create draft'}
      </Button>
    </form>
  );
}
