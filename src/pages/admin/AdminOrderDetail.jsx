import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchAdminOrder, updateAdminOrderStatus } from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import {
  FiArrowLeft, FiMapPin, FiCreditCard, FiPackage,
  FiUser, FiTruck, FiClipboard,
} from 'react-icons/fi';
import { ORDER_STATUSES } from '../../constants/order.js';

const STATUSES = ORDER_STATUSES;

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed:        'bg-blue-100   text-blue-700   border-blue-200',
  processing:       'bg-purple-100 text-purple-700 border-purple-200',
  shipped:          'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:        'bg-green-100  text-green-700  border-green-200',
  cancelled:        'bg-red-100    text-red-700    border-red-200',
  return_requested: 'bg-orange-100 text-orange-700 border-orange-200',
  returned:         'bg-gray-100   text-gray-700   border-gray-200',
};

const TIMELINE_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const INPUT_CLS =
  'w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E9E9E9] p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F4F5F7]">
        <Icon size={16} className="text-[#FFB700]" aria-hidden="true" />
        <h3 className="text-[14px] font-bold text-[#1A1A1A]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AdminOrderDetail() {

  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedOrder: order, loading } = useSelector((s) => s.admin);
  const { toasts, toast, removeToast } = useToast();

  const [status,         setStatus]         = useState('');
  const [paymentStatus,  setPaymentStatus]  = useState('pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes,     setAdminNotes]     = useState('');
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchAdminOrder(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (order) {
      setStatus(order.orderStatus || '');
      setPaymentStatus(order.paymentStatus || 'pending');
      setTrackingNumber(order.trackingNumber || '');
      setAdminNotes(order.adminNotes || '');
    }
  }, [order]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
   
      await dispatch(updateAdminOrderStatus({
        id,
        data: { status, paymentStatus, trackingNumber, adminNotes },
      })).unwrap();
      toast.success('Order updated successfully');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !order) return <AdminLayout><PageSpinner /></AdminLayout>;
  if (!order) return (
    <AdminLayout>
      <div className="p-6">
        <Link to="/admin/orders" className="text-[#FFB700] font-semibold hover:underline flex items-center gap-2">
          <FiArrowLeft size={16} /> Back to Orders
        </Link>
        <p className="text-[#60717B] mt-4">Order not found.</p>
      </div>
    </AdminLayout>
  );

  const timelineStep = TIMELINE_STEPS.indexOf(order.orderStatus);
  const showTimeline = !['cancelled', 'return_requested', 'returned'].includes(order.orderStatus);

  const paymentColor =
    order.paymentStatus === 'paid'     ? 'text-green-600' :
    order.paymentStatus === 'refunded' ? 'text-blue-600'  : 'text-amber-600';

  const paySelectCls =
    paymentStatus === 'paid'     ? 'border-green-300  text-green-700'  :
    paymentStatus === 'refunded' ? 'border-blue-300   text-blue-700'   :
    paymentStatus === 'failed'   ? 'border-red-300    text-red-700'    :
                                   'border-[#E9E9E9]  text-amber-600';

  const summaryRows = [
    { label: 'Subtotal',  val: `Rs.${order.subtotal?.toLocaleString()}` },
    order.discount > 0 && { label: 'Discount', val: `-Rs.${order.discount?.toLocaleString()}`, cls: 'text-green-600' },
    { label: 'Shipping',  val: order.shippingCost > 0 ? `Rs.${order.shippingCost}` : 'Free', cls: order.shippingCost === 0 ? 'text-green-600' : '' },
    { label: 'Tax (8%)',  val: `Rs.${order.tax?.toLocaleString()}` },
  ].filter(Boolean);

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-[1100px]">

     
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/orders" className="text-[#60717B] hover:text-[#1A1A1A]">
              <FiArrowLeft size={20} />
            </Link>
            <div>
         
              <h2 className="text-[20px] font-black text-[#1A1A1A]">
                {order.orderNumber || `Order #${order._id?.slice(-8).toUpperCase()}`}
              </h2>
              <p className="text-[13px] text-[#60717B]">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[13px] font-semibold capitalize border ${
            STATUS_COLORS[order.orderStatus] ?? 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {order.orderStatus?.replace(/_/g, ' ')}
          </span>
        </div>

      
        {showTimeline && (
          <div className="bg-white rounded-[12px] border border-[#E9E9E9] p-5" aria-label="Order progress">
            <div className="flex items-center justify-between">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 ${i < timelineStep ? 'bg-[#FFB700]' : 'bg-[#E9E9E9]'}`}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold relative z-10 ${
                      i <= timelineStep ? 'bg-[#FFB700] text-[#1A1A1A]' : 'bg-[#E9E9E9] text-[#60717B]'
                    }`}
                    aria-label={`${step}${i < timelineStep ? ' (completed)' : i === timelineStep ? ' (current)' : ''}`}
                  >
                    {i < timelineStep ? '✓' : i + 1}
                  </div>
                  <p className="text-[11px] text-[#60717B] mt-1.5 capitalize font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

     
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

         
            <Section icon={FiPackage} title="Order Items">
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#F4F5F7] last:border-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-[8px] flex-shrink-0" />
                      : <div className="w-12 h-12 bg-[#F4F5F7] rounded-[8px] flex-shrink-0" aria-hidden="true" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{item.name}</p>
                      {item.selectedVariant?.name && (
                        <p className="text-[11px] text-[#FFB700] font-semibold">Variant: {item.selectedVariant.name}</p>
                      )}
                      <p className="text-[12px] text-[#60717B]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[13px] font-bold text-[#1A1A1A] flex-shrink-0">
                      Rs.{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9E9E9] space-y-1.5">
                {summaryRows.map(({ label, val, cls }) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <span className="text-[#60717B]">{label}</span>
                    <span className={`font-medium ${cls || 'text-[#1A1A1A]'}`}>{val}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[15px] font-black text-[#1A1A1A] border-t border-[#E9E9E9] pt-2 mt-1">
                  <span>Total</span>
                  <span>Rs.{order.total?.toLocaleString()}</span>
                </div>
              </div>
            </Section>

            
            <Section icon={FiClipboard} title="Update Order">
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="order-status" className="text-[12px] font-semibold text-[#1A1A1A] block mb-1">
                      Order Status
                    </label>
                    <select
                      id="order-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={INPUT_CLS}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="payment-status" className="text-[12px] font-semibold text-[#1A1A1A] block mb-1">
                      Payment Status
                    </label>
                    <select
                      id="payment-status"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className={`${INPUT_CLS} font-semibold ${paySelectCls}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="tracking" className="text-[12px] font-semibold text-[#1A1A1A] block mb-1">
                    Tracking Number
                  </label>
                  <input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. SL123456789"
                    maxLength={100}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label htmlFor="admin-notes" className="text-[12px] font-semibold text-[#1A1A1A] block mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Internal notes (not visible to customer)"
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {saving && (
                    <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  )}
                  Save Changes
                </button>
              </form>
            </Section>
          </div>

        
          <div className="space-y-5">

        
            <Section icon={FiUser} title="Customer">
              {order.user ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full bg-[#FFB700]/20 flex items-center justify-center text-[#FFB700] font-bold"
                      aria-hidden="true"
                    >
                      {order.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">{order.user.name}</p>
                      <p className="text-[12px] text-[#60717B]">{order.user.email}</p>
                    </div>
                  </div>
                  <Link to="/admin/users" className="text-[12px] text-[#FFB700] font-semibold hover:underline">
                    View Customer →
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{order.guestName || 'Guest'}</p>
                  <p className="text-[12px] text-[#60717B]">{order.guestEmail}</p>
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                    Guest Order
                  </span>
                </div>
              )}
            </Section>

           
            <Section icon={FiMapPin} title="Shipping Address">
              <address className="text-[13px] space-y-0.5 not-italic">
                <p className="font-semibold text-[#1A1A1A]">{order.shippingAddress?.fullName}</p>
                <p className="text-[#60717B]">{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p className="text-[#60717B]">{order.shippingAddress.addressLine2}</p>
                )}
                <p className="text-[#60717B]">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                </p>
                <p className="text-[#60717B]">{order.shippingAddress?.country}</p>
                {order.shippingAddress?.phone && (
                  <p className="text-[#60717B] mt-1">{order.shippingAddress.phone}</p>
                )}
              </address>
            </Section>

         
            <Section icon={FiCreditCard} title="Payment">
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#60717B]">Method</span>
                  <span className="font-semibold text-[#1A1A1A] uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#60717B]">Status</span>
                  <span className={`font-semibold capitalize ${paymentColor}`}>{order.paymentStatus}</span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-[#60717B]">Transaction ID</span>
                    <span className="font-semibold text-[#1A1A1A] font-mono text-[11px]">{order.paymentId}</span>
                  </div>
                )}
                {order.coupon && (
                  <div className="flex justify-between">
                    <span className="text-[#60717B]">Coupon</span>
                    <span className="font-semibold text-green-600">{order.coupon}</span>
                  </div>
                )}
                {order.loyaltyPointsUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#60717B]">Loyalty Points Used</span>
                    <span className="font-semibold text-amber-600">{order.loyaltyPointsUsed} pts</span>
                  </div>
                )}
                {order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                  <div
                    className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-[12px] text-amber-700"
                    role="note"
                  >
                    COD — mark as <strong>Paid</strong> once cash is collected on delivery.
                  </div>
                )}
              </div>
            </Section>

            <Section icon={FiTruck} title="Shipping">
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#60717B]">Method</span>
                  <span className="font-semibold text-[#1A1A1A] capitalize">{order.shippingMethod}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-[#60717B]">Tracking</span>
                    <span className="font-semibold text-[#1A1A1A] font-mono text-[12px]">{order.trackingNumber}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-[#60717B]">Delivered</span>
                    <span className="font-semibold text-green-600">
                      {new Date(order.deliveredAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}
              </div>
            </Section>

          
            {order.notes && (
              <Section icon={FiClipboard} title="Customer Notes">
                <p className="text-[13px] text-[#60717B] italic">"{order.notes}"</p>
              </Section>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}