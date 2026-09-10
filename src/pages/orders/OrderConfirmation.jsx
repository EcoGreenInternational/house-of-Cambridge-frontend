import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../../redux/slices/orderSlice';
import Layout from '../../components/common/Layout';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  FiCheck, FiArrowRight, FiDownload, FiMail, FiMessageSquare,
  FiMapPin, FiCreditCard, FiStar, FiShoppingCart,
} from 'react-icons/fi';
import { downloadInvoice } from '../../utils/invoiceGenerator';

const STEPS = [
  { n: 1, label: 'Cart Review'  },
  { n: 2, label: 'Shipping'     },
  { n: 3, label: 'Payment'      },
  { n: 4, label: 'Confirmation' },
];

const LOYALTY_RATE = 50;

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

export default function OrderConfirmation() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const { order, loading } = useSelector((s) => s.orders);
  const { user }           = useSelector((s) => s.auth);

  useEffect(() => {
    if (id && OBJECT_ID_RE.test(id)) dispatch(fetchOrder(id));
  }, [id, dispatch]);

  if (loading) return <Layout><PageSpinner /></Layout>;

  const items         = Array.isArray(order?.items) ? order.items : [];
  const subtotal      = safeNum(order?.subtotal, items.reduce((s, i) => s + safeNum(i.price) * safeNum(i.quantity), 0));
  const discount      = safeNum(order?.discount);
  const shipping      = safeNum(order?.shippingCost);
  const tax           = safeNum(order?.tax, Math.round((subtotal - discount) * 0.08));
  const totalPaid     = safeNum(order?.total, subtotal - discount + shipping + tax);
  const loyaltyEarned = order?.loyaltyPointsEarned ?? Math.floor(totalPaid / LOYALTY_RATE);

  const customerName  = order?.guestName  || user?.name  || 'Customer';
  const customerEmail = order?.guestEmail || user?.email || '';
  const payMethod     = (order?.paymentMethod || '—').replace(/_/g, ' ');
  const shippingAddr  = order?.shippingAddress;
  const firstName     = customerName.split(' ')[0] || 'Customer';

  
  const displayOrderId = order?.orderNumber || (order?._id ? `#${order._id.slice(-8).toUpperCase()}` : '—');

  return (
    <Layout>
      <main className="max-w-[860px] mx-auto px-4 py-8 pb-16">

   
        <nav aria-label="Checkout progress" className="flex items-center justify-center mb-8 overflow-x-auto px-2">
          {STEPS.map(({ n, label }, idx) => (
            <div key={n} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white"
                  aria-label={`Step ${n}: ${label} — complete`}
                >
                  <FiCheck size={16} strokeWidth={3} aria-hidden="true" />
                </div>
                <span className="text-[11px] font-medium text-green-600 whitespace-nowrap">{label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="w-14 sm:w-20 h-[2px] mx-2 mb-4 rounded-full bg-green-400" aria-hidden="true" />
              )}
            </div>
          ))}
        </nav>

  
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <FiCheck size={34} className="text-green-500" strokeWidth={3} />
          </div>
          <h1 className="text-[28px] font-black text-[#1A1A1A] mb-2">Order Placed Successfully!</h1>
          <p className="text-[14px] text-[#60717B] mb-3">
            Thank you, <span className="font-semibold text-[#1A1A1A]">{firstName}</span>!
            Your order has been confirmed and is being processed.
          </p>
          {order && (
            <span className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white text-[13px] font-bold px-4 py-2 rounded-full">
              <FiShoppingCart size={13} aria-hidden="true" />
              {displayOrderId}
            </span>
          )}
        </div>

        {order && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-5" role="status" aria-live="polite">
            <div className="flex items-center gap-1.5 text-[12px] text-[#60717B]">
              <FiMail size={13} className="text-green-500" aria-hidden="true" />
              Confirmation sent to{' '}
              <span className="font-semibold text-[#1A1A1A]">{customerEmail || '—'}</span>
            </div>
            {shippingAddr?.phone && (
              <div className="flex items-center gap-1.5 text-[12px] text-[#60717B]">
                <FiMessageSquare size={13} className="text-blue-500" aria-hidden="true" />
                SMS sent to{' '}
                <span className="font-semibold text-[#1A1A1A]">{shippingAddr.phone}</span>
              </div>
            )}
          </div>
        )}

   
        <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-5 py-3.5 flex items-center gap-3 mb-6" role="note">
          <div className="w-8 h-8 bg-[#FFB700] rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <FiStar size={15} className="text-black" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#1A1A1A]">
              You&apos;ve earned{' '}
              <span className="text-[#FFB700]">{loyaltyEarned} Loyalty Points</span> with this order!
            </p>
            <p className="text-[12px] text-[#60717B]">
              Points will be credited to your account once the order is delivered.
            </p>
          </div>
        </div>

    
        {order && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <section
              className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_6px_rgba(0,0,0,0.04)]"
              aria-labelledby="delivery-info-heading"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center" aria-hidden="true">
                  <FiMapPin size={14} className="text-blue-500" />
                </div>
                <h2 id="delivery-info-heading" className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wide">
                  Delivery Information
                </h2>
              </div>
              {shippingAddr ? (
                <address className="not-italic space-y-1">
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{shippingAddr.fullName}</p>
                  <p className="text-[12px] text-[#60717B]">{shippingAddr.addressLine1}</p>
                  {shippingAddr.addressLine2 && (
                    <p className="text-[12px] text-[#60717B]">{shippingAddr.addressLine2}</p>
                  )}
                  <p className="text-[12px] text-[#60717B]">
                    {shippingAddr.city}{shippingAddr.state ? `, ${shippingAddr.state}` : ''} {shippingAddr.postalCode}
                  </p>
                  <p className="text-[12px] text-[#60717B]">{shippingAddr.phone}</p>
                </address>
              ) : (
                <p className="text-[12px] text-[#60717B]">—</p>
              )}
              <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
                <p className="text-[11px] text-[#60717B]">Estimated delivery</p>
                <p className="text-[12px] font-semibold text-[#1A1A1A]">
                  {addDays(2)} – {addDays(5)}
                </p>
              </div>
            </section>

            <section
              className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_6px_rgba(0,0,0,0.04)]"
              aria-labelledby="payment-info-heading"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-green-50 rounded-full flex items-center justify-center" aria-hidden="true">
                  <FiCreditCard size={14} className="text-green-600" />
                </div>
                <h2 id="payment-info-heading" className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wide">
                  Payment Information
                </h2>
              </div>
              <dl className="space-y-2">
                {[
                  { label: 'Payment Method', value: payMethod, cls: 'font-semibold text-[#1A1A1A] capitalize' },
                  {
                    label: 'Payment Status',
                    value: order.paymentStatus || 'Pending',
                    cls: `font-bold capitalize ${
                      order.paymentStatus === 'paid'    ? 'text-green-600' :
                      order.paymentStatus === 'pending' ? 'text-amber-600' : 'text-[#60717B]'
                    }`,
                  },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <dt className="text-[#60717B]">{label}</dt>
                    <dd className={cls}>{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between text-[12px]">
                  <dt className="text-[#60717B]">Order Status</dt>
                  <dd>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                      {(order.orderStatus || 'Processing').replace(/_/g, ' ')}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between text-[12px]">
                  <dt className="text-[#60717B]">Order Date</dt>
                  <dd className="font-medium text-[#1A1A1A]">
                    <time dateTime={order.createdAt}>{fmtDate(order.createdAt)}</time>
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        )}

  
        {items.length > 0 && (
          <section
            className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_6px_rgba(0,0,0,0.04)] mb-6"
            aria-labelledby="items-heading"
          >
            <div className="px-5 py-3.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 id="items-heading" className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wide">
                Items Ordered ({items.length} Product{items.length !== 1 ? 's' : ''})
              </h2>
            </div>
            <ul className="divide-y divide-[#F5F5F5]">
              {items.map((item, idx) => {
                const price = safeNum(item.price);
                const qty   = safeNum(item.quantity);
                return (
                  <li key={item._id || idx} className="flex items-center gap-4 px-5 py-4">
                    <img
                      src={item.image || item.product?.images?.[0]?.url || 'https://placehold.co/60?text=P'}
                      alt={item.name || item.product?.name || 'Product'}
                      className="w-14 h-14 object-cover rounded-[6px] border border-[#E9E9E9] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A] line-clamp-2">
                        {item.name || item.product?.name}
                      </p>
                      {(item.selectedVariant?.name || item.variant || item.size || item.color) && (
                        <p className="text-[11px] text-[#FFB700] font-semibold mt-0.5">
                          {item.selectedVariant?.name || [item.variant, item.size, item.color].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="text-[12px] text-[#60717B] mt-0.5">Qty: {qty}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[13px] font-bold text-[#1A1A1A]">Rs. {(price * qty).toLocaleString()}</p>
                      <p className="text-[11px] text-[#60717B]">Rs. {price.toLocaleString()} each</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

   
        {order && (
          <section
            className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_6px_rgba(0,0,0,0.04)] mb-8"
            aria-labelledby="summary-heading"
          >
            <h2 id="summary-heading" className="text-[12px] font-black text-[#1A1A1A] uppercase tracking-wide mb-4">
              Price Summary
            </h2>
            <dl className="space-y-2.5">
              <div className="flex justify-between text-[13px]">
                <dt className="text-[#60717B]">Subtotal</dt>
                <dd className="font-medium text-[#1A1A1A]">Rs. {subtotal.toLocaleString()}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[13px]">
                  <dt className="text-green-600">Discount</dt>
                  <dd className="text-green-600 font-medium">−Rs. {discount.toLocaleString()}</dd>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <dt className="text-[#60717B]">Shipping</dt>
                <dd className={`font-medium ${shipping === 0 ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                  {shipping === 0 ? 'Free' : `Rs. ${shipping.toLocaleString()}`}
                </dd>
              </div>
              <div className="flex justify-between text-[13px]">
                <dt className="text-[#60717B]">Tax (VAT 8%)</dt>
                <dd className="font-medium text-[#1A1A1A]">Rs. {tax.toLocaleString()}</dd>
              </div>
              <div className="border-t-2 border-[#1A1A1A] pt-3 flex justify-between">
                <dt className="text-[15px] font-black text-[#1A1A1A]">Total Paid</dt>
                <dd className="text-[18px] font-black text-[#1A1A1A]">Rs. {totalPaid.toLocaleString()}</dd>
              </div>
            </dl>
          </section>
        )}

      
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => downloadInvoice(order, customerName, customerEmail)}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold text-[14px] py-3.5 rounded-[8px] hover:bg-gray-50 transition-colors"
          >
            <FiDownload size={16} aria-hidden="true" /> Download Invoice (PDF)
          </button>
          <Link
            to="/shop"
            className="flex-1 flex items-center justify-center gap-2 bg-[#FFB700] text-black font-bold text-[14px] py-3.5 rounded-[8px] hover:bg-amber-500 transition-colors"
          >
            Continue Shopping <FiArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

    
        {order && (
          <div className="text-center mt-5">
            <Link
              to={`/track-order/${order._id}`}
              className="text-[13px] text-[#FFB700] font-semibold hover:underline inline-flex items-center justify-center gap-1"
            >
              Track your order status <FiArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}
      </main>
    </Layout>
  );
}