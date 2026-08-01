import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../../redux/slices/productSlice';
import Layout from '../../components/common/Layout';
import ProductCard from '../../components/ui/ProductCard';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageSpinner } from '../../components/ui/Spinner';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { buildCategoryTree } from '../../utils/categoryTree';

const ALLOWED_SORTS = new Set(['newest', 'featured', 'price_asc', 'price_desc', 'rating']);
const MAX_PRICE_INPUT = 10_000_000;
const DEFAULT_RES_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest First' },
  { value: 'featured',  label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'rating',    label: 'Best Rated' },
];

const PRICE_RANGES = [
  { label: 'Under Rs. 500',     min: 0,    max: 500 },
  { label: 'Rs. 500 – 1,000',  min: 500,  max: 1000 },
  { label: 'Rs. 1,000 – 3,000',min: 1000, max: 3000 },
  { label: 'Rs. 3,000 – 5,000',min: 3000, max: 5000 },
  { label: 'Over Rs. 5,000',   min: 5000, max: 999999 },
];

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

function safePageNumber(val, min = 1, max = 9999) {
  const n = Math.floor(Number(val));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function safePriceInput(val) {
  if (val === '' || val === null || val === undefined) return '';
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return '';
  return String(Math.min(MAX_PRICE_INPUT, Math.floor(n)));
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, total, resPerPage, categories } = useSelector((s) => s.products);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [expandedCats, setExpandedCats] = useState(new Set());

  const keyword    = sanitizeText(searchParams.get('keyword') || searchParams.get('search') || '');
  const category   = sanitizeText(searchParams.get('category')   || '');
  const sortRaw    = searchParams.get('sort') || 'newest';
  const sort       = ALLOWED_SORTS.has(sortRaw) ? sortRaw : 'newest';
  const page       = safePageNumber(searchParams.get('page'));
  const minPrice   = safePriceInput(searchParams.get('minPrice') || '');
  const maxPrice   = safePriceInput(searchParams.get('maxPrice') || '');
  const preowned   = searchParams.get('preowned')   === 'true' ? 'true' : '';
  const newArrival = searchParams.get('newArrival') === 'true' ? 'true' : '';

  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);

  useEffect(() => {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const payload = { page };
    
    if (keyword)  payload.keyword = keyword;
    if (category) payload.category = category;
    if (sort)     payload.sort = sort;
    
    if (minPrice !== '') payload.minPrice = minPrice;
    if (maxPrice !== '') payload.maxPrice = maxPrice;
    
    if (preowned)   payload.preowned = true;
    if (newArrival) payload.newArrival = true;

    dispatch(fetchProducts(payload));
  }, [dispatch, keyword, category, sort, page, minPrice, maxPrice, preowned, newArrival]);

  const updateParam = useCallback((key, value) => {
    setSearchParams((prevParams) => {
      const params = new URLSearchParams(prevParams);

      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key === 'category') {
        params.delete('keyword');
        params.delete('search');
      }
      if (key !== 'page') {
        params.set('page', '1');
      }

      return params;
    });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setPriceMin('');
    setPriceMax('');
    setSearchParams({});
  }, [setSearchParams]);

  const applyPrice = useCallback(() => {
    const params = Object.fromEntries(searchParams);
    const safeMin = safePriceInput(priceMin);
    const safeMax = safePriceInput(priceMax);
    if (safeMin !== '') params.minPrice = safeMin; else delete params.minPrice;
    if (safeMax !== '') params.maxPrice = safeMax; else delete params.maxPrice;
    params.page = '1';
    setSearchParams(params);
  }, [priceMin, priceMax, searchParams, setSearchParams]);

  const perPage = resPerPage || DEFAULT_RES_PER_PAGE;
  const totalPages = Math.ceil(total / perPage);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  useEffect(() => {
    if (!category || !categories.length) return;
    const selected = categories.find((c) => c._id === category);
    const parentId = selected?.parent?._id || selected?.parent;
    if (parentId && typeof parentId === 'string') {
      setExpandedCats((prev) => {
        if (prev.has(parentId)) return prev;
        return new Set([...prev, parentId]);
      });
    }
  }, [category, categories]);

  const toggleCat = useCallback((id) => {
    if (typeof id !== 'string') return;
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const brands = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (p.brand && typeof p.brand === 'string') {
        map[p.brand] = (map[p.brand] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const visibleBrands = brandsExpanded ? brands : brands.slice(0, 5);
  const hasFilters = keyword || category || minPrice || maxPrice || preowned || newArrival;

  const getPages = useCallback(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  const handleSortChange = useCallback((e) => {
    const val = e.target.value;
    if (ALLOWED_SORTS.has(val)) updateParam('sort', val);
  }, [updateParam]);

  const handlePriceRangeClick = useCallback((r) => {
    const params = Object.fromEntries(searchParams);
    params.minPrice = String(r.min);
    params.maxPrice = String(r.max);
    params.page = '1';
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleMinPriceChange = useCallback((e) => {
    const val = e.target.value;
    if (val === '' || (Number(val) >= 0 && Number(val) <= MAX_PRICE_INPUT)) {
      setPriceMin(val);
    }
  }, []);

  const handleMaxPriceChange = useCallback((e) => {
    const val = e.target.value;
    if (val === '' || (Number(val) >= 0 && Number(val) <= MAX_PRICE_INPUT)) {
      setPriceMax(val);
    }
  }, []);

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            ...(preowned   ? [{ label: 'Pre-Owned UK Items', href: '/shop?preowned=true' }]   : []),
            ...(newArrival ? [{ label: 'New Arrivals',       href: '/shop?newArrival=true' }] : []),
            {
              label: keyword
                ? `Search: "${keyword}"`
                : preowned || newArrival
                  ? 'All'
                  : 'Shop',
            },
          ]}
        />
      </div>

      {preowned && (
        <div className="max-w-7xl mx-auto px-4 mb-2">
          <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-3 flex items-center gap-3" role="status">
            <span className="text-red-600 font-bold text-[13px]">Pre-Owned UK Items</span>
            <span className="text-[12px] text-red-500">
              Showing only pre-owned products{category ? ' in this category' : ''}
            </span>
          </div>
        </div>
      )}
      {newArrival && (
        <div className="max-w-7xl mx-auto px-4 mb-2">
          <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3 flex items-center gap-3" role="status">
            <span className="text-green-700 font-bold text-[13px]">New Arrivals</span>
            <span className="text-[12px] text-green-600">
              Showing only new arrival products{category ? ' in this category' : ''}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 pb-12 flex gap-6">

        <aside
          className={`w-[230px] flex-shrink-0 ${filtersOpen ? 'block' : 'hidden md:block'}`}
          aria-label="Product filters"
        >
          <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-4 sticky top-24 shadow-[2px_3px_8px_rgba(0,0,0,0.05)]">

            <nav aria-label="Category navigation">
              <div className="mb-5">
                <h3 className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParam('category', '')}
                    aria-pressed={!category}
                    className={`w-full text-left text-[13px] px-2.5 py-2 rounded-[6px] flex items-center justify-between transition-colors ${
                      !category ? 'bg-amber-50 text-[#FFB700] font-semibold' : 'text-[#60717B] hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${!category ? 'bg-[#FFB700]' : 'bg-gray-300'}`} aria-hidden="true" />
                      All Categories
                    </span>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {total}
                    </span>
                  </button>

                  {categoryTree.map((parent) => {
                    const hasChildren = parent.children.length > 0;
                    const isOpen = expandedCats.has(parent._id);
                    const childSelected = parent.children.some((c) => c._id === category);
                    const parentId = sanitizeText(parent._id);
                    const parentName = sanitizeText(parent.name);

                    return (
                      <div key={parentId}>
                        <div className={`flex items-center rounded-[6px] transition-colors ${category === parentId ? 'bg-amber-50' : ''}`}>
                          <button
                            onClick={() => updateParam('category', parentId)}
                            aria-pressed={category === parentId}
                            className={`flex-1 text-left text-[13px] px-2.5 py-2 flex items-center gap-2 ${
                              category === parentId
                                ? 'text-[#FFB700] font-semibold'
                                : childSelected
                                  ? 'text-[#1A1A1A] font-medium'
                                  : 'text-[#60717B] hover:text-[#1A1A1A]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                category === parentId
                                  ? 'bg-[#FFB700]'
                                  : childSelected
                                    ? 'bg-[#1A1A1A]'
                                    : 'bg-gray-300'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{parentName}</span>
                          </button>
                          {hasChildren && (
                            <button
                              onClick={() => toggleCat(parentId)}
                              className="px-2 py-2 text-gray-400 hover:text-[#1A1A1A] transition-colors"
                              aria-label={isOpen ? `Collapse ${parentName}` : `Expand ${parentName}`}
                              aria-expanded={isOpen}
                            >
                              <FiChevronDown
                                size={13}
                                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                        </div>

                        {hasChildren && isOpen && (
                          <div className="ml-4 border-l-2 border-[#F0F0F0] pl-2 mt-0.5 mb-1 space-y-0.5">
                            {parent.children.map((child) => {
                              const childId = sanitizeText(child._id);
                              const childName = sanitizeText(child.name);
                              return (
                                <button
                                  key={childId}
                                  onClick={() => updateParam('category', childId)}
                                  aria-pressed={category === childId}
                                  className={`w-full text-left text-[12px] px-2 py-1.5 rounded-[6px] flex items-center gap-2 transition-colors ${
                                    category === childId
                                      ? 'bg-amber-50 text-[#FFB700] font-semibold'
                                      : 'text-[#60717B] hover:bg-gray-50 hover:text-[#1A1A1A]'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      category === childId ? 'bg-[#FFB700]' : 'bg-gray-200'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{childName}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </nav>

            {brands.length > 0 && (
              <div className="mb-5 border-t border-gray-100 pt-4">
                <h3 className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
                  Brand
                </h3>
                <div className="space-y-1.5">
                  {visibleBrands.map(([brand, count]) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="accent-[#FFB700] w-3.5 h-3.5" readOnly />
                      <span className="text-[12px] text-[#60717B] group-hover:text-[#1A1A1A] transition-colors flex-1 truncate">
                        {sanitizeText(brand)}
                      </span>
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {count}
                      </span>
                    </label>
                  ))}
                </div>
                {brands.length > 5 && (
                  <button
                    onClick={() => setBrandsExpanded((v) => !v)}
                    className="mt-2 text-[12px] text-[#FFB700] font-medium flex items-center gap-1 hover:underline"
                    aria-expanded={brandsExpanded}
                  >
                    {brandsExpanded
                      ? <><FiChevronUp size={12} aria-hidden="true" /> Show Less</>
                      : <><FiChevronDown size={12} aria-hidden="true" /> View More ({brands.length - 5})</>}
                  </button>
                )}
              </div>
            )}

            <div className="mb-5 border-t border-gray-100 pt-4">
              <h3 className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
                Price Range (Rs.)
              </h3>
              <div className="space-y-1.5 mb-3">
                {PRICE_RANGES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => handlePriceRangeClick(r)}
                    aria-pressed={minPrice === String(r.min) && maxPrice === String(r.max)}
                    className={`w-full text-left text-[12px] px-2 py-1.5 rounded-[5px] transition-colors ${
                      minPrice === String(r.min) && maxPrice === String(r.max)
                        ? 'bg-amber-50 text-[#FFB700] font-semibold'
                        : 'text-[#60717B] hover:bg-gray-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="price-min">Minimum price</label>
                <input
                  id="price-min"
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={handleMinPriceChange}
                  min={0}
                  max={MAX_PRICE_INPUT}
                  className="w-full border border-[#C5C5C5] rounded-[5px] px-2 py-1.5 text-[12px] outline-none focus:border-[#FFB700]"
                />
                <label className="sr-only" htmlFor="price-max">Maximum price</label>
                <input
                  id="price-max"
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={handleMaxPriceChange}
                  min={0}
                  max={MAX_PRICE_INPUT}
                  className="w-full border border-[#C5C5C5] rounded-[5px] px-2 py-1.5 text-[12px] outline-none focus:border-[#FFB700]"
                />
              </div>
              <button
                onClick={applyPrice}
                className="mt-2 w-full bg-[#FFB700] text-black py-1.5 rounded-[5px] text-[12px] font-semibold hover:bg-amber-500 transition-colors"
              >
                Apply
              </button>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full border border-[#FFB700] text-[#FFB700] py-2 rounded-[6px] text-[12px] font-bold hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <FiX size={13} aria-hidden="true" /> Clear All Filters
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="md:hidden flex items-center gap-1.5 border border-[#E9E9E9] bg-white px-3 py-2 rounded-[6px] text-[13px] hover:border-[#FFB700] transition-colors"
                aria-expanded={filtersOpen}
                aria-controls="mobile-filters"
              >
                <FiFilter size={14} aria-hidden="true" /> Filters
              </button>
              {total > 0 && (
                <p className="text-[13px] text-[#60717B]" aria-live="polite">
                  Showing{' '}
                  <span className="font-semibold text-[#1A1A1A]">{from}–{to}</span>{' '}
                  of{' '}
                  <span className="font-semibold text-[#1A1A1A]">{total}</span> products
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort" className="text-[13px] text-[#60717B] hidden sm:block">
                Sort By:
              </label>
              <div className="relative">
                <select
                  id="shop-sort"
                  value={sort}
                  onChange={handleSortChange}
                  className="appearance-none border border-[#C5C5C5] rounded-[6px] px-3 py-2 pr-8 text-[13px] text-[#1A1A1A] bg-white outline-none focus:border-[#FFB700] cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <FiChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <PageSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400" role="status">
              <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
              <p className="font-medium text-[#1A1A1A]">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-[#FFB700] text-sm font-medium hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                role="list"
                aria-label="Shop products"
              >
                {products.map((p) => (
                  <div key={p._id} role="listitem">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="flex justify-center items-center gap-1.5 mt-10"
                  aria-label="Shop pagination"
                >
                  <button
                    onClick={() => updateParam('page', String(page - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-[6px] text-[13px] font-medium border border-[#C5C5C5] hover:border-[#FFB700] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>

                  {getPages().map((pg, i) =>
                    pg === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-gray-400 text-[13px]" aria-hidden="true">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => updateParam('page', String(pg))}
                        aria-label={`Page ${pg}`}
                        aria-current={pg === page ? 'page' : undefined}
                        className={`w-9 h-9 rounded-[6px] text-[13px] font-medium transition-colors ${
                          pg === page
                            ? 'bg-[#FFB700] text-black font-bold'
                            : 'border border-[#C5C5C5] text-[#60717B] hover:border-[#FFB700] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {pg}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => updateParam('page', String(page + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-[6px] text-[13px] font-medium border border-[#C5C5C5] hover:border-[#FFB700] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}