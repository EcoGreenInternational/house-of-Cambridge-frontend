import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import { logout } from "../../redux/slices/authSlice.js";
import { fetchCategories } from "../../redux/slices/productSlice.js";
import { fetchWishlist } from "../../redux/slices/userSlice.js";
import { buildCategoryTree } from "../../utils/categoryTree.js";
import api from "../../redux/api/axiosInstance.js";

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function normalizeKeyword(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/(?:['’]s?|s)$/i, ""))
    .filter(Boolean)
    .join(" ");
}

function AllCategoriesDropdown({ tree }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative"     
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white text-black text-[13px] md:text-[14px] font-bold px-3 md:px-4 py-1.5 rounded-md hover:bg-gray-50 hover:shadow-sm active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
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
        <div className="absolute left-0 top-full mt-1 w-[200px] bg-white border border-gray-200 rounded shadow-lg py-1 z-50 max-h-[70vh] overflow-y-auto">
          <Link
            to="/shop"
            className="flex items-center gap-2 px-4 py-2 text-[12px] text-black font-medium hover:bg-gray-100 border-b border-gray-100 mb-0.5"
            onClick={() => setOpen(false)}
          >
            <span>🛍️</span> All Products
          </Link>
          {tree.map((parent) => (
            <div key={parent._id}>
              <Link
                to={`/shop?category=${parent._id}`}
                className="flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                onClick={() => setOpen(false)}
              >
                {parent.name}
              </Link>
              {parent.children.map((child) => (
                <Link
                  key={child._id}
                  to={`/shop?category=${child._id}`}
                  className="flex items-center gap-2 pl-8 pr-4 py-1.5 text-[11px] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
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
    <div ref={ref} className="relative"
          onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2.5 md:px-3 py-1 rounded-md text-white text-[12px] md:text-[13px] font-bold transition-all duration-200 hover:brightness-110 hover:shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
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
          {!loading && (
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
                    className="flex items-center justify-between px-4 py-2 text-[12px] text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {parent.name}
                  </Link>
                  {parent.children.map((child) => (
                    <Link
                      key={child._id}
                      to={`/shop?${baseParam}&category=${child._id}`}
                      className="flex items-center gap-2 pl-7 pr-4 py-1.5 text-[11px] text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
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

function SearchBar({ isMobile = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync with /shop?keyword=... URL query parameter
  useEffect(() => {
    if (location.pathname === "/shop") {
      const params = new URLSearchParams(location.search);
      const kw = params.get("keyword") || params.get("search") || "";
      setSearch(kw);
    }
  }, [location.pathname, location.search]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for live suggestions preview
  useEffect(() => {
    const trimmed = normalizeKeyword(search);
    if (trimmed.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/products", {
          params: { keyword: trimmed, limit: 6 },
          signal: controller.signal,
        });
        if (res.data?.success) {
          setResults(res.data.products || []);
          setTotal(res.data.total || 0);
          setOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = normalizeKeyword(search);
    setOpen(false);
    if (trimmed) {
      navigate(`/shop?keyword=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/shop");
    }
    inputRef.current?.blur();
  };

  const handleSelectProduct = (product) => {
    setOpen(false);
    navigate(`/product/${product._id}`);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelectProduct(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${
        isMobile
          ? "flex md:hidden mt-2.5 w-full"
          : "hidden md:flex flex-1 justify-center px-2 md:px-4"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        role="search"
        className={`flex items-center w-full ${
          isMobile ? "" : "max-w-[380px] lg:max-w-[480px]"
        }`}
      >
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (search.trim().length >= 2 && results.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search for Products, Categories and More"
            aria-label="Search"
            autoComplete="off"
            className="w-full bg-white text-[#1A1A1A] placeholder-gray-400 pl-3.5 pr-8 py-0 text-[13px] outline-none rounded-l h-9"
          />
          {search && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2 text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              <Icon icon="mdi:close-circle" width={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          aria-label="Submit search"
          className="bg-[#FFB700] w-[42px] h-9 rounded-r flex items-center justify-center hover:bg-amber-500 transition-colors flex-shrink-0"
        >
          {loading ? (
            <Icon icon="mdi:loading" width={18} className="text-black animate-spin" />
          ) : (
            <Icon icon="mdi:magnify" width={18} className="text-black" />
          )}
        </button>
      </form>

      {/* Live Search Dropdown */}
      {open && (
        <div
          className={`absolute top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden z-[10000] text-left ${
            isMobile
              ? "left-0 right-0 max-h-[75vh]"
              : "w-full max-w-[380px] lg:max-w-[480px] max-h-[460px]"
          } flex flex-col`}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <span>Products</span>
            {total > 0 && <span>{total} found</span>}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {results.length > 0 ? (
              results.map((product, idx) => {
                const img = product.images?.[0]?.url || "https://placehold.co/100x100?text=No+Image";
                const price = product.discountPrice > 0 ? product.discountPrice : product.price;
                const origPrice = product.discountPrice > 0 ? product.price : null;
                const brand = product.brand?.name || "";
                const category = product.category?.name || "";
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors cursor-pointer ${
                      isSelected ? "bg-amber-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={product.name}
                      className="w-11 h-11 rounded object-cover flex-shrink-0 bg-gray-100 border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 truncate">
                        {brand && <span className="font-semibold text-amber-600">{brand}</span>}
                        {brand && category && <span>•</span>}
                        {category && <span>{category}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[13px] font-bold text-[#1A1A1A]">
                        Rs. {Number(price || 0).toLocaleString()}
                      </span>
                      {origPrice && (
                        <div className="text-[11px] text-gray-400 line-through">
                          Rs. {Number(origPrice).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : !loading ? (
              <div className="py-8 px-4 text-center">
                <Icon icon="mdi:magnify-remove-outline" width={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-[13px] font-medium text-gray-700">No products found for "{search}"</p>
                <p className="text-[11px] text-gray-400 mt-1">Try keywords like "Johnson", "Shampoo", "Cream"</p>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-400 text-[12px] flex items-center justify-center gap-2">
                <Icon icon="mdi:loading" width={16} className="animate-spin text-amber-500" />
                Searching...
              </div>
            )}
          </div>

          {/* Footer - View All */}
          {results.length > 0 && (
            <div className="p-2 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-1.5 px-3 bg-[#FFB700] hover:bg-amber-500 text-black text-[12px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View all {total} results for "{search}"</span>
                <Icon icon="mdi:arrow-right" width={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  const isActive = (path) => location.pathname === path;
  const { categories, categoriesLoading } = useSelector((s) => s.products);
  const { cart } = useSelector((s) => s.cart);
  const { wishlist } = useSelector((s) => s.user);

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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setUserOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 z-[9999] w-full">
      {/* Top bar - Black */}
      <div className="w-full bg-black px-3 sm:px-4 md:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          
          {/* Desktop Logo */}
          <Link to="/" className="hidden md:flex items-center gap-2 flex-shrink-0">
            <img src="/images/logo-emblem-449bab.png" alt="House of Cambridge" className="h-9 md:h-10 lg:h-12 w-auto object-contain" />
            <span className="font-serif text-[#d2aa50] text-[18px] lg:text-[20px] leading-tight whitespace-nowrap">
              House Of Cambridge
            </span>
          </Link>

          {/* Mobile/Tablet logo */}
          <Link to="/" className="flex-shrink-0 md:hidden">
            <img
              src="/images/logo.png"
              alt="House of Cambridge"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Search - visible on md+ */}
          <SearchBar />

          {/* Desktop Right Icons */}
          <div className="hidden md:flex items-center justify-end gap-3 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
              <Link
                to="/cart"
                className="text-[#FFB700] hover:text-amber-400 transition-colors relative"
              >
                <Icon icon="mdi:cart" width={26} />
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
                <Icon icon="mdi:heart" width={26} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to={isAuthenticated ? '/profile' : '/login'}
                className="text-[#FFB700] hover:text-amber-400 transition-colors"
                aria-label="Account"
              >
                {isAuthenticated && user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-[#FFB700]" />
                ) : (
                  <Icon icon="mdi:account" width={26} />
                )}
              </Link>
            </div>

            <div ref={userRef} className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center justify-center bg-[#FFB700] text-black text-[13px] font-bold px-3.5 h-9 rounded-md hover:bg-amber-500 transition-colors whitespace-nowrap"
                >
                  <span className="max-w-[60px] truncate">{user?.name?.split(" ")[0]}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center bg-[#FFB700] text-black text-[13px] font-bold w-[100px] h-9 rounded-md hover:bg-amber-500 transition-colors whitespace-nowrap"
                >
                  Login
                </Link>
              )}
              {userOpen && isAuthenticated && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e2130] border border-white/10 rounded shadow-xl py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-[#FFB700] hover:bg-white/5"
                    onClick={() => setUserOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-[#FFB700] hover:bg-white/5"
                    onClick={() => setUserOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-[#FFB700] hover:bg-white/5"
                    onClick={() => setUserOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <hr className="my-1 border-white/5" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Controls (hamburger + icons) */}
          <div className="flex md:hidden items-center gap-3 ml-auto">
            <div className="flex items-center gap-1 text-[#FFB700] text-[11px] font-extrabold uppercase tracking-wide">
             <Icon icon="mdi:earth" width={13} /> EN
            </div>
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
        <SearchBar isMobile />
      </div>

      {/* Yellow Navigation Bar (Desktop md+ view) */}
      <nav
        className="hidden md:flex items-center h-[42px] bg-[#FFB700]" aria-label="Main navigation">
        <div className="w-full flex items-center justify-between px-3 md:px-6">
          <div className="flex-1 flex justify-start flex-shrink-0">
            <AllCategoriesDropdown tree={categoryTree} />
          </div>

          <div className="flex-shrink-0 px-4">
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
            <Link
              to="/"
              className={`text-[14px] md:text-[15px] font-bold whitespace-nowrap pb-0.5 transition-colors ${isActive("/") ? "text-black border-b-2 border-black" : "text-black/80 hover:text-black"}`}
            >
              Home
            </Link>

            <NavBadgeDropdown
              label="Pre-Owned UK Items"
              tree={categoryTree}
              baseParam="preowned=true"
              loading={categoriesLoading}
              badgeColor="#CC0000"
            />
            <NavBadgeDropdown
              label="New Arrivals"
              tree={categoryTree}
              baseParam="newArrival=true"
              loading={categoriesLoading}
              badgeColor="#008000"
            />

            <Link
              to="/shop"
              className={`text-[14px] md:text-[15px] font-bold whitespace-nowrap transition-colors ${isActive("/shop") ? "text-black border-b-2 border-black pb-0.5" : "text-black/80 hover:text-black"}`}
            >
              Shop
            </Link>

            <Link
              to="/about"
              className={`text-[14px] md:text-[15px] font-bold whitespace-nowrap transition-colors ${isActive("/about") ? "text-black border-b-2 border-black pb-0.5" : "text-black/80 hover:text-black"}`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`text-[14px] md:text-[15px] font-bold whitespace-nowrap transition-colors ${isActive("/contact") ? "text-black border-b-2 border-black pb-0.5" : "text-black/80 hover:text-black"}`}
            >
              Contact
            </Link>
            </div>
          </div>

          <div className="flex-1 flex justify-end items-center gap-2 md:gap-4 flex-shrink-0 hidden lg:flex">
            <a
              href="tel:0112847846"
              className="flex items-center gap-1.5 text-black font-bold text-[14px] md:text-[15px] tracking-wide whitespace-nowrap flex-shrink-0"
            >
              <Icon icon="mdi:phone" width={16} />
              0112 847 846
            </a>
            <div className="flex items-center gap-1 bg-black/10 text-black px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider select-none">
              <Icon icon="mdi:earth" width={14} />
              EN
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="md:hidden border-t border-white/10 bg-[#1a1a1a] py-2 max-h-[80vh] overflow-y-auto"
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
                  className="flex items-center gap-1.5 bg-[#FFB700] text-black text-[13px] font-bold px-4 py-1.5 rounded inline-block"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon icon="mdi:account" width={15} /> Login
                </Link>
              )}
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
                        <Link to={`/shop?category=${parent._id}`} className="flex-1 py-2 pl-9 pr-2 text-[13px] text-gray-300 font-medium hover:text-[#FFB700]" onClick={() => setMobileOpen(false)}>
                          {parent.name}
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => toggleMobileCat(parent._id)}
                            className="px-3 py-2 text-gray-500 hover:text-[#FFB700]"
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
