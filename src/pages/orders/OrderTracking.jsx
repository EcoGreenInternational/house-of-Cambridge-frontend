import { useEffect, useCallback, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../../redux/slices/orderSlice';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  FiCheck, FiPackage, FiTruck, FiMapPin, FiPhone, FiMail,
  FiMessageSquare, FiSearch, FiDownload, FiRotateCcw, FiList, FiArrowLeft,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { downloadInvoice } from '../../utils/invoiceGenerator';

const OBJECT_ID_RE   = /^[a-f\d]{24}$/i;
const MAX_INPUT_LEN  = 80;

const SHIP_STEPS = [
  { key: 'confirmed',        label: 'Order Confirmed',  icon: FiCheck   },
  { key: 'processing',       label: 'Processing',       icon: FiPackage },
  { key: 'dispatched',       label: 'Dispatched',       icon: FiTruck   },
  { key: 'in_transit',       label: 'In Transit',       icon: FiTruck   },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: FiTruck   },
  { key: 'delivered',        label: 'Delivered',        icon: FiCheck   },
];

const STATUS_TO_STEP = {
  pending: 0, confirmed: 0, processing: 1,
  dispatched: 2, in_transit: 3, out_for_delivery: 4, delivered: 5,
};

function stepIndexFromStatus(status) {
  return STATUS_TO_STEP[status] ?? 0;
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtDateTime(d) {
  return new Date(d || Date.now()).toLocaleString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

export default function OrderTracking() {
  const { id }   = useParams();          
  const dispatch = useDispatch();
  const { order, loading } = useSelector((s) => s.orders);
  const { user }           = useSelector((s) => s.auth);

  const [trackInput, setTrackInput] = useState(id || '');

  useEffect(() => {
    if (id && OBJECT_ID_RE.test(id)) dispatch(fetchOrder(id));
  }, [id, dispatch]);

  const handleInputChange = useCallback((e) => {
    const raw = e.target.value.replace(/[<>"'`]/g, '').slice(0, MAX_INPUT_LEN);
    setTrackInput(raw);
  }, []);

  const handleTrack = useCallback(() => {
    const val = trackInput.trim();
    if (!val) { toast.error('Enter an order ID'); return; }

    if (OBJECT_ID_RE.test(val)) {
      dispatch(fetchOrder(val));
    } else {
      toast.error('Please enter a valid Order ID (from your order confirmation)');
    }
  }, [trackInput, dispatch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleTrack();
  }, [handleTrack]);

  if (loading && !order) return <Layout><PageSpinner /></Layout>;

  const currentStepIdx = order ? stepIndexFromStatus(order.orderStatus) : -1;
  const progressPct    = order ? (currentStepIdx / (SHIP_STEPS.length - 1)) * 100 : 0;
  const shippingAddr   = order?.shippingAddress;
  const items          = Array.isArray(order?.items) ? order.items : [];

  const activityLog = order?.activityLog || [
    order && {
      time:   order.updatedAt || order.createdAt,
      title:  'Order is being prepared',
      desc:   'Your order has been received and is currently being processed at our warehouse.',
      active: true,
    },
    order && {
      time:   order.createdAt,
      title:  'Order confirmed & payment authorised',
      desc:   `Payment of Rs. ${safeNum(order.total).toLocaleString()} authorised. Order confirmation email sent.`,
      active: false,
    },
    order && {
      time:   order.createdAt,
      title:  'Order placed',
      desc:   `Order ${order.orderNumber || order._id} placed. ${items.length} item${items.length !== 1 ? 's' : ''} added to fulfilment queue.`,
      active: false,
    },
  ].filter(Boolean);

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Track your order' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pb-14">

        <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-5">
          <h1 className="text-[18px] font-black text-[#1A1A1A] mb-1">Track Your Order</h1>
          <p className="text-[12px] text-[#60717B] mb-4">
            Enter your order ID to get real-time updates on your shipment.
          </p>
          <div className="flex gap-2" role="search">
            <label htmlFor="track-input" className="sr-only">Order ID</label>
            <input
              id="track-input"
              type="search"
              value={trackInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your Order ID..."
              maxLength={MAX_INPUT_LEN}
              className="flex-1 border border-[#C5C5C5] rounded-[6px] px-4 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]"
            />
            <button
              type="button"
              onClick={handleTrack}
              className="bg-[#FFB700] text-black font-bold text-[13px] px-6 py-2.5 rounded-[6px] hover:bg-amber-500 transition-colors flex items-center gap-2"
            >
              <FiSearch size={14} aria-hidden="true" /> Track Order
            </button>
          </div>
          <p className="text-[11px] text-[#60717B] mt-2">
            Find your Order ID in your confirmation email or order history.
          </p>
        </div>

        {!order && !loading && (
          <div className="text-center py-16 text-[#60717B]" role="status">
            <FiPackage size={40} className="mx-auto mb-3 text-[#C5C5C5]" aria-hidden="true" />
            <p className="text-[14px]">Enter an order ID above to track your shipment.</p>
            <Link to="/orders" className="text-[13px] text-[#FFB700] font-semibold hover:underline mt-2 inline-block">
              View your orders →
            </Link>
          </div>
        )}

        {order && (
          <>
            <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-black text-[#1A1A1A] mb-1">
                    {order.orderNumber || `Order #${order._id.slice(-8).toUpperCase()}`}
                  </h2>
                  <p className="text-[12px] text-[#60717B]">
                    Placed: <time dateTime={order.createdAt}>{fmtDate(order.createdAt)}</time>
                    {' · '}{items.length} Item{items.length !== 1 ? 's' : ''}
                    {' · '}Rs. {safeNum(order.total).toLocaleString()}
                    {' · '}{(order.shippingMethod || 'Standard Delivery').replace(/_/g, ' ')}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full capitalize ${
                  order.orderStatus === 'delivered'  ? 'bg-green-100 text-green-700'  :
                  order.orderStatus === 'processing' ? 'bg-amber-100 text-amber-700'  :
                  order.orderStatus === 'cancelled'  ? 'bg-red-100   text-red-700'    :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {(order.orderStatus || 'Processing').replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <section
              className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-5"
              aria-labelledby="progress-heading"
            >
              <h2 id="progress-heading" className="text-[12px] font-black text-[#60717B] uppercase tracking-wider mb-6">
                Shipment Progress
              </h2>

              <div className="relative flex items-start justify-between" role="list" aria-label="Shipping steps">
                <div className="absolute top-5 left-0 right-0 h-[2px] bg-[#E9E9E9] z-0" aria-hidden="true" />
                <div
                  className="absolute top-5 left-0 h-[2px] bg-[#FFB700] z-0 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                  aria-hidden="true"
                />

                {SHIP_STEPS.map((s, i) => {
                  const done   = i < currentStepIdx;
                  const active = i === currentStepIdx;
                  const Icon   = s.icon;
                  return (
                    <div
                      key={s.key}
                      role="listitem"
                      aria-label={`${s.label}${done ? ' — complete' : active ? ' — current' : ' — pending'}`}
                      className="relative z-10 flex flex-col items-center gap-2 flex-1"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done   ? 'bg-[#FFB700] border-[#FFB700] text-black'  :
                        active ? 'bg-white border-[#FFB700] text-[#FFB700]'  :
                        'bg-white border-[#E9E9E9] text-[#C5C5C5]'
                      }`}>
                        {done
                          ? <FiCheck size={16} strokeWidth={3} aria-hidden="true" />
                          : <Icon size={15} aria-hidden="true" />
                        }
                      </div>
                      <div className="text-center">
                        <p className={`text-[11px] font-bold leading-tight max-w-[72px] ${
                          active || done ? 'text-[#1A1A1A]' : 'text-[#C5C5C5]'
                        }`}>
                          {s.label}
                        </p>
                        {active && <p className="text-[10px] text-[#FFB700] font-semibold mt-0.5">In Progress</p>}
                        {done && i === 0 && order.createdAt && (
                          <p className="text-[10px] text-[#60717B] mt-0.5">
                            <time dateTime={order.createdAt}>{fmtDate(order.createdAt)}</time>
                          </p>
                        )}
                        {!done && !active && (
                          <p className="text-[10px] text-[#C5C5C5] mt-0.5">
                            {i === 2 ? `Est. ${addDays(1)}`               :
                             i === 3 ? `Est. ${addDays(2)}–${addDays(3)}` :
                             i === 4 ? `Est. ${addDays(3)}–${addDays(5)}` : '—'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 bg-[#F8F8F8] border border-[#E9E9E9] rounded-[8px] px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-[#60717B] uppercase tracking-wider mb-0.5">
                    Estimated Delivery Window
                  </p>
                  <p className="text-[14px] font-black text-[#1A1A1A]">{addDays(3)} – {addDays(6)}</p>
                </div>
                {shippingAddr && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#60717B] uppercase tracking-wider mb-0.5">Shipping to</p>
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">
                      {shippingAddr.fullName} · {shippingAddr.city}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-5"
              aria-labelledby="activity-heading"
            >
              <h2 id="activity-heading" className="text-[12px] font-black text-[#60717B] uppercase tracking-wider mb-5">
                Detailed Activity Log
              </h2>
              <ol className="space-y-4">
                {activityLog.map((log, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                        log.active ? 'bg-[#FFB700] border-[#FFB700]' : 'bg-white border-[#C5C5C5]'
                      }`} aria-hidden="true" />
                      {i < activityLog.length - 1 && (
                        <div className="w-[1px] flex-1 bg-[#E9E9E9] mt-1" aria-hidden="true" />
                      )}
                    </div>
                    <div className="pb-4">
                      <time className="text-[11px] text-[#60717B] mb-0.5 block" dateTime={log.time}>
                        {fmtDateTime(log.time)}
                      </time>
                      <p className="text-[13px] font-bold text-[#1A1A1A] mb-0.5">{log.title}</p>
                      <p className="text-[12px] text-[#60717B] leading-relaxed">{log.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 shadow-[2px_3px_6px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-black text-[#60717B] uppercase tracking-wider mb-3">Delivery Address</p>
                {shippingAddr ? (
                  <address className="not-italic space-y-0.5 text-[12px] text-[#60717B]">
                    <p className="font-semibold text-[#1A1A1A]">{shippingAddr.fullName}</p>
                    <p>Phone: {shippingAddr.phone}</p>
                    <p>{shippingAddr.addressLine1}</p>
                    {shippingAddr.addressLine2 && <p>{shippingAddr.addressLine2}</p>}
                    <p>{shippingAddr.city}{shippingAddr.state ? `, ${shippingAddr.state}` : ''} {shippingAddr.postalCode}</p>
                    <p>{shippingAddr.country || 'Sri Lanka'}</p>
                  </address>
                ) : (
                  <p className="text-[12px] text-[#60717B]">—</p>
                )}
              </div>

              <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 shadow-[2px_3px_6px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-black text-[#60717B] uppercase tracking-wider mb-3">Carrier Information</p>
                <dl className="space-y-1.5 text-[12px]">
                  {[
                    { label: 'Carrier',      value: 'HOC Express' },
                    { label: 'Service',      value: `${(order.shippingMethod || 'Standard').replace(/_/g, ' ')} (3–5 days)` },
                    { label: 'Tracking No.', value: order.trackingNumber || 'Pending dispatch' },
                    { label: 'Ship Date',    value: order.shippedAt ? fmtDate(order.shippedAt) : `Est. ${addDays(1)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2">
                      <dt className="text-[#60717B] min-w-[80px]">{label}:</dt>
                      <dd className="font-medium text-[#1A1A1A]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 shadow-[2px_3px_6px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-black text-[#60717B] uppercase tracking-wider mb-3">Contact &amp; Support</p>
                <p className="text-[12px] text-[#60717B] mb-3">Questions about your delivery?</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[12px]">
                    <FiMessageSquare size={12} className="text-green-500" aria-hidden="true" />
                    <span className="text-[#60717B]">Live Chat:</span>
                    <span className="font-semibold text-green-600">Available now</span>
                  </li>
                  <li className="flex items-center gap-2 text-[12px]">
                    <FiMail size={12} className="text-[#60717B]" aria-hidden="true" />
                    <a href="mailto:support@houseofcambridge.lk" className="text-[#60717B] hover:underline">
                      support@houseofcambridge.lk
                    </a>
                  </li>
                  <li className="flex items-center gap-2 text-[12px]">
                    <FiPhone size={12} className="text-[#60717B]" aria-hidden="true" />
                    <a href="tel:+94112847846" className="text-[#60717B] hover:underline">+94 11 284 7846</a>
                  </li>
                </ul>
              </div>
            </div>

            <section
              className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-6"
              aria-labelledby="shipment-items-heading"
            >
              <div className="px-5 py-3.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                <h2 id="shipment-items-heading" className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wide">
                  Items In This Shipment ({items.length})
                </h2>
              </div>
              <ul className="divide-y divide-[#F5F5F5]">
                {items.map((item, idx) => {
                  const price = safeNum(item.price);
                  const qty   = safeNum(item.quantity);
                  return (
                    <li key={item._id || idx} className="flex items-center gap-4 px-5 py-4">
                      <img
                        src={item.image || item.product?.images?.[0]?.url || 'https://placehold.co/56?text=P'}
                        alt={item.name || item.product?.name || 'Product'}
                        className="w-14 h-14 object-cover rounded-[6px] border border-[#E9E9E9] flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1A1A1A]">
                          {item.name || item.product?.name}
                        </p>
                        {item.selectedVariant?.name && (
                          <p className="text-[11px] text-[#FFB700] font-semibold">Variant: {item.selectedVariant.name}</p>
                        )}
                        <p className="text-[12px] text-[#60717B]">Qty: {qty}</p>
                      </div>
                      <span className="text-[13px] font-bold text-[#1A1A1A] whitespace-nowrap">
                        Rs. {(price * qty).toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <nav className="flex flex-wrap gap-2" aria-label="Order actions">
              <button
                type="button"
                onClick={() => downloadInvoice(order, shippingAddr?.fullName || user?.name, order.guestEmail || user?.email)}
                className="flex items-center gap-2 border border-[#C5C5C5] text-[#1A1A1A] text-[12px] font-semibold px-4 py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                <FiDownload size={13} aria-hidden="true" /> Download Invoice
              </button>
              {order.orderStatus === 'delivered' && (
                <Link
                  to={`/orders/${order._id}/return`}
                  className="flex items-center gap-2 border border-[#C5C5C5] text-[#1A1A1A] text-[12px] font-semibold px-4 py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
                >
                  <FiRotateCcw size={13} aria-hidden="true" /> Request Return
                </Link>
              )}
              {order.orderStatus === 'return_requested' && (
                <Link
                  to={`/return-status/${order._id}`}
                  className="flex items-center gap-2 border border-amber-300 text-amber-700 text-[12px] font-semibold px-4 py-2.5 rounded-[6px] hover:bg-amber-50 transition-colors"
                >
                  <FiList size={13} aria-hidden="true" /> Return Status
                </Link>
              )}
              <Link
                to="/contact"
                className="flex items-center gap-2 border border-[#C5C5C5] text-[#1A1A1A] text-[12px] font-semibold px-4 py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                <FiPhone size={13} aria-hidden="true" /> Contact Support
              </Link>
              <Link
                to={`/orders/${order._id}`}
                className="flex items-center gap-2 border border-[#C5C5C5] text-[#1A1A1A] text-[12px] font-semibold px-4 py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                <FiList size={13} aria-hidden="true" /> View Order Details
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-2 border border-[#C5C5C5] text-[#1A1A1A] text-[12px] font-semibold px-4 py-2.5 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                <FiArrowLeft size={13} aria-hidden="true" /> Back to Orders
              </Link>
            </nav>
          </>
        )}
      </div>
    </Layout>
  );
}