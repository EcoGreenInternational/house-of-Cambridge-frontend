import { useCallback, useState } from 'react';
import ProfileLayout from '../../components/profile/ProfileLayout';
import { FiCreditCard, FiShield, FiCheck, FiTrash2, FiStar } from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaPaypal } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getSavedPaymentMethods, savePaymentMethods } from '../../utils/savedPaymentMethods';

const PAY_TABS = [
  { id: 'card',   label: 'Credit / Debit Card' },
  { id: 'paypal', label: 'PayPal'               },
  { id: 'koko',   label: 'KOKO'                 },
  { id: 'cod',    label: 'Cash on Delivery'     },
];



const BLANK_CARD = { number: '', name: '', expiry: '', cvv: '', saveCard: true, billingDefault: false };

const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;

function detectBrand(digits) {
  if (digits[0] === '4') return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  return 'unknown';
}

function validateCard(form) {
  const digits = form.number.replace(/\s/g, '');
  if (digits.length < 13 || digits.length > 19)   return 'Enter a valid card number.';
  if (!/^\d+$/.test(digits))                        return 'Card number must contain only digits.';
  if (!form.name.trim() || form.name.trim().length < 2) return 'Enter the cardholder name.';
  if (!EXPIRY_RE.test(form.expiry))                 return 'Enter a valid expiry date (MM/YY).';
  const [mm, yy] = form.expiry.split('/').map(Number);
  const expDate  = new Date(2000 + yy, mm - 1, 1);
  if (expDate < new Date())                          return 'This card has expired.';
  if (form.cvv.length < 3)                           return 'Enter a valid CVV.';
  return null;
}

function fmtCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function fmtExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function BrandIcon({ brand, size = 24 }) {
  if (brand === 'visa')       return <FaCcVisa size={size} className="text-blue-700" />;
  if (brand === 'mastercard') return <FaCcMastercard size={size} className="text-red-600" />;
  if (brand === 'paypal')     return <FaPaypal size={size} className="text-blue-500" />;
  return <FiCreditCard size={size} className="text-[#60717B]" />;
}

const inputCls = 'w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]';
const labelCls = 'block text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1.5';

export default function PaymentMethods() {
  const [cards, setCards]       = useState(getSavedPaymentMethods);
  const [addTab, setAddTab]     = useState('card');
  const [form, setForm]         = useState(BLANK_CARD);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = useCallback((k, v) => setForm((f) => ({ ...f, [k]: v })), []);

  const confirmDelete = useCallback((id) => setDeleteTarget(id), []);

  const handleDelete = useCallback(() => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== deleteTarget);
      savePaymentMethods(next);
      return next;
    });
    toast.success('Payment method removed');
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleSetDefault = useCallback((id) => {
    setCards((prev) => {
      const next = prev.map((c) => ({ ...c, isDefault: c.id === id }));
      savePaymentMethods(next);
      return next;
    });
    toast.success('Default payment method updated');
  }, []);

  const handleSaveCard = useCallback((e) => {
    e.preventDefault();
    const error = validateCard(form);
    if (error) { toast.error(error); return; }

    const digits = form.number.replace(/\s/g, '');
    const last4  = digits.slice(-4);
    const brand  = detectBrand(digits);

    setCards((prev) => {
      const next = [
        ...prev.map((c) => form.billingDefault ? { ...c, isDefault: false } : c),
      {
        id:        `c${Date.now()}`,
        brand,
        last4,
        expiry:    form.expiry,
        name:      form.name.trim(),
        isDefault: form.billingDefault,
      },
      ];
      savePaymentMethods(next);
      return next;
    });
    toast.success('Card saved!');
    setForm(BLANK_CARD);
    setShowForm(false);
  }, [form]);

  return (
    <ProfileLayout>
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-pay-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="bg-white rounded-[12px] shadow-xl p-6 max-w-[360px] w-full mx-4">
            <h2 id="del-pay-title" className="text-[15px] font-black text-[#1A1A1A] mb-2">Remove Payment Method?</h2>
            <p className="text-[13px] text-[#60717B] mb-5">This payment method will be permanently removed from your account.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-[#C5C5C5] text-[#1A1A1A] text-[13px] font-bold py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white text-[13px] font-bold py-2.5 rounded-[6px] hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        role="note"
        className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-[8px] px-4 py-2.5 mb-4"
      >
        <FiShield size={13} className="text-green-600 flex-shrink-0" aria-hidden="true" />
        <p className="text-[11px] text-green-800 font-semibold">
          PCI DSS Compliant · All card data is encrypted and stored securely. We never store your CVV.
        </p>
      </div>

      <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-4">
        <div className="px-5 py-3.5 border-b border-[#F0F0F0]">
          <h2 className="text-[13px] font-black text-[#1A1A1A]">Saved Payment Methods</h2>
        </div>
        {cards.length === 0 ? (
          <p className="px-5 py-8 text-center text-[12px] text-[#60717B]">
            No saved payment methods yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#F5F5F5]">
            {cards.map((c) => (
            <li
              key={c.id}
              className={`flex items-center gap-4 px-5 py-4 transition-colors ${c.isDefault ? 'bg-amber-50/40' : 'hover:bg-[#FAFAFA]'}`}
            >
              <BrandIcon brand={c.brand} size={28} />
              <div className="flex-1 min-w-0">
                {c.brand === 'paypal' ? (
                  <>
                    <p className="text-[13px] font-bold text-[#1A1A1A]">PayPal</p>
                    <p className="text-[11px] text-[#60717B]">{c.email}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-bold text-[#1A1A1A] capitalize">
                      {c.brand} <span aria-label="ending in">●●●●</span> {c.last4}
                    </p>
                    <p className="text-[11px] text-[#60717B]">
                      {c.name} · Expires <time>{c.expiry}</time>
                    </p>
                  </>
                )}
                {c.isDefault && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FFB700] mt-0.5">
                    <FiStar size={9} className="fill-[#FFB700]" aria-hidden="true" /> Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!c.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(c.id)}
                    className="text-[11px] font-semibold text-[#60717B] hover:text-[#1A1A1A] transition-colors whitespace-nowrap"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => confirmDelete(c.id)}
                  aria-label={`Remove ${c.brand === 'paypal' ? 'PayPal' : `${c.brand} ending in ${c.last4}`}`}
                  className="w-8 h-8 border border-[#E9E9E9] rounded-[6px] flex items-center justify-center text-[#C5C5C5] hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  <FiTrash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors"
        >
          <p className="text-[13px] font-black text-[#1A1A1A]">Add New Payment Method</p>
          <span className="text-[#FFB700] text-[20px] font-light leading-none" aria-hidden="true">
            {showForm ? '−' : '+'}
          </span>
        </button>

        {showForm && (
          <div className="border-t border-[#F0F0F0] p-5">
            <div className="flex gap-2 mb-5 flex-wrap" role="tablist" aria-label="Payment method type">
              {PAY_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={addTab === t.id}
                  onClick={() => setAddTab(t.id)}
                  className={`px-4 py-2 rounded-[6px] text-[12px] font-bold border transition-colors ${
                    addTab === t.id
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'border-[#C5C5C5] text-[#60717B] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {addTab === 'card' && (
              <form onSubmit={handleSaveCard} className="space-y-3" noValidate>
                <div>
                  <label htmlFor="card-number" className={labelCls}>Card Number</label>
                  <div className="relative">
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={form.number}
                      onChange={(e) => set('number', fmtCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className={inputCls}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1" aria-hidden="true">
                      <FaCcVisa size={18} className="text-blue-700" />
                      <FaCcMastercard size={18} className="text-red-600" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="card-name" className={labelCls}>Cardholder Name</label>
                  <input
                    id="card-name"
                    type="text"
                    autoComplete="cc-name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value.replace(/[<>"'`]/g, '').slice(0, 80))}
                    placeholder="As printed on card"
                    maxLength={80}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="card-expiry" className={labelCls}>Expiry Date</label>
                    <input
                      id="card-expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={form.expiry}
                      onChange={(e) => set('expiry', fmtExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="card-cvv" className={labelCls}>CVV</label>
                    <input
                      id="card-cvv"
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={form.cvv}
                      onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="●●●"
                      maxLength={4}
                      className={inputCls}
                      aria-describedby="cvv-hint"
                    />
                    <p id="cvv-hint" className="sr-only">3 or 4 digit security code on the back of your card</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.saveCard}
                    onChange={(e) => set('saveCard', e.target.checked)}
                    className="accent-[#FFB700] w-4 h-4"
                  />
                  <span className="text-[12px] text-[#60717B]">Save this card for future payments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.billingDefault}
                    onChange={(e) => set('billingDefault', e.target.checked)}
                    className="accent-[#FFB700] w-4 h-4"
                  />
                  <span className="text-[12px] text-[#60717B]">Set as default payment method</span>
                </label>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFB700] text-black text-[13px] font-bold py-3 rounded-[6px] hover:bg-amber-500 transition-colors mt-1"
                >
                  <FiShield size={14} aria-hidden="true" /> Save Card Securely
                </button>
              </form>
            )}

            {addTab === 'paypal' && (
              <div className="text-center py-8">
                <FaPaypal size={40} className="text-blue-500 mx-auto mb-3" aria-hidden="true" />
                <p className="text-[13px] text-[#60717B] mb-4">
                  Connect your PayPal account to pay quickly and securely.
                </p>
                <button
                  type="button"
                  onClick={() => toast('PayPal connection is not available in demo mode')}
                  className="bg-[#0070BA] text-white text-[13px] font-bold px-8 py-3 rounded-[6px] hover:bg-[#005ea6] transition-colors"
                >
                  Connect PayPal Account
                </button>
              </div>
            )}

            {addTab === 'koko' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                  <span className="text-white font-black text-[16px]">KK</span>
                </div>
                <p className="text-[13px] text-[#60717B] mb-4">Pay in 3 interest-free instalments with KOKO.</p>
                <button
                  type="button"
                  onClick={() => toast('KOKO is applied automatically at checkout when available')}
                  className="bg-[#1A1A1A] text-white text-[13px] font-bold px-8 py-3 rounded-[6px] hover:bg-black transition-colors"
                >
                  Learn About KOKO
                </button>
              </div>
            )}

            {addTab === 'cod' && (
              <div className="flex items-start gap-3 bg-[#FAFAFA] border border-[#E9E9E9] rounded-[8px] p-4">
                <FiCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-bold text-[#1A1A1A] mb-1">Cash on Delivery is Available</p>
                  <p className="text-[12px] text-[#60717B] leading-relaxed">
                    Pay in cash when your order is delivered. Available for orders up to Rs. 25,000.
                    A COD handling fee of Rs. 150 may apply.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}