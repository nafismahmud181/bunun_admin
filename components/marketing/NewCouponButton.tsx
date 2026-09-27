'use client';

import { useState } from 'react';
import CouponForm from '@/components/marketing/CouponForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function NewCouponButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New coupon</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogDescription>
              Shoppers enter the code at checkout. You can change limits and dates later.
            </DialogDescription>
          </DialogHeader>
          <CouponForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
