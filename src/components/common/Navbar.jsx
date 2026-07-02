import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import { logout } from "../../redux/slices/authSlice.js";
import { fetchCategories } from "../../redux/slices/productSlice.js";
import { fetchWishlist } from "../../redux/slices/userSlice.js";
import { buildCategoryTree } from "../../utils/categoryTree.js";

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function AllCategoriesDropdown({ tree }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white text-black text-[14px] font-bold px-5 py-1.5 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon icon="mdi:menu" width={16} />
        All Categories
        <Icon
          icon="mdi:chevron-down"
          width={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full w-[180px] bg-white border border-gray-200 rounded shadow-lg py-1 z-50 max-h-[70vh] overflow-y-auto">
          <Link
            to="/shop"
            className="flex items-center gap-2 px-4 py-2 text-[12px] text-black font-medium hover:bg-gray-100 border-b border-gray-100 mb-0.5"
            onClick={() => setOpen(false)}
          >
            <span>🛍️</span> All Products
          </Link>
          {tree.map((parent, idx) => (
            <div key={parent._id}>
              <Link
                to={`/shop?category=${parent._id}`}
                className="flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span>
                  {
                    [
                      "🌸",
                      "👶",
                      "🏠",
                      "💻",
                      "📱",
                      "🧴",
                      "🎮",
                      "📚",
                      "🎁",
                      "🛒",
                    ][idx % 10]
                  }
                </span>
                {parent.name}
              </Link>
              {parent.children.map((child) => (
                <Link
                  key={child._id}
                  to={`/shop?category=${child._id}`}
                  className="flex items-center gap-2 pl-9 pr-4 py-1.5 text-[11px] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBadgeDropdown({ label, tree, baseParam, loading, badgeColor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 lg:px-3 py-1 rounded-md text-white text-[11px] lg:text-[13px] font-bold transition-all hover:opacity-90 cursor-pointer"
        style={{ background: badgeColor || "#ef4444" }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <Icon
          icon="mdi:chevron-down"
          width={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded shadow-lg py-1 z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-[13px] text-gray-400">
              Loading categories…
            </div>
          )}
          {!loading && tree.length === 0 && (
            <Link
              to={`/shop?${baseParam}`}
              className="block px-4 py-2.5 text-[13px] text-[#FFB700] font-semibold hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              View All
            </Link>
          )}
          {!loading && tree.length > 0 && (
            <>
              <Link
                to={`/shop?${baseParam}`}
                className="block px-4 py-2.5 text-[13px] text-[#FFB700] font-semibold hover:bg-gray-100 border-b border-gray-100 mb-1"
                onClick={() => setOpen(false)}
              >
                View All
              </Link>
              {tree.map((parent) => (
                <div key={parent._id}>
                  <Link
                    to={`/shop?${baseParam}&category=${parent._id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-[13px] text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {parent.name}
                  </Link>
                  {parent.children.map((child) => (
                    <Link
                      key={child._id}
                      to={`/shop?${baseParam}&category=${child._id}`}
                      className="flex items-center gap-2 pl-7 pr-4 py-2 text-[12px] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-gray-400 flex-shrink-0">└</span>
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NavTextDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 text-black text-[14px] font-bold rounded-md transition-all hover:bg-white/30 cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <Icon
          icon="mdi:chevron-down"
          width={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg py-1 z-50">
          {items.map(({ label: l, to }) => (
            <Link
              key={to}
              to={to}
              className="block px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setOpen(false)}
            >
              {l}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGES_ITEMS = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "FAQ", to: "/faq" },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  const isActive = (path) => location.pathname === path;
  const { categories, categoriesLoading } = useSelector((s) => s.products);
  const { cart } = useSelector((s) => s.cart);
  const { wishlist } = useSelector((s) => s.user);

  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileExpandedCats, setMobileExpandedCats] = useState(new Set());
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  useClickOutside(userRef, () => setUserOpen(false));

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const wishlistCount = wishlist?.length ?? 0;

  const categoryTree = useMemo(
    () => buildCategoryTree(categories),
    [categories],
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [isAuthenticated, dispatch]);

  const toggleMobileCat = (id) => {
    setMobileExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) navigate(`/shop?keyword=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setUserOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-[9999] w-full">
      {/* Top bar - Black */}
      <div className="w-full bg-black px-3 sm:px-4 md:px-[52px] py-2.5 md:py-2.5">
        {/* Row 1: Logo + Search (centered) + Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Left spacer - equal to right icons width to keep search centered */}
          <div className="hidden md:flex flex-1 justify-start">
            <Link to="/" className="flex-shrink-0">
              <img
                src="/images/logo.png"
                alt="House of Cambridge"
                className="h-9 sm:h-10 md:h-[73px] w-auto object-contain"
              />
            </Link>
          </div>
          {/* Mobile logo */}
          <Link to="/" className="flex-shrink-0 md:hidden">
            <img
              src="/images/logo.png"
              alt="House of Cambridge"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Search - visible on md+ */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex max-w-[502px] w-full"
            role="search"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for Products, Categories and More"
              aria-label="Search"
              className="flex-1 bg-white text-[#1A1A1A] placeholder-gray-400 px-4 py-0 text-[14px] outline-none rounded-l h-10"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="bg-[#FFB700] w-[45px] h-10 rounded-r flex items-center justify-center hover:bg-amber-500 transition-colors"
            >
              <Icon icon="mdi:magnify" width={18} className="text-black" />
            </button>
          </form>

          {/* Desktop icons */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-9">
            <div className="flex items-center gap-6">
              <Link
                to="/cart"
                className="text-[#FFB700] hover:text-amber-400 transition-colors relative"
              >
                <Icon icon="mdi:cart" width={28} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FFB700] text-black text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                className="text-[#FFB700] hover:text-amber-400 transition-colors relative"
              >
                <Icon icon="mdi:heart" width={28} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>

            <div className="flex items-center gap-1.5 text-[#FFB700] font-black text-[15px]">
              <Icon icon="mdi:earth" width={18} />
              <span>EN / LKR</span>
            </div>

            <Link
              to={isAuthenticated ? '/profile' : '/login'}
              className="text-[#FFB700] hover:text-amber-400 transition-colors"
              aria-label="Account"
            >
              {isAuthenticated && user?.avatar?.url ? (
                <img src={user.avatar.url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-[#FFB700]" />
              ) : (
                <Icon icon="mdi:account" width={28} />
              )}
            </Link>

            <div ref={userRef} className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center justify-center bg-[#FFB700] text-black text-[14px] font-bold px-4 h-10 rounded-md hover:bg-amber-500 transition-colors whitespace-nowrap"
                  aria-expanded={userOpen}
                  aria-haspopup="true"
                >
                  <span className="max-w-[55px] truncate">{user?.name?.split(" ")[0]}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center bg-[#FFB700] text-black text-[14px] font-bold w-[114px] h-10 rounded-md hover:bg-amber-500 transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
              )}
              {userOpen && isAuthenticated && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-[#1e2130] border border-white/10 rounded shadow-xl py-1 z-50"
                  role="menu"
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-[#FFB700] hover:bg-white/5"
                    onClick={() => setUserOpen(false)}
                    role="menuitem"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-[#FFB700] hover:bg-white/5"
                    onClick={() => setUserOpen(false)}
                    role="menuitem"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-[#FFB700] hover:bg-white/5"
                    onClick={() => setUserOpen(false)}
                    role="menuitem"
                  >
                    Wishlist
                  </Link>
                  <hr className="my-1 border-white/5" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
                    role="menuitem"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger + cart/wishlist */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <Link to="/cart" className="text-[#FFB700] relative">
              <Icon icon="mdi:cart" width={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FFB700] text-black text-[8px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to="/wishlist" className="text-[#FFB700] relative">
              <Icon icon="mdi:heart" width={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              className="text-[#FFB700] ml-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <Icon icon="mdi:close" width={26} />
              ) : (
                <Icon icon="mdi:menu" width={26} />
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Search bar - mobile only */}
        <form
          onSubmit={handleSearch}
          className="flex md:hidden mt-2.5"
          role="search"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for Products, Categories and More"
            aria-label="Search"
            className="flex-1 bg-white text-[#1A1A1A] placeholder-gray-400 px-3 py-0 text-[13px] outline-none rounded-l h-9"
          />
          <button
            type="submit"
            aria-label="Submit search"
            className="bg-[#FFB700] w-[40px] h-9 rounded-r flex items-center justify-center hover:bg-amber-500 transition-colors"
          >
            <Icon icon="mdi:magnify" width={16} className="text-black" />
          </button>
        </form>
      </div>

      <nav
        className="hidden md:flex items-center h-[42px] bg-[#FFB700]" aria-label="Main navigation">
        <div className="w-full flex items-center justify-between px-3 sm:px-4 md:px-[52px]">
          <div className="flex-shrink-0">
            <AllCategoriesDropdown tree={categoryTree} />
          </div>

          <div className="flex items-center gap-15">
            <Link
              to="/"
              className={`text-[16px] font-bold whitespace-nowrap pb-0.5 transition-colors ${isActive("/") ? "text-black border-b-2 border-black" : "text-black/80 hover:text-black"}`}
            >
              Home
            </Link>

            <NavBadgeDropdown
              className="text-[16px] font-bold whitespace-nowrap"
              label="Pre-Owned UK Items"
              glowColor="#CC0000"
              tree={categoryTree}
              baseParam="preowned=true"
              loading={categoriesLoading}
              badgeColor="#CC0000"
            />
            <NavBadgeDropdown
              className="text-[16px] font-bold whitespace-nowrap"
              label="New Arrivals"
              glowColor="#008000"
              tree={categoryTree}
              baseParam="newArrival=true"
              loading={categoriesLoading}
              badgeColor="#008000"
            />

            <Link
              to="/shop"
              className={`text-[16px] font-bold whitespace-nowrap transition-colors ${isActive("/shop") ? "text-black border-b-2 border-black pb-0.5" : "text-black/80 hover:text-black"}`}
            >
              Shop
            </Link>

            <Link
              to="/about"
              className={`text-[16px] font-bold whitespace-nowrap transition-colors ${isActive("/about") ? "text-black border-b-2 border-black pb-0.5" : "text-black/80 hover:text-black"}`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`text-[16px] font-bold whitespace-nowrap transition-colors ${isActive("/contact") ? "text-black border-b-2 border-black pb-0.5" : "text-black/80 hover:text-black"}`}
            >
              Contact
            </Link>
          </div>

          <a
            href="tel:0112847846"
            className="flex items-center gap-1.5 text-black font-bold text-[16px] tracking-wide whitespace-nowrap flex-shrink-0"
          >
            <Icon icon="mdi:phone" width={16} />
            0112 847 846
          </a>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="md:hidden border-t border-white/10 bg-[#1a1a1a] py-2 max-h-[80vh] overflow-y-auto"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* Quick links */}
          <div className="px-3 pb-2 border-b border-white/5 mb-1">
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 text-[#FFB700] text-[13px] font-medium">
                  <Icon icon="mdi:account" width={16} />
                  {user?.name?.split(" ")[0] || "Account"}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 bg-[#FFB700] text-black text-[13px] font-bold px-4 py-1.5 rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon icon="mdi:account" width={15} /> Login
                </Link>
              )}
              <span className="text-white/30 text-[11px] mx-1">|</span>
              <div className="flex items-center gap-1 text-[#FFB700] text-[12px] font-bold">
                <Icon icon="mdi:earth" width={14} />
                EN / LKR
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
          >
            <Icon icon="mdi:home" width={16} className="text-[#FFB700]" /> Home
          </Link>
          <Link
            to="/shop"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
          >
            <Icon icon="mdi:store" width={16} className="text-[#FFB700]" /> Shop
          </Link>

          <div>
            <button
              onClick={() => setMobileCatOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
              aria-expanded={mobileCatOpen}
            >
              <span className="flex items-center gap-3">
                <Icon
                  icon="mdi:format-list-bulleted"
                  width={16}
                  className="text-[#FFB700]"
                />{" "}
                All Categories
              </span>
              <Icon
                icon="mdi:chevron-down"
                width={14}
                className={`text-gray-500 transition-transform ${mobileCatOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileCatOpen && (
              <div className="pb-1 bg-black/20">
                <Link
                  to="/shop"
                  className="flex items-center gap-3 py-2 pl-9 pr-4 text-[13px] text-[#FFB700] font-medium hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon icon="mdi:view-grid" width={14} /> All Products
                </Link>
                {categoryTree.map((parent) => {
                  const hasChildren = parent.children.length > 0;
                  const isExpanded = mobileExpandedCats.has(parent._id);
                  return (
                    <div key={parent._id}>
                      <div className="flex items-center">
                        <Link
                          to={`/shop?category=${parent._id}`}
                          className="flex-1 py-2 pl-9 pr-2 text-[13px] text-gray-300 font-medium hover:text-[#FFB700] hover:bg-white/5"
                          onClick={() => setMobileOpen(false)}
                        >
                          {parent.name}
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => toggleMobileCat(parent._id)}
                            className="px-3 py-2 text-gray-500 hover:text-[#FFB700]"
                            aria-expanded={isExpanded}
                          >
                            <Icon
                              icon="mdi:chevron-down"
                              width={13}
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                      {hasChildren && isExpanded && (
                        <div className="pl-12 border-l border-white/10 ml-9 space-y-0.5 pb-1">
                          {parent.children.map((child) => (
                            <Link
                              key={child._id}
                              to={`/shop?category=${child._id}`}
                              className="flex items-center gap-2 py-1.5 text-[12px] text-gray-400 hover:text-[#FFB700]"
                              onClick={() => setMobileOpen(false)}
                            >
                              <span className="text-gray-600">└</span>
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/flash-sale"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 font-bold hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
          >
            <Icon icon="mdi:flash" width={16} /> Flash Sale
          </Link>
          <Link
            to="/shop?preowned=true"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 font-bold hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
          >
            <Icon icon="mdi:tag" width={16} /> Pre-Owned UK Items
          </Link>
          <Link
            to="/shop?newArrival=true"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 font-bold hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
          >
            <Icon icon="mdi:star" width={16} /> New Arrivals
          </Link>

          <div className="border-t border-white/5 mt-1 pt-1">
            <Link
              to="/about"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Icon
                icon="mdi:information"
                width={16}
                className="text-[#FFB700]"
              />{" "}
              About
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Icon icon="mdi:phone" width={16} className="text-[#FFB700]" />{" "}
              Contact
            </Link>
            <a
              href="tel:0112847846"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
            >
              <Icon icon="mdi:phone" width={16} className="text-green-400" />{" "}
              0112 847 846
            </a>
            <Link
              to="/privacy-policy"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Icon
                icon="mdi:shield-account"
                width={16}
                className="text-[#FFB700]"
              />{" "}
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Icon
                icon="mdi:file-document"
                width={16}
                className="text-[#FFB700]"
              />{" "}
              Terms &amp; Conditions
            </Link>
            <Link
              to="/faq"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Icon
                icon="mdi:help-circle"
                width={16}
                className="text-[#FFB700]"
              />{" "}
              FAQ
            </Link>
          </div>

          {isAuthenticated && (
            <div className="border-t border-white/5 mt-1 pt-1">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                <Icon
                  icon="mdi:account"
                  width={16}
                  className="text-[#FFB700]"
                />{" "}
                My Profile
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                <Icon
                  icon="mdi:package-variant"
                  width={16}
                  className="text-[#FFB700]"
                />{" "}
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
              >
                <Icon icon="mdi:logout" width={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
