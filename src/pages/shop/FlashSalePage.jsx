import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { fetchFlashSaleProducts } from '../../redux/slices/productSlice';
import Layout from '../../components/common/Layout';
import FlashCard from '../../components/ui/FlashCard';
import { PageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const MAX_PRICE_DEFAULT = 50000;
const PER_PAGE = 12;
const TOP_DEALS_COUNT = 12;

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

function safePrice(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function Countdown({ endsAt }) {
  const calcRemaining = useCallback(() => {
    const fallbackEnd = new Date(Date.now() + 3 * 3_600_000);
    const end = endsAt ? new Date(endsAt) : fallbackEnd;
    if (isNaN(end.getTime())) return { h: 0, m: 0, s: 0 };
    const diff = Math.max(0, end - Date.now());
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
    };
  }, [endsAt]);

  const [t, setT] = useState(calcRemaining);

  useEffect(() => {
    const id = setInterval(() => setT(calcRemaining()), 1000);
    return () => clearInterval(id);
  }, [calcRemaining]);

  const pad = (n) => String(n).padStart(2, '0');

  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white text-[#202020] font-['Poppins'] font-bold text-[32px] w-[62px] h-[59px] flex items-center justify-center rounded-[10px]">
        {pad(value)}
      </div>
      <span className="font-['Poppins'] font-semibold text-[9px] text-white mt-0.5">{label}</span>
    </div>
  );

  return (
    <div className="inline-flex flex-col items-center">
      <div className="flex items-center gap-2 px-5 py-3 rounded-t-[11px]"
        style={{ background: 'linear-gradient(180deg, #D00000 0%, #000000 74%)', boxShadow: '0 0 0 2.2px #FF543E' }}
      >
        <p className="text-[#FFB700] font-semibold text-[14px]">Hurry up ! Sale ends in</p>
      </div>
      <div className="flex items-center gap-2 px-5 py-4 rounded-b-[11px]"
        style={{ background: 'linear-gradient(180deg, #D00000 0%, #000000 74%)', boxShadow: '0 0 0 2.2px #FF543E' }}
      >
        <TimeBox value={t.h} label="Hours" />
        <span className="flex flex-col items-center gap-1 self-center mb-4">
          <span className="w-1 h-1 bg-white rounded-full" />
          <span className="w-1 h-1 bg-white rounded-full" />
        </span>
        <TimeBox value={t.m} label="Mins" />
        <span className="flex flex-col items-center gap-1 self-center mb-4">
          <span className="w-1 h-1 bg-white rounded-full" />
          <span className="w-1 h-1 bg-white rounded-full" />
        </span>
        <TimeBox value={t.s} label="Secs" />
      </div>
    </div>
  );
}

function FilterCheck({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-1 cursor-pointer group">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-3.5 h-3.5 accent-[#FFB700]"
        />
        <span className="text-[13px] text-[#1A1A1A] group-hover:text-[#FFB700] transition-colors">
          {sanitizeText(label)}
        </span>
      </div>
      <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
        {Number.isFinite(count) ? count : 0}
      </span>
    </label>
  );
}

export default function FlashSalePage() {
  const dispatch = useDispatch();
  const { flashSale, loading, categories } = useSelector((s) => s.products);

  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE_DEFAULT]);
  const [sort, setSort] = useState('popularity');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchFlashSaleProducts());
  }, [dispatch]);

  const maxPrice = useMemo(() => {
    if (!flashSale.length) return MAX_PRICE_DEFAULT;
    const computed = Math.max(...flashSale.map((p) => safePrice(p.price)));
    return Number.isFinite(computed) && computed > 0 ? computed : MAX_PRICE_DEFAULT;
  }, [flashSale]);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const catCounts = useMemo(() => {
    const map = {};
    flashSale.forEach((p) => {
      const catId = p.category?._id;
      if (catId && typeof catId === 'string') {
        map[catId] = (map[catId] || 0) + 1;
      }
    });
    return map;
  }, [flashSale]);

  const brandCounts = useMemo(() => {
    const map = {};
    flashSale.forEach((p) => {
      const b = p.brand;
      if (b && typeof b === 'string') {
        map[b] = (map[b] || 0) + 1;
      }
    });
    return map;
  }, [flashSale]);

  const filtered = useMemo(() => {
    let res = flashSale.filter((p) => {
      const price = safePrice(p.flashSalePrice || p.discountPrice || p.price);
      const catOk = selectedCats.length === 0 || selectedCats.includes(p.category?._id);
      const brandOk = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const priceOk = price >= priceRange[0] && price <= priceRange[1];
      return catOk && brandOk && priceOk;
    });

    if (sort === 'price-asc') {
      res = [...res].sort(
        (a, b) => safePrice(a.flashSalePrice || a.discountPrice || a.price) - safePrice(b.flashSalePrice || b.discountPrice || b.price)
      );
    } else if (sort === 'price-desc') {
      res = [...res].sort(
        (a, b) => safePrice(b.flashSalePrice || b.discountPrice || b.price) - safePrice(a.flashSalePrice || a.discountPrice || a.price)
      );
    }

    return res;
  }, [flashSale, selectedCats, selectedBrands, priceRange, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleCat = useCallback((id) => {
    if (typeof id !== 'string') return;
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setPage(1);
  }, []);

  const toggleBrand = useCallback((brand) => {
    if (typeof brand !== 'string' || !brand) return;
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCats([]);
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setPage(1);
  }, [maxPrice]);

  const handlePriceChange = useCallback(
    (e) => {
      const val = Math.min(maxPrice, Math.max(0, Number(e.target.value)));
      setPriceRange([priceRange[0], val]);
      setPage(1);
    },
    [maxPrice, priceRange]
  );

  const handleSortChange = useCallback((e) => {
    const allowed = ['popularity', 'price-asc', 'price-desc'];
    if (allowed.includes(e.target.value)) {
      setSort(e.target.value);
      setPage(1);
    }
  }, []);

  const [bannerContent] = useState({
    countdownLabel: 'Hurry up ! Sale ends in',
  });

  const endsAt = flashSale[0]?.flashSaleEnds;

  const validCategories = useMemo(
    () => categories.filter((c) => c._id && catCounts[c._id]),
    [categories, catCounts]
  );

  const validBrands = useMemo(
    () => Object.keys(brandCounts).sort(),
    [brandCounts]
  );

  const validFlashSaleProducts = useMemo(
    () => flashSale.filter((p) => p._id).slice(0, TOP_DEALS_COUNT),
    [flashSale]
  );

  return (
    <Layout>
      <div className="relative overflow-hidden" style={{ background: '#1a0000' }}>
        <img
          src="/images/flash-sale-bg.png"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none select-none"
        />

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8">
          <nav aria-label="Breadcrumb">
            <p className="text-white/70 text-[13px] pt-5 pb-2">
              <Link to="/" className="hover:text-white">Home</Link> / Flash Sale
            </p>
          </nav>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-16 pb-8">
            <div className="flex items-start gap-2 sm:gap-3">
              <Icon icon="mdi:flash" width={40} className="sm:w-[60px] text-[#FFB700] mt-1 flex-shrink-0" aria-hidden="true" />
              <div>
                <div
                  className="font-black italic leading-none select-none"
                  style={{ fontSize: 'clamp(36px, 7vw, 80px)', lineHeight: '0.9' }}
                >
                  <span className="text-white block">FLASH</span>
                  <span
                    className="block"
                    style={{
                      background: 'linear-gradient(180deg, #FFB700 90%, #CC0000 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    SALE
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="text-white text-[12px] sm:text-[14px] font-semibold italic">
                {bannerContent.countdownLabel}
              </div>
              <Countdown endsAt={endsAt} />
            </div>
          </div>
        </div>
      </div>

      {validFlashSaleProducts.length > 0 && (
        <section className="py-8 bg-white" aria-labelledby="top-flash-deals-heading">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="bg-[linear-gradient(90deg,#C20404_60.25%,#FF5312_100%)] rounded-[10px] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:flash" width={36} className="sm:w-[44px] text-[#FFB700]" aria-hidden="true" />
                  <div>
                    <h2 id="top-flash-deals-heading" className="font-['Poppins'] font-bold text-white text-[24px] sm:text-[32px]">
                      Top Flash Deals
                    </h2>
                    <p className="font-['Poppins'] font-semibold text-white text-[12px] sm:text-[14px]">Limited Time Offer</p>
                  </div>
                </div>

                <Link
                  to="/shop"
                  className="flex items-center justify-center border border-white text-white text-[12px] sm:text-[14px] font-semibold w-[130px] sm:w-[144px] h-[34px] sm:h-[38px] rounded-[5.8px] hover:bg-white/10 transition-colors"
                >
                  View All Deals <Icon icon="mdi:chevron-right" width={14} className="ml-1" aria-hidden="true" />
                </Link>
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4"
                role="list"
                aria-label="Top flash deals"
              >
                {validFlashSaleProducts.map((p) => (
                  <div key={p._id} role="listitem">
                    <FlashCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <PageSpinner />
        ) : flashSale.length === 0 ? (
          <div className="text-center py-16 text-gray-400" role="status">
            <Icon icon="mdi:flash" width={48} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
            <p className="font-medium">No flash sale products at the moment</p>
            <p className="text-sm mt-1">Check back soon for amazing deals!</p>
          </div>
        ) : (
          <div className="flex gap-6">
            <aside className="hidden lg:block w-[200px] flex-shrink-0" aria-label="Product filters">
              <div className="border border-[#E9E9E9] rounded-[10px] overflow-hidden">
                <div className="border-b border-[#E9E9E9] px-4 py-3">
                  <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-2">Categories</h3>
                  <div className="space-y-0.5">
                    {validCategories.map((c) => (
                      <FilterCheck
                        key={c._id}
                        label={c.name}
                        count={catCounts[c._id] || 0}
                        checked={selectedCats.includes(c._id)}
                        onChange={() => toggleCat(c._id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-b border-[#E9E9E9] px-4 py-3">
                  <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-2">Brands</h3>
                  <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
                    {validBrands.length === 0 && (
                      <p className="text-[11px] text-gray-400 py-1">No brands available</p>
                    )}
                    {validBrands.map((brand) => (
                      <FilterCheck
                        key={brand}
                        label={brand}
                        count={brandCounts[brand] || 0}
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-b border-[#E9E9E9] px-4 py-3">
                  <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-3">Price Range</h3>
                  <div className="flex justify-between text-[11px] text-gray-500 mb-2">
                    <span>Rs. {priceRange[0].toLocaleString()}</span>
                    <span>Rs. {priceRange[1].toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={handlePriceChange}
                    className="w-full accent-[#FFB700]"
                    aria-label={`Maximum price: Rs. ${priceRange[1].toLocaleString()}`}
                  />
                </div>

                <div className="px-4 py-3">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-[#FFB700] text-black text-[12px] font-bold py-2 rounded-[6px] hover:bg-amber-500 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </aside>

            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
                <div>
                  <h2 className="text-[16px] sm:text-[18px] font-bold text-[#1A1A1A]">All Flash Sale Products</h2>
                  <p className="text-[11px] sm:text-[12px] text-gray-400">{filtered.length} products</p>
                </div>
                <label className="sr-only" htmlFor="flash-sort">Sort products</label>
                <select
                  id="flash-sort"
                  value={sort}
                  onChange={handleSortChange}
                  className="border border-[#E9E9E9] rounded-[6px] text-[12px] sm:text-[13px] px-3 py-2 outline-none text-[#1A1A1A] bg-white"
                >
                  <option value="popularity">Sort By: Popularity</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                role="list"
                aria-label="Flash sale products"
              >
                {paginated.map((p) => (
                  <div key={p._id} role="listitem">
                    <FlashCard product={p} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-[13px] border border-[#E9E9E9] rounded hover:border-[#FFB700] disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={page === n ? 'page' : undefined}
                      className={`w-8 h-8 text-[13px] rounded border ${
                        page === n
                          ? 'bg-[#FFB700] border-[#FFB700] text-black font-bold'
                          : 'border-[#E9E9E9] hover:border-[#FFB700]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  {totalPages > 6 && <span className="px-1 text-gray-400" aria-hidden="true">...</span>}
                  {totalPages > 6 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      aria-label={`Page ${totalPages}`}
                      className="w-8 h-8 text-[13px] rounded border border-[#E9E9E9] hover:border-[#FFB700]"
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-[13px] border border-[#E9E9E9] rounded hover:border-[#FFB700] disabled:opacity-40"
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
