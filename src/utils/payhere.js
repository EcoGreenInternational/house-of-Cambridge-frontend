import api from '../redux/api/axiosInstance';

const ALLOWED_PAYHERE_URLS = new Set([
  'https://www.payhere.lk/pay/checkout',
  'https://sandbox.payhere.lk/pay/checkout',
]);

const PARAM_KEY_RE    = /^[A-Za-z0-9_]{1,64}$/;
const MAX_PARAM_VALUE = 500;

function sanitizeParamValue(value) {
  return String(value ?? '').slice(0, MAX_PARAM_VALUE);
}

export function submitPayHereForm(action, params) {
  if (!ALLOWED_PAYHERE_URLS.has(action)) {
    throw new Error('Unexpected PayHere checkout URL');
  }
  if (!params || typeof params !== 'object') {
    throw new Error('Missing PayHere checkout params');
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;

  Object.entries(params).forEach(([key, value]) => {
    if (!PARAM_KEY_RE.test(key)) return;
    const input   = document.createElement('input');
    input.type    = 'hidden';
    input.name    = key;
    input.value   = sanitizeParamValue(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

// The backend builds every param (amount, hash, URLs) from the saved order,
// so nothing the browser sends can change what the customer is charged.
export async function startPayHerePayment(orderId) {
  const { data } = await api.post('/payments/payhere/checkout', { orderId });
  submitPayHereForm(data.action, data.params);
}
