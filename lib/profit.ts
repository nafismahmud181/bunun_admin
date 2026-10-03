import type { components } from '@/lib/api/schema';
import { taka } from '@/lib/orders';

// The profit planner's maths, run in the browser as the owner types. Same model as
// Bunon_ROI_Model.xlsx: per order shipped, a returned parcel earns nothing but still costs the
// outbound courier fee, the return charge, packaging and SMS; its product goes back to stock.

export type Plan = components['schemas']['ProfitPlan'];
export type Actuals = components['schemas']['StoreActuals'];

const share = (pct: number) => pct / 100;

/** Taka with a proper minus in front for losses: −৳945 rather than ৳-945. */
export const money = (v: number) => (Math.round(v) < 0 ? `−${taka(-v)}` : taka(v));

export function orderBasics(plan: Plan) {
  const p = plan.perOrder;
  const inside = share(p.insideDhakaShare);
  return {
    // Delivery charged, after the orders that get it free.
    chargeAvg: (1 - share(p.freeDeliveryShare)) * (inside * p.chargeInside + (1 - inside) * p.chargeOutside),
    // What the courier charges you, on every parcel.
    feeAvg: inside * p.courierFeeInside + (1 - inside) * p.courierFeeOutside,
    smsCost: p.smsPerOrder * p.smsPrice,
  };
}

/** One order's money at a given product margin (%), before fixed costs. */
export function perOrder(plan: Plan, marginPct: number) {
  const p = plan.perOrder;
  const { chargeAvg, feeAvg, smsCost } = orderBasics(plan);
  const delivered = 1 - share(p.returnRate);
  const itemValue = delivered * p.averageItemValue;
  const deliveryCollected = delivered * chargeAvg;
  const revenue = itemValue + deliveryCollected;
  const costs = {
    product: itemValue * (1 - share(marginPct)),
    courier: feeAvg,
    returns: share(p.returnRate) * feeAvg * share(p.returnChargePct),
    cod: share(p.codChargePct) * revenue,
    payment: share(p.paymentFeePct) * revenue,
    packaging: p.packaging,
    sms: smsCost,
  };
  const profit = revenue - Object.values(costs).reduce((a, c) => a + c, 0);
  return { itemValue, deliveryCollected, revenue, costs, profit };
}

export interface Month {
  month: number;
  orders: number;
  revenue: number;
  profit: number;
  cumulative: number;
}

/** Everything the page shows, for each of the three margin scenarios. */
export function analyse(plan: Plan) {
  const invest = plan.startup.reduce((a, c) => a + c.amount, 0);
  const fixed = plan.monthly.reduce((a, c) => a + c.amount, 0);
  const scenarios = plan.margins.map((margin) => {
    const unit = perOrder(plan, margin);
    let cumulative = -invest;
    const months: Month[] = plan.orders.map((orders, i) => {
      const profit = orders * unit.profit - fixed;
      cumulative += profit;
      return { month: i + 1, orders, revenue: orders * unit.revenue, profit, cumulative };
    });
    const breakEven = unit.profit > 0 ? Math.ceil(fixed / unit.profit) : null;
    const net = months.at(-1)!.cumulative;
    return {
      margin,
      unit,
      breakEven,
      months,
      firstProfitMonth: months.find((m) => m.profit > 0)?.month ?? null,
      paybackMonth: months.find((m) => m.cumulative >= 0)?.month ?? null,
      profit12: months.reduce((a, m) => a + m.profit, 0),
      net12: net,
      roi12: invest > 0 ? net / invest : null,
    };
  });
  return { invest, fixed, ...orderBasics(plan), scenarios };
}

export type Analysis = ReturnType<typeof analyse>;
