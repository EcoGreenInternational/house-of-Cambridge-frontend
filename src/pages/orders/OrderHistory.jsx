import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../../redux/slices/orderSlice';
import ProfileLayout from '../../components/profile/ProfileLayout';
import { FiPackage, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../redux/api/axiosInstance';

const PAGE_SIZE = 8;
const MAX_SEARCH_LEN = 60;

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'];

const STATUS_STYLES = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100   text-blue-700',
  processing:       'bg-purple-100 text-purple-700',
  shipped:          'bg-indigo-100 text-indigo-700',
  delivered:        'bg-green-100  text-green-700',
  cancelled:        'bg-red-100    text-red-700',
  returned:         'bg-orange-100 text-orange-700',
  return_requested: 'bg-amber-100  text-amber-700',
};

const TABS = ['All', 'Active', 'Delivered', 'Returns', 'Cancelled'];

function sanitizeSearch(value) {
  return value.replace(/[<>"'`]/g, '').slice(0, MAX_SEARCH_LEN);
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function OrderHistory() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { orders, loading, error } = useSelector((s) => s.orders);

  const [tab,      setTab]      = useState('All');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSearchChange = useCallback((e) => {
    setSearch(sanitizeSearch(e.target.value));
    setPage(1);
  }, []);

  const handleTabChange = useCallback((t) => {
    setTab(t);
    setPage(1);
  }, []);

  
  const handleCancel = useCallback(async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'cancelled' });
      toast.success('Order cancelled');
      dispatch(fetchMyOrders());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order');
    } finally {
      setCancelling(null);
    }
  }, [dispatch]);

  
  const handleReorder = useCallback(async (order) => {
    try {
      for (const item of order.items || []) {
        await api.post('/cart', {
          productId: item.product?._id || item.product,
          quantity:  item.quantity,
        });
      }
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch {
      toast.error('Could not add items to cart');
    }
  }, [navigate]);

 
  const filtered = orders.filter((o) => {
    const matchesTab =
      tab === 'All' ||
      (tab === 'Active'     && ACTIVE_STATUSES.includes(o.orderStatus)) ||
      (tab === 'Delivered'  && o.orderStatus === 'delivered') ||
      (tab === 'Returns'    && ['returned', 'return_requested'].includes(o.orderStatus)) ||
      (tab === 'Cancelled'  && o.orderStatus === 'cancelled');

    const matchesSearch =
      !search ||
      (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o._id || '').toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCounts = {
    All:       orders.length,
    Active:    orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)).length,
    Delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
    Returns:   orders.filter((o) => ['returned', 'return_requested'].includes(o.orderStatus)).length,
    Cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
  };

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const STATS = [
    { label: 'Total Orders',  value: orders.length },
    { label: 'Active Orders', value: tabCounts.Active },
    { label: 'Delivered',     value: tabCounts.Delivered },
    { label: 'Total Spent',   value: `Rs. ${totalSpent.toLocaleString()}` },
  ];


  function getActions(o) {
    const orderId      = o._id;
    const isBeingCancelled = cancelling === orderId;

    const btnBase = 'text-[11px] font-semibold px-2 py-1 rounded transition-colors';

    const trackBtn = (
      <Link
        key="track"
        to={`/track-order/${orderId}`}
        className={`${btnBase} text-[#FFB700] border border-[#FFB700] hover:bg-amber-50`}
      >
        Track
      </Link>
    );

    const viewBtn = (
      <Link
        key="view"
        to={`/orders/${orderId}`}
        className={`${btnBase} text-[#60717B] border border-[#E9E9E9] hover:border-[#FFB700]`}
      >
        View
      </Link>
    );

    const cancelBtn = (
      <button
        key="cancel"
        type="button"
        disabled={isBeingCancelled}
        onClick={() => handleCancel(orderId)}
        className={`${btnBase} text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50`}
      >
        {isBeingCancelled ? 'Cancelling…' : 'Cancel'}
      </button>
    );

    const returnBtn = (
      <Link
        key="return"
        to={`/orders/${orderId}/return`}
        className={`${btnBase} text-[#60717B] border border-[#E9E9E9] hover:border-[#C5C5C5]`}
      >
        Return
      </Link>
    );

    const reorderBtn = (
      <button
        key="reorder"
        type="button"
        onClick={() => handleReorder(o)}
        className={`${btnBase} text-[#60717B] border border-[#E9E9E9] hover:border-[#C5C5C5]`}
      >
        Re-order
      </button>
    );

    const returnStatusBtn = (
      <Link
        key="return-status"
        to={`/return-status/${orderId}`}
        className={`${btnBase} text-amber-600 border border-amber-200 hover:bg-amber-50`}
      >
        Return Status
      </Link>
    );

    if (['pending', 'confirmed', 'processing'].includes(o.orderStatus)) {
      return [viewBtn, trackBtn, cancelBtn];
    }
    if (o.orderStatus === 'shipped') {
      return [viewBtn, trackBtn];
    }
    if (o.orderStatus === 'delivered') {
      return [viewBtn, returnBtn, reorderBtn];
    }
    if (o.orderStatus === 'return_requested') {
      return [viewBtn, returnStatusBtn];
    }
    if (o.orderStatus === 'returned') {
      return [viewBtn, reorderBtn];
    }
    if (o.orderStatus === 'cancelled') {
      return [viewBtn, reorderBtn];
    }
    return [viewBtn];
  }

  if (loading && orders.length === 0) {
    return (
      <ProfileLayout>
        <div className="py-12 text-center text-[#60717B]">Loading your orders...</div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
     
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#E9E9E9] rounded-[10px] px-4 py-4 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-[22px] font-black text-[#1A1A1A] leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

    
      <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
       
        <div className="flex border-b border-[#F0F0F0] overflow-x-auto" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              role="tab"
              aria-selected={tab === t}
              className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-3 text-[12px] font-bold border-b-2 transition-colors ${
                tab === t
                  ? 'border-[#FFB700] text-[#1A1A1A]'
                  : 'border-transparent text-[#60717B] hover:text-[#1A1A1A]'
              }`}
            >
              {t}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t ? 'bg-[#FFB700] text-black' : 'bg-[#F0F0F0] text-[#60717B]'
              }`}>
                {tabCounts[t]}
              </span>
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-b border-[#F0F0F0] flex items-center gap-3">
          <div className="relative flex-1 max-w-[280px]">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C5C5C5]" />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by order number..."
              maxLength={MAX_SEARCH_LEN}
              className="w-full pl-8 pr-3 py-2 border border-[#E9E9E9] rounded-[6px] text-[12px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]"
            />
          </div>
          <p className="text-[11px] text-[#60717B] ml-auto">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

       
        {paginated.length === 0 ? (
          <div className="py-14 text-center">
            <FiPackage size={28} className="mx-auto mb-2 text-[#C5C5C5]" />
            <p className="text-[13px] text-[#60717B]">No orders in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                  {['Order #', 'Date', 'Items', 'Total', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[11px] font-bold text-[#60717B] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {paginated.map((o) => (
                  <tr key={o._id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${o._id}`}
                        className="text-[12px] font-bold text-[#FFB700] hover:underline whitespace-nowrap"
                      >
                        {o.orderNumber || `#${o._id.slice(-8).toUpperCase()}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#60717B] whitespace-nowrap">
                      <time dateTime={o.createdAt}>{fmtDate(o.createdAt)}</time>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#60717B]">
                      <div className="flex items-center gap-1">
                        {(o.items || []).slice(0, 2).map((item, i) => (
                          <img
                            key={i}
                            src={item.image || 'https://placehold.co/32?text=P'}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded-[4px] border border-[#E9E9E9]"
                          />
                        ))}
                        {(o.items?.length || 0) > 2 && (
                          <span className="text-[10px] text-[#60717B]">+{o.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-[#1A1A1A] whitespace-nowrap">
                      Rs. {(Number(o.total) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize whitespace-nowrap ${
                        STATUS_STYLES[o.orderStatus] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {(o.orderStatus || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getActions(o)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

    
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-[#F0F0F0] flex items-center justify-between">
            <p className="text-[11px] text-[#60717B]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 border border-[#E9E9E9] rounded-[4px] flex items-center justify-center disabled:opacity-40"
              >
                <FiChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 border rounded-[4px] text-[11px] font-bold ${
                    n === page ? 'bg-[#FFB700] text-black border-[#FFB700]' : 'border-[#E9E9E9] text-[#60717B]'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 border border-[#E9E9E9] rounded-[4px] flex items-center justify-center disabled:opacity-40"
              >
                <FiChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}