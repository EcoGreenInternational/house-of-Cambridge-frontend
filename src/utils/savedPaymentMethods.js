const SAVED_PAYMENT_METHODS_KEY = 'house-of-cambridge-saved-payment-methods';

export function getSavedPaymentMethods() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_PAYMENT_METHODS_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function savePaymentMethods(methods) {
  try {
    localStorage.setItem(SAVED_PAYMENT_METHODS_KEY, JSON.stringify(methods));
  } catch {
    // Payment-method changes still apply for the current page when storage is unavailable.
  }
}
