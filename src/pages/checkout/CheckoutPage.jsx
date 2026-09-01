import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, applyCoupon, removeFromCart } from '../../redux/slices/cartSlice.js';
import { createOrder } from '../../redux/slices/orderSlice.js';
import { fetchAddresses } from '../../redux/slices/userSlice.js';
import { initiateKoko, getPayHereHash } from '../../redux/slices/paymentSlice.js';
import { submitPayHereForm, PAYHERE_MERCHANT_ID } from '../../utils/payhere.js';
import PayPalCheckout from '../../components/payment/PayPalCheckout.jsx';
import { SHIPPING_METHODS, calcShipping, calcTotalWeightKg } from '../../utils/shipping.js';
import Layout from '../../components/common/Layout.jsx';
import Breadcrumb from '../../components/ui/Breadcrumb.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import {
  FiMapPin, FiCreditCard, FiCheck, FiShoppingCart,
  FiTag, FiX, FiTruck, FiRefreshCw, FiShield,
  FiStar, FiChevronRight, FiPackage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const VAT_RATE = Number(import.meta.env.VITE_VAT_RATE) || 0;

const BLANK_ADDR = {
  firstName: '', lastName: '', phone: '',
  addressLine1: '', addressLine2: '',
  city: '', postalCode: '', province: '', save: false,
};

const PAY_TABS = [
  { id: 'card',   label: 'Card' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'cod',    label: 'Cash on Delivery' },
  { id: 'koko',   label: 'KOKO' },
];

const STEPS = [
  { n: 1, label: 'Cart Review',  icon: FiShoppingCart },
  { n: 2, label: 'Shipping',     icon: FiMapPin },
  { n: 3, label: 'Payment',      icon: FiCreditCard },
  { n: 4, label: 'Confirmation', icon: FiCheck },
];

const MOCK_SAVED_CARDS = [
  { id: 'c1', brand: 'VISA', last4: '4512', expiry: '09/26', name: 'J. Perera' },
];

const INPUT_CLS =
  'w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]';

const TRUST_BADGES = [
  { bg: 'bg-green-50', icon: FiShield,    color: 'text-green-600', label: 'SSL Secure'     },
  { bg: 'bg-blue-50',  icon: FiTruck,     color: 'text-blue-500',  label: 'Fast Delivery'  },
  { bg: 'bg-amber-50', icon: FiRefreshCw, color: 'text-[#FFB700]', label: 'Easy Returns'   },
];

function buildShippingAddress(selectedAddr, addresses, newAddr) {
  if (selectedAddr) {
    const a = addresses.find((x) => x._id === selectedAddr);
    if (a) {
      return {
        fullName:     a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
        phone:        a.phone,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2 || '',
        city:         a.city,
        state:        a.state || a.province || '',
        postalCode:   a.postalCode,
        country:      a.country || 'Sri Lanka',
      };
    }
  }
  return {
    fullName:     `${newAddr.firstName} ${newAddr.lastName}`.trim(),
    phone:        newAddr.phone,
    addressLine1: newAddr.addressLine1,
    addressLine2: newAddr.addressLine2 || '',
    city:         newAddr.city,
    state:        newAddr.province || '',
    postalCode:   newAddr.postalCode,
    country:      'Sri Lanka',
  };
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cart, loading: cartLoading } = useSelector((s) => s.cart);
  const { isAuthenticated, user }      = useSelector((s) => s.auth);
  const { addresses }                  = useSelector((s) => s.user);
  const { loading: orderLoading }      = useSelector((s) => s.orders);

  const [step,           setStep]           = useState(1);
  const [selectedAddr,   setSelectedAddr]   = useState(null);
  const [newAddr,        setNewAddr]        = useState(BLANK_ADDR);
  const [shippingMethod, setShippingMethod] = useState(null);
  const [orderNotes,     setOrderNotes]     = useState('');
  const [payTab,         setPayTab]         = useState('card');
  const [selectedCard,   setSelectedCard]   = useState('c1');
  const [useNewCard,     setUseNewCard]     = useState(false);
  const [cardInfo,       setCardInfo]       = useState({ number: '', name: '', expiry: '', cvv: '', save: false });
  const [billingSame,    setBillingSame]    = useState(true);
  const [loyaltyInput,   setLoyaltyInput]  = useState('');
  const [loyaltyApplied, setLoyaltyApplied]= useState(0);
  const [couponCode,     setCouponCode]    = useState('');
  const [couponApplied,  setCouponApplied] = useState('');
  const [placing,        setPlacing]       = useState(false);
  const [paypalOrder,    setPaypalOrder]   = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
    if (isAuthenticated) dispatch(fetchAddresses());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!cartLoading && (!cart || cart.items?.length === 0)) navigate('/cart');
  }, [cart, cartLoading, navigate]);

  const items         = cart?.items || [];
  const subtotal      = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const discount      = cart?.discount ?? 0;
  const totalWeightKg = useMemo(() => calcTotalWeightKg(items), [items]);
  const shippingCost  = shippingMethod ? calcShipping(shippingMethod, totalWeightKg) : 0;
  const loyaltyDiscount = loyaltyApplied;
  const tax           = Math.round((subtotal - discount - loyaltyDiscount) * VAT_RATE);
  const total         = subtotal - discount - loyaltyDiscount + shippingCost + tax;
  const availablePts  = user?.loyaltyPoints ?? 0;

  const shippingAddress = useMemo(
    () => buildShippingAddress(selectedAddr, addresses, newAddr),
    [selectedAddr, addresses, newAddr],
  );

  const handleRemoveItem = useCallback((productId) => {
    dispatch(removeFromCart(productId));
    toast.success('Item removed');
  }, [dispatch]);

  const handleCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    dispatch(applyCoupon(code)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        setCouponApplied(code);
        toast.success('Coupon applied!');
      } else {
        toast.error(action.payload || 'Invalid coupon');
      }
    });
  }, [dispatch, couponCode]);

  const applyLoyalty = useCallback(() => {
    const pts = parseInt(loyaltyInput, 10);
    if (!pts || pts <= 0)       return toast.error('Enter valid points');
    if (pts > availablePts)     return toast.error(`Only ${availablePts} points available`);
    if (pts > subtotal)         return toast.error('Points cannot exceed order value');
    setLoyaltyApplied(pts);
    toast.success(`${pts} loyalty points applied!`);
  }, [loyaltyInput, availablePts, subtotal]);

  const handleContinueToPayment = useCallback(() => {
    if (!shippingMethod) { toast.error('Please select a shipping method'); return; }
    if (!shippingAddress.fullName || !shippingAddress.addressLine1) {
      toast.error('Please complete your shipping address'); return;
    }
    setStep(3);
  }, [shippingMethod, shippingAddress]);

  const handlePlaceOrder = useCallback(async () => {
    if (placing) return;
    if (!shippingMethod) { toast.error('Please select a shipping method'); setStep(2); return; }
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1) {
      toast.error('Please fill in all address fields'); setStep(2); return;
    }
    setPlacing(true);

    const action = await dispatch(createOrder({
      shippingAddress,
      paymentMethod:     payTab,
      loyaltyPointsUsed: loyaltyApplied,
      notes:             orderNotes,
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
          first_name:  a.fullName?.split(' ')[0]              || '',
          last_name:   a.fullName?.split(' ').slice(1).join(' ') || '',
          email:       order.guestEmail || user?.email         || '',
          phone:       a.phone                                 || '',
          address:     a.addressLine1                          || '',
          city:        a.city                                  || '',
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
  }, [placing, shippingMethod, shippingAddress, payTab, loyaltyApplied, orderNotes, shippingCost, dispatch, navigate, user]);

  if (cartLoading && !cart) return <Layout><PageSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pb-14">

        {/* Step Indicator */}
        <nav aria-label="Checkout steps" className="flex items-center justify-center mb-8 overflow-x-auto px-2">
          {STEPS.map(({ n, label }, idx) => (
            <div key={n} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black transition-colors ${
                    n < step   ? 'bg-[#FFB700] text-black' :
                    n === step ? 'bg-[#1A1A1A] text-white ring-4 ring-[#FFB700]/25' :
                                 'bg-[#E9E9E9] text-[#60717B]'
                  }`}
                  aria-current={n === step ? 'step' : undefined}
                >
                  {n < step ? <FiCheck size={16} aria-hidden="true" /> : n}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${n <= step ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-14 sm:w-20 h-[2px] mx-2 mb-4 rounded-full transition-colors ${n < step ? 'bg-[#FFB700]' : 'bg-[#E9E9E9]'}`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </nav>

        {/* Step Nav Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap" role="group" aria-label="Navigate between steps">
          {STEPS.slice(0, 3).map(({ n, label }) => (
            <button
              key={n}
              onClick={() => n < step && setStep(n)}
              disabled={n > step}
              aria-current={n === step ? 'step' : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-semibold transition-colors border ${
                n === step ? 'bg-[#FFB700] text-black border-[#FFB700]' :
                n < step   ? 'bg-white border-[#C5C5C5] text-[#60717B] hover:border-[#FFB700] cursor-pointer' :
                             'bg-[#F5F5F5] border-[#E9E9E9] text-[#C5C5C5] cursor-not-allowed'
              }`}
            >
              {n < step && <FiCheck size={13} className="text-green-500" aria-hidden="true" />}
              Step {n}: {label}
            </button>
          ))}
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">

            {/* ══ STEP 1 — Cart Review ══ */}
            {step === 1 && (
              <div>
                <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="bg-[#F5F5F5] border-b border-[#E9E9E9]">
                          {['Product', 'Unit Price', 'Weight', 'Qty', 'Subtotal', ''].map((h, i) => (
                            <th key={h || i} scope="col" className={`text-[12px] font-bold text-[#60717B] uppercase tracking-wider px-4 py-3.5 ${h === 'Product' ? 'text-left px-5' : 'text-center'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0F0]">
                        {items.map((item) => {
                          const p      = item.product;
                          const itemWt = ((p?.weight || 0) / 1000) * item.quantity;
                          return (
                            <tr key={p?._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <img src={p?.images?.[0]?.url || 'https://placehold.co/60?text=P'} alt={p?.name} className="w-14 h-14 object-cover rounded-[6px] border border-[#E9E9E9] flex-shrink-0" loading="lazy" />
                                  <div>
                                    <p className="text-[13px] font-medium text-[#1A1A1A] line-clamp-2 max-w-[180px]">{p?.name}</p>
                                    {p?.brand && <p className="text-[11px] text-gray-400 mt-0.5">{p.brand}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center"><span className="text-[13px] font-medium text-[#1A1A1A]">Rs. {item.price?.toLocaleString()}</span></td>
                              <td className="px-4 py-3.5 text-center"><span className="text-[12px] text-[#60717B]">{itemWt > 0 ? `${itemWt.toFixed(2)} kg` : '—'}</span></td>
                              <td className="px-4 py-3.5 text-center"><span className="text-[13px] font-medium text-[#60717B]">{item.quantity}</span></td>
                              <td className="px-4 py-3.5 text-center"><span className="text-[13px] font-bold text-[#1A1A1A]">Rs. {(item.price * item.quantity).toLocaleString()}</span></td>
                              <td className="px-2 py-3.5 text-center">
                                <button type="button" onClick={() => handleRemoveItem(p?._id)} aria-label={`Remove ${p?.name}`} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors mx-auto">
                                  <FiX size={13} aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 flex flex-wrap items-center gap-3 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-5">
                  <span className="text-[13px] font-medium text-[#1A1A1A] whitespace-nowrap flex items-center gap-1.5">
                    <FiTag size={14} className="text-[#FFB700]" aria-hidden="true" /> Promo / Voucher Code:
                  </span>
                  <div className="flex gap-2 flex-1 min-w-[220px]">
                    {couponApplied ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-[6px] px-3 py-2 flex-1" role="status">
                        <FiCheck size={12} className="text-green-600" aria-hidden="true" />
                        <span className="text-[12px] font-bold text-green-700">Applied: {couponApplied}</span>
                        {discount > 0 && <span className="text-[12px] text-green-600">−Rs. {discount.toLocaleString()}</span>}
                        <button onClick={() => { setCouponApplied(''); setCouponCode(''); }} aria-label="Remove coupon" className="ml-auto text-green-600 hover:text-red-500 transition-colors">
                          <FiX size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCoupon()} placeholder="Enter promo code" aria-label="Promo code" className="flex-1 border border-[#C5C5C5] rounded-[6px] px-3 py-2 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]" />
                        <button onClick={handleCoupon} className="bg-[#FFB700] text-black px-5 rounded-[6px] text-[13px] font-bold hover:bg-amber-500 transition-colors">Apply</button>
                      </>
                    )}
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="w-full bg-[#FFB700] text-black font-bold text-[14px] py-3.5 rounded-[6px] hover:bg-amber-500 transition-colors">
                  Continue to Shipping →
                </button>
              </div>
            )}

            {/* ══ STEP 2 — Shipping ══ */}
            {step === 2 && (
              <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
                <h2 className="font-black text-[#1A1A1A] text-[18px] mb-5 flex items-center gap-2">
                  <FiMapPin className="text-[#FFB700]" aria-hidden="true" /> Shipping Information
                </h2>

                {isAuthenticated && addresses.length > 0 && (
                  <fieldset className="space-y-2 mb-4">
                    <legend className="sr-only">Saved addresses</legend>
                    {addresses.map((a) => (
                      <label key={a._id} className={`flex items-start gap-3 p-4 border-2 rounded-[8px] cursor-pointer transition-colors ${selectedAddr === a._id ? 'border-[#FFB700] bg-amber-50' : 'border-[#E9E9E9] hover:border-[#C5C5C5]'}`}>
                        <input type="radio" name="savedAddr" value={a._id} checked={selectedAddr === a._id} onChange={() => setSelectedAddr(a._id)} className="mt-0.5 accent-[#FFB700]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-[#1A1A1A]">{a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()}</span>
                            {a.label    && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{a.label}</span>}
                            {a.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Default</span>}
                          </div>
                          <p className="text-[12px] text-[#60717B]">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                          <p className="text-[12px] text-[#60717B]">{a.city}, {a.state || a.province} {a.postalCode}</p>
                          <p className="text-[12px] text-[#60717B]">{a.phone}</p>
                        </div>
                      </label>
                    ))}
                  </fieldset>
                )}

                {isAuthenticated && addresses.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-[#E9E9E9]" aria-hidden="true" />
                    <button onClick={() => setSelectedAddr(null)} className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${!selectedAddr ? 'bg-[#FFB700] border-[#FFB700] text-black' : 'border-[#C5C5C5] text-[#60717B] hover:border-[#FFB700]'}`}>
                      Or enter a new address
                    </button>
                    <div className="flex-1 h-px bg-[#E9E9E9]" aria-hidden="true" />
                  </div>
                )}

                {(!selectedAddr || !isAuthenticated || addresses.length === 0) && (
                  <fieldset className="grid grid-cols-2 gap-3 mb-5">
                    <legend className="sr-only">New address</legend>
                    {[
                      { key: 'firstName',   label: 'First Name',      col: '', required: true },
                      { key: 'lastName',    label: 'Last Name',        col: '', required: true },
                      { key: 'addressLine1',label: 'Address Line 1',   col: 'col-span-2', required: true, placeholder: 'Street address, P.O. box' },
                      { key: 'addressLine2',label: 'Address Line 2',   col: 'col-span-2', optional: true, placeholder: 'Apartment, suite, unit, floor' },
                      { key: 'city',        label: 'City',             col: '', required: true },
                      { key: 'postalCode',  label: 'Postal Code',      col: '', required: true },
                      { key: 'province',    label: 'Province',         col: '', required: true },
                      { key: 'phone',       label: 'Phone',            col: '', required: true, type: 'tel' },
                    ].map(({ key, label, col, required, optional, type, placeholder }) => (
                      <div key={key} className={col}>
                        <label htmlFor={`addr-${key}`} className="block text-[12px] font-medium text-[#60717B] mb-1">
                          {label}{required && ' *'}{optional && <span className="text-gray-400"> (Optional)</span>}
                        </label>
                        <input id={`addr-${key}`} type={type || 'text'} value={newAddr[key]} onChange={(e) => setNewAddr({ ...newAddr, [key]: e.target.value })} placeholder={placeholder} className={INPUT_CLS} />
                      </div>
                    ))}
                    {isAuthenticated && (
                      <div className="col-span-2 flex items-center gap-2 pt-1">
                        <input type="checkbox" id="saveAddr" checked={newAddr.save} onChange={(e) => setNewAddr({ ...newAddr, save: e.target.checked })} className="accent-[#FFB700] w-4 h-4" />
                        <label htmlFor="saveAddr" className="text-[12px] text-[#60717B] cursor-pointer">Save this address to my account</label>
                      </div>
                    )}
                  </fieldset>
                )}

                <div className="mb-5">
                  <h3 className="text-[14px] font-black text-[#1A1A1A] mb-3 flex items-center gap-2">
                    <FiTruck size={16} className="text-[#FFB700]" aria-hidden="true" /> Shipping Method
                  </h3>
                  <div className="bg-[#F5F5F5] border border-[#E9E9E9] rounded-[8px] px-4 py-2.5 mb-3 flex items-center gap-2">
                    <FiPackage size={14} className="text-[#60717B] flex-shrink-0" aria-hidden="true" />
                    <p className="text-[12px] text-[#60717B]">
                      Total cart weight: <span className="font-bold text-[#1A1A1A]">{totalWeightKg > 0 ? `${totalWeightKg.toFixed(2)} kg` : '—'}</span> · Shipping cost is calculated based on this weight.
                    </p>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="sr-only">Shipping method</legend>
                    {SHIPPING_METHODS.map((m) => {
                      const price = calcShipping(m.id, totalWeightKg);
                      return (
                        <label key={m.id} className={`flex items-center gap-3 p-4 border-2 rounded-[8px] cursor-pointer transition-colors ${shippingMethod === m.id ? 'border-[#FFB700] bg-amber-50' : 'border-[#E9E9E9] hover:border-[#C5C5C5]'}`}>
                          <input type="radio" name="shippingMethod" value={m.id} checked={shippingMethod === m.id} onChange={() => setShippingMethod(m.id)} className="accent-[#FFB700]" />
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
                </div>

                <div className="mb-6">
                  <label htmlFor="order-notes" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
                    Order Notes <span className="text-[#60717B] font-normal text-[12px]">(Optional)</span>
                  </label>
                  <textarea id="order-notes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={3} maxLength={500} placeholder="Special instructions for your order or delivery…" className="w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA] resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 border border-[#C5C5C5] px-5 py-3 rounded-[6px] font-bold text-[13px] text-[#1A1A1A] hover:bg-gray-50 transition-colors">← Back</button>
                  <button onClick={handleContinueToPayment} className="flex-1 bg-[#FFB700] text-black py-3 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors">Continue To Payment →</button>
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Payment ══ */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1.5">Delivering To</p>
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">{shippingAddress.fullName || '—'}</p>
                      {shippingAddress.addressLine1 && <p className="text-[12px] text-[#60717B]">{shippingAddress.addressLine1}{shippingAddress.city ? `, ${shippingAddress.city}` : ''}</p>}
                      {shippingAddress.phone && <p className="text-[12px] text-[#60717B]">{shippingAddress.phone}</p>}
                    </div>
                    <button onClick={() => setStep(2)} className="text-[12px] text-[#FFB700] font-semibold hover:underline flex items-center gap-0.5">
                      Change <FiChevronRight size={12} aria-hidden="true" />
                    </button>
                  </div>
                  {shippingMethod && (
                    <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiTruck size={13} className="text-[#FFB700]" aria-hidden="true" />
                        <span className="text-[12px] font-medium text-[#1A1A1A]">{SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.label}</span>
                      </div>
                      <span className="text-[12px] font-bold text-[#1A1A1A]">{shippingCost === 0 ? 'Free' : `Rs. ${shippingCost.toLocaleString()}`}</span>
                    </div>
                  )}
                </div>

                {isAuthenticated && (
                  <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 mb-3">
                      <FiStar size={15} className="text-[#FFB700]" aria-hidden="true" />
                      <p className="text-[13px] font-bold text-[#1A1A1A]">Use Loyalty Points</p>
                      <span className="ml-auto text-[12px] text-[#60717B]">Available: <span className="font-bold text-[#FFB700]">{availablePts.toLocaleString()} pts</span></span>
                    </div>
                    {loyaltyApplied > 0 ? (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2" role="status">
                        <span className="text-[12px] font-bold text-amber-700">{loyaltyApplied} pts applied (−Rs. {loyaltyApplied.toLocaleString()})</span>
                        <button onClick={() => { setLoyaltyApplied(0); setLoyaltyInput(''); }} aria-label="Remove loyalty points" className="text-amber-600 hover:text-red-500 transition-colors"><FiX size={13} aria-hidden="true" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input type="number" min={1} max={availablePts} value={loyaltyInput} onChange={(e) => setLoyaltyInput(e.target.value)} placeholder={`Up to ${availablePts} pts`} aria-label="Loyalty points to apply" className="flex-1 border border-[#C5C5C5] rounded-[6px] px-3 py-2 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]" />
                        <button onClick={applyLoyalty} className="bg-[#FFB700] text-black px-5 rounded-[6px] text-[13px] font-bold hover:bg-amber-500 transition-colors">Apply Points</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
                  <p className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wider mb-4">Payment Method</p>
                  <div className="flex border border-[#E9E9E9] rounded-[8px] overflow-hidden mb-5" role="tablist" aria-label="Payment method">
                    {PAY_TABS.map((t) => (
                      <button key={t.id} role="tab" aria-selected={payTab === t.id} onClick={() => { setPayTab(t.id); setPaypalOrder(null); }} className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors border-r border-[#E9E9E9] last:border-r-0 ${payTab === t.id ? 'bg-[#FFB700] text-black' : 'text-[#60717B] hover:bg-gray-50'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {payTab === 'card' && (
                    <div>
                      {isAuthenticated && MOCK_SAVED_CARDS.length > 0 && (
                        <fieldset className="space-y-2 mb-4">
                          <legend className="sr-only">Saved cards</legend>
                          {MOCK_SAVED_CARDS.map((c) => (
                            <label key={c.id} className={`flex items-center gap-3 p-3.5 border-2 rounded-[8px] cursor-pointer transition-colors ${selectedCard === c.id && !useNewCard ? 'border-[#FFB700] bg-amber-50' : 'border-[#E9E9E9] hover:border-[#C5C5C5]'}`}>
                              <input type="radio" name="savedCard" checked={selectedCard === c.id && !useNewCard} onChange={() => { setSelectedCard(c.id); setUseNewCard(false); }} className="accent-[#FFB700]" />
                              <div className="w-10 h-6 bg-[#1A1A1A] rounded flex items-center justify-center flex-shrink-0" aria-hidden="true"><span className="text-white text-[9px] font-black">VISA</span></div>
                              <div className="flex-1">
                                <p className="text-[13px] font-semibold text-[#1A1A1A]">●●●● ●●●● ●●●● {c.last4}</p>
                                <p className="text-[11px] text-[#60717B]">{c.name} · Expires {c.expiry}</p>
                              </div>
                            </label>
                          ))}
                        </fieldset>
                      )}
                      {isAuthenticated && MOCK_SAVED_CARDS.length > 0 && (
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-px bg-[#E9E9E9]" aria-hidden="true" />
                          <button onClick={() => setUseNewCard(true)} className={`text-[12px] font-medium px-3 py-1 rounded-full border transition-colors ${useNewCard ? 'bg-[#FFB700] border-[#FFB700] text-black' : 'border-[#C5C5C5] text-[#60717B] hover:border-[#FFB700]'}`}>Or use a new card</button>
                          <div className="flex-1 h-px bg-[#E9E9E9]" aria-hidden="true" />
                        </div>
                      )}
                      {(useNewCard || !isAuthenticated || MOCK_SAVED_CARDS.length === 0) && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label htmlFor="card-number" className="block text-[12px] font-medium text-[#60717B] mb-1">Card Number</label>
                            <input id="card-number" value={cardInfo.number} onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })} placeholder="1234 5678 9012 3456" className={INPUT_CLS} maxLength={19} inputMode="numeric" autoComplete="cc-number" />
                          </div>
                          <div className="col-span-2">
                            <label htmlFor="card-name" className="block text-[12px] font-medium text-[#60717B] mb-1">Name on Card</label>
                            <input id="card-name" value={cardInfo.name} onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })} className={INPUT_CLS} autoComplete="cc-name" />
                          </div>
                          <div>
                            <label htmlFor="card-expiry" className="block text-[12px] font-medium text-[#60717B] mb-1">Expiry Date</label>
                            <input id="card-expiry" value={cardInfo.expiry} onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })} placeholder="MM/YY" className={INPUT_CLS} maxLength={5} autoComplete="cc-exp" />
                          </div>
                          <div>
                            <label htmlFor="card-cvv" className="block text-[12px] font-medium text-[#60717B] mb-1">CVV</label>
                            <input id="card-cvv" type="password" value={cardInfo.cvv} onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })} placeholder="●●●" className={INPUT_CLS} maxLength={4} autoComplete="cc-csc" aria-label="Card security code" />
                          </div>
                          {isAuthenticated && (
                            <div className="col-span-2 flex items-center gap-2 pt-1">
                              <input type="checkbox" id="saveCard" checked={cardInfo.save} onChange={(e) => setCardInfo({ ...cardInfo, save: e.target.checked })} className="accent-[#FFB700] w-4 h-4" />
                              <label htmlFor="saveCard" className="text-[12px] text-[#60717B] cursor-pointer">Save this card for future payments</label>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
                        <p className="text-[13px] font-semibold text-[#1A1A1A] mb-2">Billing Address</p>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="billingSame" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="accent-[#FFB700] w-4 h-4" />
                          <label htmlFor="billingSame" className="text-[12px] text-[#60717B] cursor-pointer">Same as delivery address</label>
                        </div>
                        {billingSame && shippingAddress.addressLine1 && (
                          <p className="text-[12px] text-[#60717B] mt-2 bg-[#F5F5F5] rounded-[6px] px-3 py-2">
                            {shippingAddress.fullName} · {shippingAddress.addressLine1}, {shippingAddress.city}
                          </p>
                        )}
                      </div>
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
                      <p className="text-[12px] text-[#60717B] max-w-[280px] mx-auto">Pay with cash when your order is delivered. No prepayment required.</p>
                    </div>
                  )}

                  {payTab === 'koko' && (
                    <div className="py-6 text-center">
                      <div className="w-20 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center mx-auto mb-3" aria-hidden="true"><span className="text-white font-black text-lg tracking-wider">KOKO</span></div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Buy Now, Pay Later with KOKO</p>
                      <p className="text-[12px] text-[#60717B] max-w-[280px] mx-auto">Split into 3 easy monthly installments at 0% interest.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 border border-[#C5C5C5] px-5 py-3 rounded-[6px] font-bold text-[13px] text-[#1A1A1A] hover:bg-gray-50 transition-colors">← Back</button>
                  <button onClick={handlePlaceOrder} disabled={placing || orderLoading} className="flex-1 bg-[#FFB700] text-black py-3 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {placing || orderLoading
                      ? 'Processing…'
                      : <><span>Place Order · Rs. {total.toLocaleString()}</span><FiChevronRight size={16} aria-hidden="true" /></>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-[300px] flex-shrink-0" aria-label="Order summary">
            <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 sticky top-24 shadow-[2px_3px_8px_rgba(0,0,0,0.05)]">
              {step >= 2 && items.length > 0 && (
                <div className="mb-4 pb-4 border-b border-[#F0F0F0]">
                  <p className="text-[11px] font-black text-[#60717B] uppercase tracking-wider mb-3">Your Items ({items.length})</p>
                  <ul className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                    {items.map((item) => {
                      const p = item.product;
                      return (
                        <li key={p?._id} className="flex items-center gap-2.5">
                          <img src={p?.images?.[0]?.url || 'https://placehold.co/44?text=P'} alt={p?.name} className="w-10 h-10 object-cover rounded-[5px] border border-[#E9E9E9] flex-shrink-0" loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{p?.name}</p>
                            <p className="text-[11px] text-[#60717B]">Qty {item.quantity}</p>
                          </div>
                          <span className="text-[12px] font-bold text-[#1A1A1A] whitespace-nowrap">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(p?._id)}
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
                <div className="flex justify-between text-[13px]"><dt className="text-[#60717B]">Subtotal ({items.length} items)</dt><dd className="font-medium text-[#1A1A1A]">Rs. {subtotal.toLocaleString()}</dd></div>
                {discount > 0 && <div className="flex justify-between text-[13px]"><dt className="text-green-600 flex items-center gap-1"><FiTag size={11} aria-hidden="true" /> {couponApplied || 'Discount'}</dt><dd className="text-green-600 font-medium">−Rs. {discount.toLocaleString()}</dd></div>}
                {loyaltyApplied > 0 && <div className="flex justify-between text-[13px]"><dt className="text-amber-600 flex items-center gap-1"><FiStar size={11} aria-hidden="true" /> Loyalty Points</dt><dd className="text-amber-600 font-medium">−Rs. {loyaltyApplied.toLocaleString()}</dd></div>}
                <div className="flex justify-between text-[13px]"><dt className="text-[#60717B] flex items-center gap-1"><FiPackage size={11} aria-hidden="true" /> Total Weight</dt><dd className="font-medium text-[#1A1A1A]">{totalWeightKg > 0 ? `${totalWeightKg.toFixed(2)} kg` : '—'}</dd></div>
                <div className="flex justify-between text-[13px]">
                  <dt className="text-[#60717B]">Shipping</dt>
                  <dd>{shippingMethod ? <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : 'text-[#1A1A1A]'}`}>{shippingCost === 0 ? 'Free' : `Rs. ${shippingCost.toLocaleString()}`}</span> : <span className="text-[#60717B] italic text-[12px]">Select method</span>}</dd>
                </div>
                <div className="flex justify-between text-[13px]"><dt className="text-[#60717B]">VAT </dt><dd className="font-medium text-[#1A1A1A]">Rs. {tax.toLocaleString()}</dd></div>
                <div className="border-t border-[#E9E9E9] pt-3 flex justify-between">
                  <dt className="text-[15px] font-black text-[#1A1A1A]">Total</dt>
                  <dd className="text-right"><span className="text-[15px] font-black text-[#1A1A1A]">Rs. {total.toLocaleString()}</span>{!shippingMethod && <p className="text-[10px] text-[#60717B]">* Excl. shipping</p>}</dd>
                </div>
              </dl>

              {step === 3 ? (
                <button onClick={handlePlaceOrder} disabled={placing || orderLoading} className="w-full bg-[#FFB700] text-black font-bold text-[13px] py-3 rounded-[6px] hover:bg-amber-500 transition-colors disabled:opacity-60 mb-2.5">
                  {placing || orderLoading ? 'Processing…' : `Place Order · Rs. ${total.toLocaleString()}`}
                </button>
              ) : (
                <button onClick={() => setStep((s) => Math.min(s + 1, 3))} className="w-full bg-[#FFB700] text-black font-bold text-[13px] py-3 rounded-[6px] hover:bg-amber-500 transition-colors mb-2.5">
                  Proceed To Checkout
                </button>
              )}

              <Link to="/cart" className="w-full flex items-center justify-center border border-[#C5C5C5] text-[#1A1A1A] font-medium text-[13px] py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors mb-4">
                ← Continue Shopping
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