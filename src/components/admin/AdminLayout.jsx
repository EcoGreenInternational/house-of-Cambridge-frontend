import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice.js';
import {
  FiGrid, FiPackage, FiUsers, FiTag, FiPercent,
  FiMessageSquare, FiRepeat, FiLogOut, FiBell, FiMenu,
  FiShoppingBag, FiZap, FiAward, FiFileText,
} from 'react-icons/fi';

const NAV = [
  { icon: FiGrid,          label: 'Dashboard',   href: '/admin' },
  { icon: FiPackage,       label: 'Orders',      href: '/admin/orders' },
  { icon: FiShoppingBag,   label: 'Products',    href: '/admin/products' },
  { icon: FiZap,           label: 'Flash Sales', href: '/admin/flash-sales' },
  { icon: FiUsers,         label: 'Users',        href: '/admin/users' },
  { icon: FiTag,           label: 'Categories',  href: '/admin/categories' },
  { icon: FiAward,         label: 'Brands',       href: '/admin/brands' },
  { icon: FiPercent,       label: 'Coupons',      href: '/admin/coupons' },
  { icon: FiMessageSquare, label: 'Reviews',      href: '/admin/reviews' },
  { icon: FiRepeat,        label: 'Returns',      href: '/admin/returns' },
  { icon: FiBell,          label: 'Broadcast',   href: '/admin/broadcast' },
  { icon: FiFileText,      label: 'Invoices',    href: '/admin/invoices' }, 
];

function isNavActive(href, pathname) {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

function SidebarContent({ user, onNav, onLogout }) {
  const location = useLocation();

  return (
    <aside className="w-[240px] min-h-screen bg-[#1A1A1A] flex flex-col flex-shrink-0">
      <div className="px-6 py-5 border-b border-white/10">
        <Link to="/admin" className="flex items-center gap-2" onClick={onNav}>
          <span className="text-[#FFB700] font-black text-[18px] leading-tight">HOC</span>
          <span className="text-white/70 text-[12px] font-medium uppercase tracking-widest">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Admin navigation">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = isNavActive(href, location.pathname);
          return (
            <Link
              key={href}
              to={href}
              onClick={onNav}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-6 py-3 text-[13px] font-medium transition-all ${
                active
                  ? 'bg-[#FFB700]/15 text-[#FFB700] border-r-[3px] border-[#FFB700]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#FFB700] flex items-center justify-center text-[#1A1A1A] text-[13px] font-bold" aria-hidden="true">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold truncate">{user?.name}</p>
            <p className="text-white/40 text-[11px] capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-white/50 hover:text-white text-[13px] transition-colors w-full"
        >
          <FiLogOut size={14} aria-hidden="true" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { user }  = useSelector((s) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const currentLabel = NAV.find((n) => isNavActive(n.href, location.pathname))?.label ?? 'Admin Panel';

  return (
    <div className="flex min-h-screen bg-[#F4F5F7]">
      <div className="hidden lg:flex">
        <SidebarContent user={user} onNav={() => {}} onLogout={handleLogout} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="relative z-10">
            <SidebarContent user={user} onNav={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E9E9E9] px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-[#60717B] hover:text-[#1A1A1A]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <FiMenu size={22} />
          </button>
          <h1 className="text-[16px] font-bold text-[#1A1A1A] flex-1">{currentLabel}</h1>
          <Link to="/" className="text-[13px] text-[#60717B] hover:text-[#FFB700] transition-colors">
            ← View Store
          </Link>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}