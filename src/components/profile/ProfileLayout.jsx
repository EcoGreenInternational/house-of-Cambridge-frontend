import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice.js';
import Layout from '../common/Layout.jsx';
import { Icon } from '@iconify/react';
import { FiMenu, FiX } from 'react-icons/fi';

const NAV = [
  { icon: 'fluent-emoji-flat:bar-chart', label: 'Dashboard', href: '/profile' },
  { icon: 'fluent-emoji-flat:package', label: 'Order History', href: '/orders' },
  { icon: 'fluent-emoji-flat:white-heart', label: 'Wishlist', href: '/wishlist' },
  { icon: 'fluent-emoji-flat:round-pushpin', label: 'Saved Addresses', href: '/profile/addresses' },
  { icon: 'fluent-emoji-flat:credit-card', label: 'Payment Methods', href: '/profile/payment' },
  { icon: 'fluent-emoji-flat:wrapped-gift', label: 'Loyalty Points', href: '/profile/loyalty' },
  { icon: 'fluent-emoji-flat:bell', label: 'Notifications', href: '/profile/notifications' },
  { icon: 'fluent-emoji-flat:bust-in-silhouette', label: 'Profile Settings', href: '/profile/edit' },
];

export default function ProfileLayout({ children }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile } = useSelector((s) => s.user);
  const { user } = useSelector((s) => s.auth);
  const u = profile ?? user;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMobileNavOpen(false);
  };

  const activeItem = NAV.find((n) => n.href === location.pathname) || { label: 'Dashboard' };

  const SidebarContent = ({ onNavigate }) => (
    <div className="bg-white rounded-[10px] overflow-hidden">
      {/* User Header */}
      <div className="px-5 pt-5 pb-4 text-center border-b border-[#F0F0F0]">
        {u?.avatar?.url ? (
          <img
            src={u.avatar.url}
            alt={u?.name ?? 'User avatar'}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-2.5 border-2 border-[#FFB700]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#D1D5DB] flex items-center justify-center mx-auto mb-2.5 text-[#4B5563]">
            <Icon icon="mdi:account" width={32} />
          </div>
        )}
        <p className="text-[14px] font-black text-[#1A1A1A] leading-tight">{u?.name ?? 'Amara Perera'}</p>
        <p className="text-[11px] text-[#60717B] mt-0.5 truncate">{u?.email ?? 'amaraperera@gmail.com'}</p>
        {/* <span className="inline-block mt-2 bg-[#F3E8D6] text-[#7A5826] text-[10px] font-bold px-3 py-0.5 rounded-[4px] border border-[#E8D1B5]">
          ⭐ Bronze Member
        </span> */}
      </div>

      {/* Navigation List */}
      <nav className="py-1">
        {NAV.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-5 py-2.5 text-[13px] font-semibold transition-colors border-l-[3px] ${
                active
                  ? 'bg-[#EDEDED] text-[#1A1A1A] border-[#1A1A1A]'
                  : 'border-transparent text-[#4B5563] hover:bg-gray-50 hover:text-[#1A1A1A]'
              }`}
            >
              <Icon icon={item.icon} width={18} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Sign Out */}
        <div className="border-t border-[#F0F0F0] mt-1 pt-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-[12px] font-semibold text-[#4B5563] hover:bg-gray-50 transition-colors"
          >
            <Icon icon="fluent-emoji-flat:left-arrow" width={16} /> Sign Out
          </button>
        </div>
      </nav>
    </div>
  );

  return (
    <Layout>
      <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-4 md:px-6 pb-12">

        {/* Dynamic Breadcrumb */}
        <div className="pt-2 pb-1 text-left">
          <p className="text-[11px] text-[#6B7280]">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-1">/</span>
            <Link to="/profile" className="hover:underline">Profile</Link>
            {activeItem.href !== '/profile' && (
              <>
                <span className="mx-1">/</span>
                <span className="text-[#1A1A1A] font-semibold">{activeItem.label}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex gap-4 lg:gap-6 items-start mt-1">

          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block w-[230px] flex-shrink-0 sticky top-4" aria-label="Profile navigation">
            <div className="border border-[#E9E9E9] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <SidebarContent />
            </div>
          </aside>

          {/* Mobile Drawer  */}
          {mobileNavOpen && (
            <div className="lg:hidden fixed inset-x-0 top-[90px] bottom-0 z-40">
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 bg-black/40"
              />

              <aside
                className="absolute left-0 top-0 bottom-0 w-[260px] max-w-[80vw] bg-white shadow-2xl overflow-y-auto border-r border-[#E5E7EB] z-10"
                aria-label="Profile navigation"
              >
                <div className="flex justify-end px-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Close profile menu"
                    className="w-7 h-7 flex items-center justify-center text-[#60717B] hover:text-black"
                  >
                    <FiX size={18} aria-hidden="true" />
                  </button>
                </div>
                <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
              </aside>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="lg:hidden flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open profile menu"
                className="p-1.5 border border-[#E9E9E9] rounded-[6px] text-[#1A1A1A] hover:bg-gray-50 flex items-center gap-1.5"
              >
                <FiMenu size={16} />
                <span className="text-[12px] font-bold">Dashboard</span>
              </button>
            </div>

            {children}
          </div>

        </div>
      </div>
    </Layout>
  );
}