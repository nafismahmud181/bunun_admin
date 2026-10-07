import { orderBasics, type Plan } from '@/lib/profit';

// Profit on one product, using the delivery, courier, packaging and return figures from the
// Profit planner. One item per order: a bigger order shares the delivery and packaging, so it
// keeps more than this.

const share = (pct: number) => pct / 100;

/** One delivered order of this product, inside or outside Dhaka. */
export function oneSale(plan: Plan, price: number, cost: number, inside: boolean) {
  const p = plan.perOrder;
  const charge = inside ? p.chargeInside : p.chargeOutside;
  const courier = inside ? p.courierFeeInside : p.courierFeeOutside;
  const paid = price + charge;
  const fees = share(p.codChargePct + p.paymentFeePct) * paid;
  const other = p.packaging + p.smsPerOrder * p.smsPrice;
  return { paid, charge, cost, courier, fees, other, keep: paid - cost - courier - fees - other };
}

/**
 * The average order, counting free delivery and the parcels that come back (they pay nothing,
 * cost the courier both ways, and the product goes back to stock). Same model as the planner.
 */
export function averageSale(plan: Plan, price: number, cost: number) {
  const p = plan.perOrder;
  const { chargeAvg, feeAvg, smsCost } = orderBasics(plan);
  const delivered = 1 - share(p.returnRate);
  const k = share(p.codChargePct + p.paymentFeePct);
  // Costs that don't depend on the price: courier, returns, packaging, SMS.
  const steady = feeAvg + share(p.returnRate) * feeAvg * share(p.returnChargePct) + p.packaging + smsCost;
  const keepAt = (x: number) => delivered * (x + chargeAvg) * (1 - k) - delivered * cost - steady;
  return {
    keep: keepAt(price),
    /** The price that leaves `target` taka per order on average, rounded up to the next ৳10. */
    priceFor: (target: number) => {
      const exact = (target + delivered * cost + steady) / (delivered * (1 - k)) - chargeAvg;
      return Math.max(0, Math.ceil(exact / 10) * 10);
    },
  };
}

/** Share of the price left after the product cost, in % (the planner's "how much you keep"). */
export const keptShare = (price: number, cost: number) => (price > 0 ? ((price - cost) / price) * 100 : 0);
