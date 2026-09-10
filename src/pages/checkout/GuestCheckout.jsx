import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, removeFromCart } from '../../redux/slices/cartSlice.js';
import { createOrder } from '../../redux/slices/orderSlice.js';
import { initiateKoko, getPayHereHash } from '../../redux/slices/paymentSlice.js';
import { submitPayHereForm, PAYHERE_MERCHANT_ID } from '../../utils/payhere.js';
import PayPalCheckout from '../../components/payment/PayPalCheckout.jsx';
import { SHIPPING_METHODS, calcShipping, calcTotalWeightKg } from '../../utils/shipping.js';
import Layout from '../../components/common/Layout.jsx';
import Breadcrumb from '../../components/ui/Breadcrumb.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import {
  FiCheck, FiTruck, FiRefreshCw, FiShield,
  FiChevronRight, FiPackage, FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const VAT_RATE = Number(import.meta.env.VITE_VAT_RATE) || 0;

const PAY_TABS = [
  { id: 'card',   label: 'Card' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'cod',    label: 'Cash on Delivery' },
  { id: 'koko',   label: 'KOKO' },
];

const TRUST_BADGES = [
  { bg: 'bg-green-50', icon: FiShield,    color: 'text-green-600', label: 'SSL Secure'    },
  { bg: 'bg-blue-50',  icon: FiTruck,     color: 'text-blue-500',  label: 'Fast Delivery' },
  { bg: 'bg-amber-50', icon: FiRefreshCw, color: 'text-[#FFB700]', label: 'Easy Returns'  },
];

const INPUT_CLS =
  'w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]';

const BLANK_CONTACT = { firstName: '', lastName: '', email: '', phone: '' };
const BLANK_ADDR    = { addressLine1: '', addressLine2: '', city: '', postalCode: '', province: '' };

function SectionHeader({ n, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[13px] font-black flex-shrink-0" aria-hidden="true">
        {n}
      </div>
      <h2 className="text-[16px] font-black text-[#1A1A1A]">{title}</h2>
    </div>
  );
}

export default function GuestCheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cart, loading: cartLoading } = useSelector((s) => s.cart);
  const { loading: orderLoading }      = useSelector((s) => s.orders);

  const [contact,       setContact]       = useState(BLANK_CONTACT);
  const [addr,          setAddr]          = useState(BLANK_ADDR);
  const [shippingMethod,setShippingMethod]= useState(null);
  const [payTab,        setPayTab]        = useState('card');
  const [cardInfo,      setCardInfo]      = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [agreeTerms,    setAgreeTerms]    = useState(false);
  const [agreeEmail,    setAgreeEmail]    = useState(false);
  const [createAccount, setCreateAccount]= useState(false);
  const [placing,       setPlacing]       = useState(false);
  const [paypalOrder,   setPaypalOrder]   = useState(null);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items?.length === 0)) navigate('/cart');
  }, [cart, cartLoading, navigate]);

  const items         = cart?.items || [];
  const subtotal      = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const totalWeightKg = useMemo(() => calcTotalWeightKg(items), [items]);
  const shippingCost  = shippingMethod ? calcShipping(shippingMethod, totalWeightKg) : 0;
  const tax           = Math.round(subtotal * VAT_RATE);
  const total         = subtotal + shippingCost + tax;

  const setContactField = (key) => (e) => setContact((c) => ({ ...c, [key]: e.target.value }));
  const setAddrField    = (key) => (e) => setAddr((a)    => ({ ...a, [key]: e.target.value }));
  const setCardField    = (key) => (e) => setCardInfo((c) => ({ ...c, [key]: e.target.value }));

  const handleRemoveItem = useCallback((item) => {
    const productId = item?.product?._id || item?.product || item;
    dispatch(removeFromCart({ productId, itemId: item?._id, variantName: item?.selectedVariant?.name }));
    toast.success('Item removed');
  }, [dispatch]);

  const handlePlaceOrder = useCallback(async () => {
    if (placing) return;
    if (!agreeTerms)                       return toast.error('Please agree to the terms and conditions');
    if (!contact.email)                    return toast.error('Email is required');
    if (!addr.addressLine1 || !addr.city)  return toast.error('Please fill in shipping address');
    if (!shippingMethod)                   return toast.error('Please select a delivery method');

    setPlacing(true);

    const fullName = `${contact.firstName} ${contact.lastName}`.trim();

    const action = await dispatch(createOrder({
      shippingAddress: {
        fullName,
        phone:        contact.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || '',
        city:         addr.city,
        state:        addr.province,
        postalCode:   addr.postalCode,
        country:      'Sri Lanka',
      },
      paymentMethod: payTab,
      guestEmail:    contact.email,
      guestName:     fullName,
      shippingMethod,
      shippingCost,
    }));

    if (action.meta.requestStatus !== 'fulfilled') {
      toast.error(action.payload || 'Order creation failed');
      setPlacing(false);
      return;
    }

    const order = action.payload.order;

    if (payTab === 'cod') {
      navigate(`/order-confirmation/${order._id}`);
    } else if (payTab === 'card') {
      navigate('/payment-processing');
      try {
        const hashRes = await dispatch(getPayHereHash({
          orderId: order._id, amount: order.total.toFixed(2), currency: 'LKR',
        })).unwrap();
        const a = order.shippingAddress;
        submitPayHereForm({
          merchant_id: PAYHERE_MERCHANT_ID,
          return_url:  `${window.location.origin}/order-confirmation/${order._id}`,
          cancel_url:  `${window.location.origin}/payment-denied`,
          notify_url:  `${import.meta.env.VITE_API_URL}/payments/payhere/notify`,
          order_id:    order.orderNumber,
          items:       order.items.map((i) => i.name).join(', '),
          currency:    'LKR',
          amount:      order.total.toFixed(2),
          first_name:  contact.firstName || a.fullName?.split(' ')[0]               || '',
          last_name:   contact.lastName  || a.fullName?.split(' ').slice(1).join(' ') || '',
          email:       contact.email     || '',
          phone:       contact.phone     || a.phone                                  || '',
          address:     a.addressLine1    || '',
          city:        a.city            || '',
          country:     'Sri Lanka',
          hash:        hashRes.hash,
        });
      } catch {
        navigate('/payment-denied');
      }
    } else if (payTab === 'koko') {
      navigate('/payment-processing');
      try {
        const res = await dispatch(initiateKoko({ orderId: order._id })).unwrap();
        window.location.href = res.redirectUrl;
      } catch {
        navigate('/payment-denied');
      }
    } else if (payTab === 'paypal') {
      setPaypalOrder(order);
    }

    setPlacing(false);
  }, [placing, agreeTerms, contact, addr, shippingMethod, payTab, shippingCost, dispatch, navigate]);

  if (cartLoading && !cart) return <Layout><PageSpinner /></Layout>;

  const summaryRows = [
    { label: 'Subtotal', value: `Rs. ${subtotal.toLocaleString()}` },
    { label: 'Total Weight', value: totalWeightKg > 0 ? `${totalWeightKg.toFixed(2)} kg` : '—', icon: FiPackage },
    {
      label: 'Shipping',
      value: shippingMethod
        ? (shippingCost === 0 ? 'Free' : `Rs. ${shippingCost.toLocaleString()}`)
        : null,
      fallback: 'Select method',
      green: shippingCost === 0 && !!shippingMethod,
    },
    { label: 'VAT ', value: `Rs. ${tax.toLocaleString()}` },
  ];

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Guest Checkout' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pb-14">

        <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-5 py-3.5 flex flex-wrap items-center gap-3 mb-6" role="note">
          <p className="text-[13px] text-[#1A1A1A] flex-1">Already have an account? Save time and earn loyalty points.</p>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/login"    className="bg-[#1A1A1A] text-white text-[12px] font-bold px-4 py-2 rounded-[6px] hover:bg-gray-800 transition-colors">Sign In</Link>
            <Link to="/register" className="border border-[#1A1A1A] text-[#1A1A1A] text-[12px] font-bold px-4 py-2 rounded-[6px] hover:bg-gray-50 transition-colors">Create Account</Link>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-5">

            {/* Section 1 — Contact */}
            <section className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
              <SectionHeader n={1} title="Contact Information" />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'firstName', label: 'First Name',      type: 'text',  col: '' },
                  { key: 'lastName',  label: 'Last Name',        type: 'text',  col: '' },
                  { key: 'email',     label: 'Email Address',    type: 'email', col: '', autoComplete: 'email' },
                  { key: 'phone',     label: 'Phone Number',     type: 'tel',   col: '', autoComplete: 'tel' },
                ].map(({ key, label, type, col, autoComplete }) => (
                  <div key={key} className={col}>
                    <label htmlFor={`contact-${key}`} className="block text-[12px] font-medium text-[#60717B] mb-1">
                      {label} <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={`contact-${key}`}
                      type={type}
                      value={contact[key]}
                      onChange={setContactField(key)}
                      autoComplete={autoComplete}
                      className={INPUT_CLS}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2 — Shipping */}
            <section className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
              <SectionHeader n={2} title="Shipping Address" />

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { key: 'addressLine1', label: 'Address Line 1', col: 'col-span-2', required: true, placeholder: 'Street address, P.O. box' },
                  { key: 'addressLine2', label: 'Address Line 2', col: 'col-span-2', optional: true, placeholder: 'Apartment, suite, unit, floor' },
                  { key: 'city',         label: 'City',           col: '',           required: true },
                  { key: 'postalCode',   label: 'Postal Code',    col: '' },
                  { key: 'province',     label: 'Province',       col: '' },
                ].map(({ key, label, col, required, optional, placeholder }) => (
                  <div key={key} className={col}>
                    <label htmlFor={`addr-${key}`} className="block text-[12px] font-medium text-[#60717B] mb-1">
                      {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
                      {optional && <span className="text-gray-400"> (Optional)</span>}
                    </label>
                    <input id={`addr-${key}`} value={addr[key]} onChange={setAddrField(key)} placeholder={placeholder} className={INPUT_CLS} />
                  </div>
                ))}
              </div>

              <h3 className="text-[14px] font-black text-[#1A1A1A] mb-3 flex items-center gap-2">
                <FiTruck size={15} className="text-[#FFB700]" aria-hidden="true" /> Delivery Method
              </h3>

              <div className="bg-[#F5F5F5] border border-[#E9E9E9] rounded-[8px] px-4 py-2.5 mb-3 flex items-center gap-2">
                <FiPackage size={14} className="text-[#60717B] flex-shrink-0" aria-hidden="true" />
                <p className="text-[12px] text-[#60717B]">
                  Total cart weight: <span className="font-bold text-[#1A1A1A]">{totalWeightKg > 0 ? `${totalWeightKg.toFixed(2)} kg` : '—'}</span> · Shipping cost is calculated based on this weight.
                </p>
              </div>

              <fieldset className="space-y-2">
                <legend className="sr-only">Delivery method</legend>
                {SHIPPING_METHODS.map((m) => {
                  const price = calcShipping(m.id, totalWeightKg);
                  return (
                    <label key={m.id} className={`flex items-center gap-3 p-3.5 border-2 rounded-[8px] cursor-pointer transition-colors ${shippingMethod === m.id ? 'border-[#FFB700] bg-amber-50' : 'border-[#E9E9E9] hover:border-[#C5C5C5]'}`}>
                      <input type="radio" name="guestShipping" value={m.id} checked={shippingMethod === m.id} onChange={() => setShippingMethod(m.id)} className="accent-[#FFB700]" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#1A1A1A]">{m.label}</span>
                          {m.tag && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{m.tag}</span>}
                        </div>
                        {m.desc && <p className="text-[11px] text-[#60717B] mt-0.5">{m.desc}</p>}
                      </div>
                      <span className={`text-[13px] font-bold whitespace-nowrap ${price === 0 ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                        {price === 0 ? 'Free' : `Rs. ${price.toLocaleString()}`}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </section>

            {/* Section 3 — Payment */}
            <section className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
              <SectionHeader n={3} title="Payment" />

              <div className="flex border border-[#E9E9E9] rounded-[8px] overflow-hidden mb-5" role="tablist" aria-label="Payment method">
                {PAY_TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={payTab === t.id}
                    onClick={() => { setPayTab(t.id); setPaypalOrder(null); }}
                    className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors border-r border-[#E9E9E9] last:border-r-0 ${payTab === t.id ? 'bg-[#FFB700] text-black' : 'text-[#60717B] hover:bg-gray-50'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {payTab === 'card' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'number', label: 'Card Number',  col: 'col-span-2', placeholder: '1234 5678 9012 3456', maxLength: 19, inputMode: 'numeric', autoComplete: 'cc-number' },
                    { key: 'name',   label: 'Name on Card', col: 'col-span-2', autoComplete: 'cc-name' },
                    { key: 'expiry', label: 'Expiry Date',  col: '',           placeholder: 'MM/YY', maxLength: 5, autoComplete: 'cc-exp' },
                    { key: 'cvv',    label: 'CVV',          col: '',           type: 'password', maxLength: 4, autoComplete: 'cc-csc' },
                  ].map(({ key, label, col, placeholder, maxLength, type, inputMode, autoComplete }) => (
                    <div key={key} className={col}>
                      <label htmlFor={`card-${key}`} className="block text-[12px] font-medium text-[#60717B] mb-1">{label}</label>
                      <input
                        id={`card-${key}`}
                        type={type || 'text'}
                        value={cardInfo[key]}
                        onChange={setCardField(key)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        inputMode={inputMode}
                        autoComplete={autoComplete}
                        className={INPUT_CLS}
                        aria-label={key === 'cvv' ? 'Card security code' : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}

              {payTab === 'paypal' && (
                <div className="py-4">
                  {paypalOrder ? (
                    <PayPalCheckout order={paypalOrder} />
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3" aria-hidden="true"><span className="text-blue-700 font-black text-lg">PP</span></div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Pay with PayPal</p>
                      <p className="text-[12px] text-[#60717B]">Click "Place Order" to proceed to PayPal.</p>
                    </div>
                  )}
                </div>
              )}

              {payTab === 'cod' && (
                <div className="py-6 text-center">
                  <p className="text-4xl mb-3" aria-hidden="true">💵</p>
                  <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Cash on Delivery</p>
                  <p className="text-[12px] text-[#60717B]">Pay with cash when your order is delivered.</p>
                </div>
              )}

              {payTab === 'koko' && (
                <div className="py-6 text-center">
                  <div className="w-20 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center mx-auto mb-3" aria-hidden="true"><span className="text-white font-black text-lg tracking-wider">KOKO</span></div>
                  <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Buy Now, Pay Later with KOKO</p>
                  <p className="text-[12px] text-[#60717B]">Split into 3 easy monthly installments at 0% interest.</p>
                </div>
              )}
            </section>

            {/* Section 4 — Confirm */}
            <section className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
              <SectionHeader n={4} title="Confirm Order" />

              <div className="bg-[#F8F8F8] rounded-[8px] p-4 mb-5">
                <dl className="space-y-1.5">
                  {summaryRows.map(({ label, value, fallback, green, icon: Icon }) => (
                    <div key={label} className="flex justify-between text-[13px]">
                      <dt className="text-[#60717B] flex items-center gap-1">
                        {Icon && <Icon size={11} aria-hidden="true" />} {label}
                      </dt>
                      <dd className={`font-medium ${green ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                        {value ?? <span className="italic text-[#60717B] text-[12px]">{fallback}</span>}
                      </dd>
                    </div>
                  ))}
                  <div className="border-t border-[#E9E9E9] pt-2 flex justify-between">
                    <dt className="font-black text-[#1A1A1A] text-[14px]">Total</dt>
                    <dd className="text-right">
                      <span className="font-black text-[#1A1A1A] text-[14px]">Rs. {total.toLocaleString()}</span>
                      {!shippingMethod && <p className="text-[10px] text-[#60717B]">* Excl. shipping</p>}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  {
                    key: 'terms', checked: agreeTerms, onChange: (e) => setAgreeTerms(e.target.checked),
                    label: <>I agree to the <Link to="/terms" className="text-[#FFB700] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</Link> and <Link to="/privacy-policy" className="text-[#FFB700] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>. <span className="text-red-500" aria-hidden="true">*</span></>,
                  },
                  {
                    key: 'email', checked: agreeEmail, onChange: (e) => setAgreeEmail(e.target.checked),
                    label: 'Keep me updated with exclusive offers, new arrivals and promotions via email.',
                  },
                  {
                    key: 'account', checked: createAccount, onChange: (e) => setCreateAccount(e.target.checked),
                    label: 'Create an account with this order to earn loyalty points and track your orders.',
                  },
                ].map(({ key, checked, onChange, label }) => (
                  <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#FFB700] w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-[12px] text-[#60717B] leading-relaxed">{label}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={orderLoading || placing || !agreeTerms}
                className="w-full bg-[#FFB700] text-black font-bold text-[15px] py-4 rounded-[8px] hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {orderLoading || placing
                  ? 'Processing…'
                  : <><span>Place Order As Guest</span><FiChevronRight size={16} aria-hidden="true" /></>
                }
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4">
                <FiShield size={12} className="text-green-500" aria-hidden="true" />
                <span className="text-[11px] text-[#60717B]">256-bit SSL Encrypted · Secure Checkout</span>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="w-[300px] flex-shrink-0" aria-label="Order summary">
            <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 sticky top-24 shadow-[2px_3px_8px_rgba(0,0,0,0.05)]">
              {items.length > 0 && (
                <div className="mb-4 pb-4 border-b border-[#F0F0F0]">
                  <p className="text-[11px] font-black text-[#60717B] uppercase tracking-wider mb-3">Your Items ({items.length})</p>
                  <ul className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {items.map((item) => {
                      const p = item.product;
                      const itemImg = item.selectedVariant?.image || p?.images?.[0]?.url || 'https://placehold.co/44?text=P';
                      const rowKey = item._id || `${p?._id}-${item.selectedVariant?.name || ''}`;

                      return (
                        <li key={rowKey} className="flex items-center gap-2.5">
                          <img src={itemImg} alt={p?.name} className="w-10 h-10 object-cover rounded-[5px] border border-[#E9E9E9] flex-shrink-0" loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{p?.name}</p>
                            {item.selectedVariant?.name && (
                              <p className="text-[10px] text-[#FFB700] font-semibold truncate">{item.selectedVariant.name}</p>
                            )}
                            <p className="text-[11px] text-[#60717B]">Qty {item.quantity}</p>
                          </div>
                          <span className="text-[12px] font-bold text-[#1A1A1A] whitespace-nowrap">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            aria-label={`Remove ${p?.name} from checkout`}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors ml-1 shrink-0"
                          >
                            <FiX size={12} aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <p className="text-[12px] font-black text-[#1A1A1A] uppercase tracking-wider mb-4">Order Summary</p>
              <dl className="space-y-2.5 mb-5">
                {summaryRows.map(({ label, value, fallback, green, icon: Icon }) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <dt className="text-[#60717B] flex items-center gap-1">
                      {Icon && <Icon size={11} aria-hidden="true" />} {label}
                    </dt>
                    <dd className={`font-medium ${green ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                      {value ?? <span className="italic text-[#60717B] text-[12px]">{fallback}</span>}
                    </dd>
                  </div>
                ))}
                <div className="border-t border-[#E9E9E9] pt-3 flex justify-between">
                  <dt className="text-[15px] font-black text-[#1A1A1A]">Total</dt>
                  <dd className="text-right">
                    <span className="text-[15px] font-black text-[#1A1A1A]">Rs. {total.toLocaleString()}</span>
                    {!shippingMethod && <p className="text-[10px] text-[#60717B]">* Excl. shipping</p>}
                  </dd>
                </div>
              </dl>

              <Link to="/cart" className="w-full flex items-center justify-center border border-[#C5C5C5] text-[#1A1A1A] font-medium text-[13px] py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors mb-4">
                ← Back to Cart
              </Link>

              <div className="grid grid-cols-3 gap-2 border-t border-[#F0F0F0] pt-4" aria-label="Trust badges">
                {TRUST_BADGES.map(({ bg, icon: Icon, color, label }) => (
                  <div key={label} className="text-center">
                    <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mx-auto mb-1`} aria-hidden="true">
                      <Icon size={14} className={color} />
                    </div>
                    <p className="text-[10px] text-[#60717B] leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}