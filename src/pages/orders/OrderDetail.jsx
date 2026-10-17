import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../../redux/slices/orderSlice';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageSpinner } from '../../components/ui/Spinner';
import { FiArrowLeft, FiCreditCard, FiDownload, FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import { downloadInvoice } from '../../utils/invoiceGenerator';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
  return_requested: 'bg-amber-100 text-amber-700',
};

function formatDate(value) {
  return new Date(value || Date.now()).toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function money(value) {
  return `Rs. ${(Number(value) || 0).toLocaleString()}`;
}

function DetailSection({ icon: Icon, title, children }) {
  return (
    <section className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-3 mb-4">
        <Icon size={16} className="text-[#FFB700]" aria-hidden="true" />
        <h2 className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { order, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (orderId) dispatch(fetchOrder(orderId));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleDownloadInvoice = async () => {
    try {
      await downloadInvoice(order, user?.name || user?.fullName, user?.email);
    } catch {
      toast.error('Could not download the invoice');
    }
  };

  if (loading && !order) return <Layout><PageSpinner /></Layout>;

  if (!order) {
    return (
      <Layout>
        <div className="max-w-[1100px] mx-auto px-4 py-14 text-center">
          <FiPackage size={38} className="mx-auto mb-3 text-[#C5C5C5]" aria-hidden="true" />
          <h1 className="text-[18px] font-black text-[#1A1A1A]">Order not found</h1>
          <p className="text-[13px] text-[#60717B] mt-2 mb-5">
            We could not find this order or it is no longer available.
          </p>
          <Link to="/orders" className="inline-flex items-center gap-2 bg-[#FFB700] text-black px-4 py-2.5 rounded-[6px] text-[13px] font-bold">
            <FiArrowLeft size={14} /> Back to Orders
          </Link>
        </div>
      </Layout>
    );
  }

  const address = order.shippingAddress || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const status = order.orderStatus || 'pending';
  const paymentMethod = order.paymentMethod || order.paymentType || 'Not specified';
  const subtotal = Number(order.subtotal) || items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  const shippingCost = Number(order.shippingCost) || 0;
  const discount = Number(order.discount) || 0;
  const tax = Number(order.tax) || 0;

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'My Orders', href: '/orders' }, { label: 'Order Details' }]} />
      </div>

      <main className="max-w-[1100px] mx-auto px-4 pb-14">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <button type="button" onClick={() => navigate('/orders')} className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#60717B] hover:text-[#1A1A1A] mb-3">
              <FiArrowLeft size={14} /> Back to Orders
            </button>
            <h1 className="text-[22px] font-black text-[#1A1A1A]">
              {order.orderNumber || `Order #${order._id.slice(-8).toUpperCase()}`}
            </h1>
            <p className="text-[12px] text-[#60717B] mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <span className={`capitalize text-[12px] font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <DetailSection icon={FiPackage} title={`Items in this order (${items.length})`}>
              <div className="divide-y divide-[#F0F0F0]">
                {items.map((item, index) => (
                  <div key={`${item.product?._id || item.product || item.name}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {item.image
                      ? <img src={item.image} alt={item.name || 'Product'} className="w-16 h-16 object-cover rounded-[8px] border border-[#E9E9E9] flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-[8px] bg-[#F5F5F5] flex items-center justify-center flex-shrink-0"><FiPackage className="text-[#C5C5C5]" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1A1A1A]">{item.name || 'Product'}</p>
                      {item.variant && <p className="text-[11px] text-[#60717B] mt-0.5">{item.variant}</p>}
                      <p className="text-[12px] text-[#60717B] mt-1">Qty: {item.quantity || 0}</p>
                    </div>
                    <p className="text-[13px] font-bold text-[#1A1A1A]">{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</p>
                  </div>
                ))}
              </div>
            </DetailSection>

            <DetailSection icon={FiMapPin} title="Delivery Address">
              <div className="text-[13px] text-[#60717B] leading-6">
                <p className="font-bold text-[#1A1A1A]">{address.fullName || user?.name || 'Customer'}</p>
                {address.phone && <p>Phone: {address.phone}</p>}
                {address.addressLine1 && <p>{address.addressLine1}</p>}
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>{[address.city, address.postalCode].filter(Boolean).join(', ')}</p>
                {address.country && <p>{address.country}</p>}
              </div>
            </DetailSection>

            <DetailSection icon={FiTruck} title="Delivery Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
                <div><p className="text-[#60717B] mb-1">Delivery method</p><p className="font-semibold text-[#1A1A1A] capitalize">{(order.shippingMethod || 'Standard Delivery').replace(/_/g, ' ')}</p></div>
                <div><p className="text-[#60717B] mb-1">Tracking number</p><p className="font-semibold text-[#1A1A1A]">{order.trackingNumber || 'Not available yet'}</p></div>
              </div>
            </DetailSection>
          </div>

          <div className="space-y-5">
            <DetailSection icon={FiCreditCard} title="Payment">
              <p className="text-[13px] font-semibold text-[#1A1A1A] capitalize">{String(paymentMethod).replace(/_/g, ' ')}</p>
              <p className={`text-[12px] mt-1 capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-[#60717B]'}`}>
                {order.paymentStatus || 'Payment pending'}
              </p>
            </DetailSection>

            <section className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
              <h2 className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wider mb-4">Order Summary</h2>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between text-[#60717B]"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{money(discount)}</span></div>}
                <div className="flex justify-between text-[#60717B]"><span>Shipping</span><span className={shippingCost === 0 ? 'text-green-600' : ''}>{shippingCost ? money(shippingCost) : 'Free'}</span></div>
                {tax > 0 && <div className="flex justify-between text-[#60717B]"><span>Tax</span><span>{money(tax)}</span></div>}
                <div className="flex justify-between border-t border-[#F0F0F0] pt-3 mt-3 text-[15px] font-black text-[#1A1A1A]"><span>Total</span><span>{money(order.total)}</span></div>
              </div>
            </section>

            <div className="flex flex-col gap-2">
              <button type="button" onClick={handleDownloadInvoice} className="w-full inline-flex justify-center items-center gap-2 border border-[#C5C5C5] rounded-[6px] px-4 py-2.5 text-[12px] font-bold text-[#1A1A1A] hover:border-[#FFB700]">
                <FiDownload size={14} /> Download Invoice
              </button>
              {status !== 'cancelled' && status !== 'returned' && (
                <Link to={`/track-order/${order._id}`} className="w-full inline-flex justify-center items-center gap-2 bg-[#FFB700] rounded-[6px] px-4 py-2.5 text-[12px] font-bold text-black hover:bg-amber-500">
                  <FiTruck size={14} /> Track Order
                </Link>
              )}
              {status === 'delivered' && (
                <Link to={`/orders/${order._id}/return`} className="w-full text-center border border-[#E9E9E9] rounded-[6px] px-4 py-2.5 text-[12px] font-semibold text-[#60717B] hover:border-[#FFB700]">
                  Request Return
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
