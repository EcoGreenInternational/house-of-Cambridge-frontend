import { useEffect, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, fetchWishlist } from '../../redux/slices/userSlice';
import { fetchMyOrders } from '../../redux/slices/orderSlice';
import ProfileLayout from '../../components/profile/ProfileLayout';
import { FiPackage, FiChevronLeft, FiChevronRight, FiShoppingCart, FiHeart } from 'react-icons/fi';

const MAX_SEARCH_LEN     = 60;
const RECENT_ORDER_COUNT = 5;

const STATUS_STYLES = {
  pending:          'bg-[#2563EB] text-white',
  confirmed:        'bg-[#2563EB] text-white',
  processing:       'bg-[#2563EB] text-white',
  shipped:          'bg-[#16A34A] text-white',
  delivered:        'bg-[#22C55E] text-white',
  cancelled:        'bg-[#EF4444] text-white',
  returned:         'bg-[#F97316] text-white',
  return_requested: 'bg-[#F59E0B] text-white',
};

function sanitizeSearch(value) {
  return value.replace(/[<>"`]/g, '').slice(0, MAX_SEARCH_LEN);
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ProfileDashboard() {
  const dispatch = useDispatch();
  const { profile, wishlist } = useSelector((s) => s.user);
  const { user }              = useSelector((s) => s.auth);
  const { orders }            = useSelector((s) => s.orders);
  const [search, setSearch]   = useState('');
  const wishlistRef           = useRef(null);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchMyOrders());
    dispatch(fetchWishlist());
  }, [dispatch]);

  const u            = profile || user;
  const orderList    = orders  || [];
  const wishlistList = wishlist || [];

  const activeOrders  = orderList.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.orderStatus));
  const totalSpent    = orderList.reduce((s, o) => s + (o.total || 0), 0);
  const loyaltyPoints = u?.loyaltyPoints || 842;

  const handleSearchChange = useCallback((e) => {
    setSearch(sanitizeSearch(e.target.value));
  }, []);

 
  const filteredOrders = orderList.filter(
    (o) =>
      !search ||
      (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o._id || '').toLowerCase().includes(search.toLowerCase()),
  );

  const scrollWishlist = useCallback((dir) => {
    wishlistRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  }, []);

  const defaultAddress = (u?.addresses || [])[0];

  return (
    <ProfileLayout>
      <div className="w-full text-left">
        {/* Header Title */}
        <div className="mb-4">
          <h1 className="text-[20px] font-black text-[#1A1A1A] leading-tight">
            Dashboard
          </h1>
          <p className="text-[12px] text-[#6B7280]">
            Welcome to your Profile Dashboard
          </p>
        </div>

        {/* 1. PASTEL STATS CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* Total Orders */}
          <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-[10px] p-4 text-center shadow-sm">
            <p className="text-[28px] sm:text-[32px] font-black text-[#1A1A1A] leading-tight">
              {String(orderList.length || 5).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">Total Orders</p>
          </div>

          {/* Active Orders */}
          <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-[10px] p-4 text-center shadow-sm">
            <p className="text-[28px] sm:text-[32px] font-black text-[#1A1A1A] leading-tight">
              {String(activeOrders.length || 1).padStart(2, '0')}
            </p>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">Active Orders</p>
          </div>

          {/* Loyalty Points */}
          <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-[10px] p-4 text-center shadow-sm">
            <p className="text-[28px] sm:text-[32px] font-black text-[#1A1A1A] leading-tight">
              {loyaltyPoints}
            </p>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">Loyalty Points</p>
          </div>

          {/* Total Spent */}
          <div className="bg-[#FDF2F8] border border-[#FCE7F3] rounded-[10px] p-4 text-center shadow-sm">
            <p className="text-[22px] sm:text-[26px] font-black text-[#1A1A1A] leading-tight">
              Rs {totalSpent > 0 ? totalSpent.toLocaleString() : '87,400'}
            </p>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">Total Spent</p>
          </div>
        </div>

        {/* 2. RECENT ORDERS SECTION */}
        <section className="mb-8" aria-labelledby="recent-orders-heading">
          <h2 id="recent-orders-heading" className="text-[14px] font-bold text-[#1A1A1A] mb-2.5">
            Recent Orders
          </h2>

          {/* Search Input Box */}
          <div className="mb-3">
            <input
              id="order-search"
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by order ID or product name..."
              maxLength={MAX_SEARCH_LEN}
              className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-[4px] text-[12px] text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#FFB700]"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center bg-white border border-[#E5E7EB] rounded-[6px]">
              <FiPackage size={26} className="mx-auto mb-1 text-[#9CA3AF]" aria-hidden="true" />
              <p className="text-[12px] text-[#6B7280]">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-[4px]">
              <table className="w-full min-w-[340px] text-[11px]">
                <thead>
                  <tr className="bg-[#F3F4F6] text-[#4B5563] border-b border-[#E5E7EB] font-bold">
                    <th className="px-2.5 py-2 text-left">Order ID</th>
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-left">Items</th>
                    <th className="px-2 py-2 text-left">Total</th>
                    <th className="px-2.5 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {filteredOrders.slice(0, RECENT_ORDER_COUNT).map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2.5 py-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                        <Link to={`/orders/${o._id}`} className="hover:text-[#FFB700]">
                          {o.orderNumber || `#DFC-2026-${o._id.slice(-5).toUpperCase()}`}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-[#4B5563] whitespace-nowrap">
                        {fmtDate(o.createdAt)}
                      </td>
                      <td className="px-2 py-2.5 text-[#4B5563] whitespace-nowrap">
                        {o.items?.length || 1} {o.items?.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-2 py-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                        Rs {o.total?.toLocaleString() || '15,725'}
                      </td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] inline-block ${
                            STATUS_STYLES[o.orderStatus] || 'bg-[#22C55E] text-white'
                          }`}
                        >
                          {o.orderStatus === 'processing' || o.orderStatus === 'pending'
                            ? 'Processing'
                            : 'Delivered'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. ACCOUNT SUMMARY */}
        <section className="mb-8" aria-labelledby="account-summary-heading">
          <h2 id="account-summary-heading" className="text-[14px] font-bold text-[#1A1A1A] mb-3">
            Account Summary
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-[11.5px]">
            <div>
              <p className="text-[#9CA3AF] text-[11px] mb-0.5 font-medium">Name</p>
              <p className="font-semibold text-[#1A1A1A]">{u?.name || 'Amara Perera'}</p>
            </div>
            <div>
              <p className="text-[#9CA3AF] text-[11px] mb-0.5 font-medium">Email</p>
              <p className="font-semibold text-[#1A1A1A] truncate">{u?.email || 'amaraperera@gmail.com'}</p>
            </div>
            <div>
              <p className="text-[#9CA3AF] text-[11px] mb-0.5 font-medium">Delivery Address</p>
              <p className="font-medium text-[#1A1A1A] leading-snug">
                {defaultAddress
                  ? `${defaultAddress.addressLine1}, ${defaultAddress.city}`
                  : '42/B, Galle Road Colombo 03, 00300 Sri Lanka.'}
              </p>
            </div>
            <div>
              <p className="text-[#9CA3AF] text-[11px] mb-0.5 font-medium">Phone</p>
              <p className="font-semibold text-[#1A1A1A]">{u?.phone || '+94 77 2325 758'}</p>
              <div className="mt-2.5">
                <p className="text-[#9CA3AF] text-[11px] mb-0.5 font-medium">Payment</p>
                <p className="font-semibold text-[#1A1A1A]">VISA **** 4512</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MY WISHLIST */}
        <section className="mb-8" aria-labelledby="wishlist-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="wishlist-heading" className="text-[14px] font-bold text-[#1A1A1A]">
              My Wishlist
            </h2>
          </div>

          <div className="relative flex items-center">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => scrollWishlist(-1)}
              aria-label="Scroll wishlist left"
              className="absolute -left-2 z-10 w-7 h-7 bg-white border border-[#D1D5DB] rounded-full flex items-center justify-center shadow-md text-[#1A1A1A]"
            >
              <FiChevronLeft size={16} />
            </button>

            {/* Product Cards Carousel */}
            <div
              ref={wishlistRef}
              className="w-full flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth scrollbar-hide"
            >
              {wishlistList.length === 0 ? (
                /* Static Figma Fallback items if database is empty */
                [
                  { id: 1, title: 'Tresemme Revitalise Conditioner 680ML - Germany', price: '3,300', img: '/images/wishlist-1.png' },
                  { id: 2, title: "Johnson's Baby Lotion 500ML - UK", price: '3,600', img: '/images/wishlist-2.png' },
                  { id: 3, title: 'Pure Clear Honey - China', price: '2,000', img: '/images/wishlist-3.png' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-[140px] bg-white border border-[#E5E7EB] rounded-[10px] p-2.5 flex flex-col justify-between shadow-sm relative"
                  >
                    <button className="absolute top-2 right-2 text-[#FFB700]" aria-label="Favorite">
                      <FiHeart size={14} className="fill-[#FFB700]" />
                    </button>
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-[100px] object-contain my-1"
                    />
                    <div>
                      <p className="text-[10px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight mb-1">
                        {item.title}
                      </p>
                      <div className="flex text-[#FFB700] text-[8px] mb-1">
                        {'★'.repeat(5)}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[12px] font-black text-[#1A1A1A]">
                          Rs. {item.price}
                        </p>
                        <button className="w-5 h-5 bg-[#FFB700] rounded-full flex items-center justify-center text-black">
                          <FiShoppingCart size={10} />
                        </button>
                      </div>
                      <button className="w-full bg-[#FFB700] hover:bg-amber-500 text-black text-[11px] font-bold py-1 rounded-[4px] transition-colors">
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                wishlistList.map((item) => {
                  const p = item.product || item;
                  if (!p._id) return null;
                  return (
                    <div
                      key={p._id}
                      className="flex-shrink-0 w-[140px] bg-white border border-[#E5E7EB] rounded-[10px] p-2.5 flex flex-col justify-between shadow-sm relative"
                    >
                      <button className="absolute top-2 right-2 text-[#FFB700]" aria-label="Favorite">
                        <FiHeart size={14} className="fill-[#FFB700]" />
                      </button>
                      <img
                        src={p.images?.[0]?.url || 'https://placehold.co/120?text=Product'}
                        alt={p.name}
                        className="w-full h-[100px] object-contain my-1"
                      />
                      <div>
                        <p className="text-[10px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight mb-1">
                          {p.name}
                        </p>
                        <div className="flex text-[#FFB700] text-[8px] mb-1">
                          {'★'.repeat(5)}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[12px] font-black text-[#1A1A1A]">
                            Rs. {p.price?.toLocaleString()}
                          </p>
                          <button className="w-5 h-5 bg-[#FFB700] rounded-full flex items-center justify-center text-black">
                            <FiShoppingCart size={10} />
                          </button>
                        </div>
                        <Link
                          to={`/product/${p._id}`}
                          className="block text-center w-full bg-[#FFB700] hover:bg-amber-500 text-black text-[11px] font-bold py-1 rounded-[4px] transition-colors"
                        >
                          Buy Now
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => scrollWishlist(1)}
              aria-label="Scroll wishlist right"
              className="absolute -right-2 z-10 w-7 h-7 bg-white border border-[#D1D5DB] rounded-full flex items-center justify-center shadow-md text-[#1A1A1A]"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </section>

      </div>
    </ProfileLayout>
  );
}