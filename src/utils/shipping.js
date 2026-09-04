const ALLOWED_METHODS = new Set(['pickup', 'courier', 'post']);

export const SHIPPING_METHODS = [
  {
    id:    'pickup',
    label: 'Pick Up From Office',
    desc:  'Colombo 07 — Mon to Fri, 9am–5pm',
    tag:   'Free',
  },
  {
    id:    'courier',
    label: 'Courier Delivery',
    desc:  '1–2 Business Days',
  },
  {
    id:    'post',
    label: 'Post Office Delivery',
    desc:  '3–5 Business Days',
  },
];

const COURIER_BASE       = 350;
const COURIER_UNDER_1KG  = 200;
const COURIER_PER_KG     = 50;

const POST_BASE          = 450;
const POST_UNDER_1KG     = 300;
const POST_PER_KG        = 50;

const MAX_WEIGHT_KG      = 1000;

export function calcShipping(method, weightKg) {
  if (!ALLOWED_METHODS.has(method)) return 0;

  const weight = Number(weightKg);
  if (!isFinite(weight) || weight < 0) return 0;
  const safeWeight = Math.min(weight, MAX_WEIGHT_KG);

  if (method === 'pickup') return 0;

  if (method === 'courier') {
    if (safeWeight < 1)    return COURIER_UNDER_1KG;
    if (safeWeight === 1)  return COURIER_BASE;
    return COURIER_BASE + Math.ceil(safeWeight - 1) * COURIER_PER_KG;
  }

  if (method === 'post') {
    if (safeWeight < 1)    return POST_UNDER_1KG;
    if (safeWeight === 1)  return POST_BASE;
    return POST_BASE + Math.ceil(safeWeight - 1) * POST_PER_KG;
  }

  return 0;
}

export function calcTotalWeightKg(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, i) => {
    const weight   = Number(i.selectedVariant?.weight ?? i.product?.weight ?? 0);
    const quantity = Number(i.quantity ?? 0);
    if (!isFinite(weight) || weight < 0)   return sum;
    if (!isFinite(quantity) || quantity < 0) return sum;
    return sum + (weight / 1000) * quantity;
  }, 0);
}