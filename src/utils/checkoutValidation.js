const NAME_RE   = /^[A-Za-z][A-Za-z .'-]{1,49}$/;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE  = /^\d{10}$/;
const POSTAL_RE = /^\d{5}$/;
const CITY_RE   = /^[A-Za-z][A-Za-z .'-]{1,49}$/;

// Phone inputs only ever hold digits, max 10
export const toPhoneDigits = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 10);
export const toPostalDigits = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 5);

const trim = (v) => String(v ?? '').trim();

export function validateName(value, label) {
  const v = trim(value);
  if (!v) return `${label} is required`;
  if (!NAME_RE.test(v)) return `${label} can only contain letters (2–50 characters)`;
  return '';
}

export function validateEmail(value) {
  const v = trim(value);
  if (!v) return 'Email is required';
  if (v.length > 254 || !EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
}

export function validatePhone(value) {
  const v = trim(value);
  if (!v) return 'Phone number is required';
  if (!PHONE_RE.test(v)) return 'Phone number must be exactly 10 digits (e.g. 0771234567)';
  return '';
}

export function validateAddressFields(addr) {
  const errors = {};
  const line1 = trim(addr.addressLine1);
  if (!line1) errors.addressLine1 = 'Address is required';
  else if (line1.length < 5) errors.addressLine1 = 'Enter your full street address';
  else if (line1.length > 200) errors.addressLine1 = 'Address is too long';

  if (trim(addr.addressLine2).length > 200) errors.addressLine2 = 'Address is too long';

  const city = trim(addr.city);
  if (!city) errors.city = 'City is required';
  else if (!CITY_RE.test(city)) errors.city = 'Enter a valid city name';

  const postal = trim(addr.postalCode);
  if (!postal) errors.postalCode = 'Postal code is required';
  else if (!POSTAL_RE.test(postal)) errors.postalCode = 'Postal code must be 5 digits';

  if (!trim(addr.province)) errors.province = 'Province is required';
  return errors;
}

// Returns only the fields that failed, e.g. { phone: '...' }
export function validateCheckoutForm({ firstName, lastName, email, phone, ...addr }, { requireEmail = false } = {}) {
  const errors = { ...validateAddressFields(addr) };
  const first = validateName(firstName, 'First name');
  const last  = validateName(lastName, 'Last name');
  const tel   = validatePhone(phone);
  if (first) errors.firstName = first;
  if (last)  errors.lastName  = last;
  if (tel)   errors.phone     = tel;
  if (requireEmail) {
    const mail = validateEmail(email);
    if (mail) errors.email = mail;
  }
  return errors;
}

export const SRI_LANKA_PROVINCES = Object.freeze([
  'Western', 'Central', 'Southern', 'Northern', 'Eastern',
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
]);

// Saved addresses were entered before these rules existed; check them the way the backend does
export function validateSavedAddress(addr) {
  const fullName = trim(addr?.fullName);
  if (!fullName || !/^[A-Za-z][A-Za-z .'-]{1,99}$/.test(fullName)) return 'a valid name';
  if (validatePhone(addr.phone)) return 'a 10-digit phone number';
  const { addressLine1, city, postalCode } = validateAddressFields({ ...addr, province: 'x' });
  if (addressLine1) return 'a full street address';
  if (city) return 'a valid city';
  if (postalCode) return 'a 5-digit postal code';
  return '';
}
