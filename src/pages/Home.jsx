import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Icon } from '@iconify/react';
import {
  fetchFlashSaleProducts,
  fetchCategories,
  fetchPopularProducts,
  fetchHomeNewArrivals,
} from '../redux/slices/productSlice';
import api from '../redux/api/axiosInstance';
import ProductCard from '../components/ui/ProductCard';
import FlashCard from '../components/ui/FlashCard';
import Layout from '../components/common/Layout';

const HERO_SLIDES = [
  {
    title:        'House Of Cambridge',
    sub:          'One-stop shop for all your favourite brands',
    image:        '/images/hero-slide-1-7a4bbd.png',
  },
  {
    title:        'Beauty Deals — Glow More, Save More!',
    sub:          'Up to 40% OFF on top brands',
    image:        '/images/hero-slide-2.png',
  },
  {
    title:        'Self Care Starts Here',
    sub:          'Pamper yourself everyday — up to 40% OFF',
    image:        '/images/hero-slide-3-6a4322.png',
  },
];

const STATIC_CATS = [
  { label: 'Beauty and\nCosmetics', bg: '#ABFFDF',              img: '/images/categories/cat-beauty-1627cd.png',          slug: 'beauty'           },
  { label: 'Computers &\nPrinters', bg: '#CBFAFF',              img: '/images/categories/cat-computers-3b5a07.png',       slug: 'computers'        },
  { label: 'Electronics',           bg: '#FFD4F0',              img: '/images/categories/cat-electronics-4ce300.png',     slug: 'electronics'      },
  { label: 'Home\nAppliances',      bg: '#DDDFFF',              img: '/images/categories/cat-home-appliances-1ae981.png', slug: 'home-appliances'  },
  { label: 'Baby Care',             bg: 'rgba(255,146,118,0.53)', img: '/images/categories/cat-baby-care-211669.png',     slug: 'baby-care'        },
];

const BRAND_LOGOS = [
  '/images/about/brand-logo-1.png',
  '/images/about/brand-logo-2-490804.png',
  '/images/about/brand-logo-3.png',
  '/images/about/brand-logo-4.png',
  '/images/about/brand-logo-5.png',
  '/images/about/brand-logo-6-344f7d.png',
  '/images/about/brand-logo-7.png',
  '/images/about/brand-logo-8-25d535.png',
  '/images/about/brand-logo-9-7959ba.png',
  '/images/about/brand-logo-10-465f37.png',
];

const FEATURES = [
  { icon: <Icon icon="mdi:truck" width={26} className="text-[#FFB700]" aria-hidden="true" />, title: 'Free Shipping',  sub: 'When ordering over Rs.10000'  },
  { icon: <Icon icon="mdi:undo" width={22} className="text-[#FFB700]" aria-hidden="true" />, title: 'Free Return',    sub: 'Get return within 30 days'    },
  { icon: <Icon icon="mdi:lock" width={22} className="text-[#FFB700]" aria-hidden="true" />, title: 'Secure Payment', sub: '100% secure online payment'   },
  { icon: <Icon icon="mdi:medal" width={24} className="text-[#FFB700]" aria-hidden="true" />, title: 'Best Quality',   sub: 'Original product guaranteed'  },
];

const SKELETON_COUNT  = 6;
const HERO_INTERVAL   = 5000;
const SCROLL_STEP     = 220;
const MAX_FLASH_CARDS = 6;
const MAX_CATEGORY_PRODUCTS = 8;
const FLASH_SALE_FALLBACK_HOURS = 3;

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

function FlashCountdown({ endsAt }) {
  const calcRemaining = useCallback(() => {
    const fallbackEnd = new Date(Date.now() + FLASH_SALE_FALLBACK_HOURS * 3_600_000);
    const end  = endsAt ? new Date(endsAt) : fallbackEnd;
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
      <div
        className="bg-white text-[#202020] font-['Poppins'] font-bold text-[32px] w-[62px] h-[59px] flex items-center justify-center rounded-[10px]"
        aria-label={`${value} ${label}`}
      >
        {pad(value)}
      </div>
      <span className="font-['Poppins'] font-semibold text-[9px] text-black mt-0.5">{label}</span>
    </div>
  );

  return (
    <div
      className="flex items-center gap-2"
      role="timer"
      aria-label="Flash sale ends in"
      aria-live="off"
    >
      <TimeBox value={t.h} label="Hours" />
      <span className="flex flex-col items-center gap-1 self-center mb-4" aria-hidden="true">
        <span className="w-1 h-1 bg-white rounded-full" />
        <span className="w-1 h-1 bg-white rounded-full" />
      </span>
      <TimeBox value={t.m} label="Mins" />
      <span className="flex flex-col items-center gap-1 self-center mb-4" aria-hidden="true">
        <span className="w-1 h-1 bg-white rounded-full" />
        <span className="w-1 h-1 bg-white rounded-full" />
      </span>
      <TimeBox value={t.s} label="Secs" />
    </div>
  );
}

function FlashCardSkeleton() {
  return (
    <div className="flex gap-3" aria-busy="true" aria-label="Loading flash sale products">
      {Array.from({ length: MAX_FLASH_CARDS }).map((_, i) => (
        <div key={i} className="bg-white/10 rounded-lg h-64 w-full animate-pulse flex-1" />
      ))}
    </div>
  );
}

function ProductRow({ products, label }) {
  const rowRef = useRef(null);

  const scroll = useCallback((dir) => {
    rowRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label={`Scroll ${label || 'products'} left`}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow items-center justify-center hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
      >
        <Icon icon="mdi:chevron-left" width={18} aria-hidden="true" />
      </button>
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        aria-label={label}
        role="list"
      >
        {products.map((p) => (
          <div key={p._id} className="w-[185px] flex-shrink-0" role="listitem">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label={`Scroll ${label || 'products'} right`}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full shadow items-center justify-center hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
      >
        <Icon icon="mdi:chevron-right" width={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="flex gap-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="w-[185px] h-[280px] flex-shrink-0 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-5">
      <h2 className="text-[16px] font-black text-black uppercase">{title}</h2>
      <Link
        to={to || '/shop'}
        className="text-[16px] font-semibold text-black underline hover:text-[#FFB700] transition-colors"
      >
        View All
      </Link>
    </div>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { flashSale, popular, homeNewArrivals, categories } = useSelector((s) => s.products);

  const [slide, setSlide]                       = useState(0);
  const [beautyProducts, setBeautyProducts]     = useState([]);
  const [electronicsProducts, setElectronicsProducts] = useState([]);

  const autoRef = useRef(null);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(
      () => setSlide((p) => (p + 1) % HERO_SLIDES.length),
      HERO_INTERVAL,
    );
  }, []);

  const goSlide = useCallback((i) => {
    setSlide(i);
    startAuto();
  }, [startAuto]);

  useEffect(() => {
    dispatch(fetchFlashSaleProducts());
    dispatch(fetchPopularProducts());
    dispatch(fetchHomeNewArrivals());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  useEffect(() => {
    if (!categories || categories.length === 0) return;

    let cancelled = false;

    const beautyId = categories.find((c) => c.name.toLowerCase().includes('beauty'))?._id;
    const electronicsId = categories.find((c) => c.name.toLowerCase().includes('electronic'))?._id;

    if (beautyId) {
      api.get('/products', { params: { category: beautyId, limit: MAX_CATEGORY_PRODUCTS } })
        .then((res) => { if (!cancelled) setBeautyProducts(res.data.products || []); })
        .catch(() => {});
    }
    if (electronicsId) {
      api.get('/products', { params: { category: electronicsId, limit: MAX_CATEGORY_PRODUCTS } })
        .then((res) => { if (!cancelled) setElectronicsProducts(res.data.products || []); })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [categories?.length]);

  const cur = HERO_SLIDES[slide];

  return (
    <Layout>

      <section
        className="relative overflow-hidden bg-gray-900"
        aria-label="Promotional hero carousel"
        aria-roledescription="carousel"
      >
        <div
          className="relative min-h-[437px] bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${cur.image})` }}
          role="img"
          aria-label={cur.title}
        >
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 md:px-16 w-full py-10 md:py-16 min-h-[300px] md:min-h-[437px] flex items-center">
            <div className="max-w-lg">
              <div className="flex items-start gap-3 mb-0.5">
                <span className="w-1 h-[28px] md:h-[44px] bg-[#FFB700] rounded-full flex-shrink-0 mt-1" aria-hidden="true" />
                <p className="text-white text-[22px] md:text-[36px] font-bold leading-[28px] md:leading-[44px]">
                  {cur.title}
                </p>
              </div>
              <p className="text-white text-[14px] md:text-[20px] font-normal leading-[20px] md:leading-[28px] mb-5 md:mb-8 ml-3 md:ml-4">
                {cur.sub}
              </p>
              <Link
                to="/shop"
                className="ml-3 md:ml-4 inline-flex items-center justify-center bg-[#FFB700] text-black text-[13px] md:text-[15px] font-semibold w-[130px] md:w-[157px] h-8 md:h-9 rounded-full hover:bg-amber-500 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goSlide((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Icon icon="mdi:chevron-left" width={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goSlide((slide + 1) % HERO_SLIDES.length)}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Icon icon="mdi:chevron-right" width={20} aria-hidden="true" />
        </button>

        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
          role="tablist"
          aria-label="Slide indicators"
        >
          {HERO_SLIDES.map((s, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              onClick={() => goSlide(i)}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i === slide ? 'bg-black' : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="bg-white border-b border-gray-100" aria-label="Service highlights">
        <div className="max-w-[1280px] mx-auto px-4">
          <ul className="grid grid-cols-2 md:grid-cols-4 list-none m-0 p-0">
            {FEATURES.map(({ icon, title, sub }, idx) => (
              <li
                key={title}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-4 sm:py-0 min-h-[70px] md:h-[83px] ${
                  idx < 2 ? 'border-b border-gray-100' : ''
                } md:border-b-0 md:border-r border-gray-100 last:md:border-r-0`}
              >
                <div className="flex-shrink-0">{icon}</div>
                <div>
                  <p className="text-[14px] sm:text-[16.5px] font-bold text-[#171C26]">{title}</p>
                  <p className="text-[12px] sm:text-[15.6px] text-black/34">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="py-8 bg-white"
        aria-labelledby="flash-sale-heading"
      >
        <div className="max-w-[1280px] mx-auto px-4">
            <div className="bg-[linear-gradient(90deg,#C20404_60.25%,#FF5312_100%)] rounded-[10px] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:flash" width={28} className="sm:w-[32px] text-[#FFB700]" aria-hidden="true" />
                  <div>
                    <h2 id="flash-sale-heading" className="font-['Poppins'] font-bold text-white text-[24px] sm:text-[32px]">
                      FLASH SALE
                    </h2>
                    <p className="font-['Poppins'] font-semibold text-white text-[12px] sm:text-[14px]">Limited Time Offer</p>
                  </div>
                </div>

                <FlashCountdown endsAt={flashSale[0]?.flashSaleEnds} />

                <Link
                  to="/flash-sale"
                  className="flex items-center justify-center border border-white text-white text-[12px] sm:text-[14px] font-semibold w-[130px] sm:w-[144px] h-[34px] sm:h-[38px] rounded-[5.8px] hover:bg-white/10 transition-colors"
                >
                  View All Deals <Icon icon="mdi:chevron-right" width={14} className="ml-1" aria-hidden="true" />
                </Link>
              </div>

            {flashSale.length > 0 ? (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                role="list"
                aria-label="Flash sale products"
              >
                {flashSale.slice(0, MAX_FLASH_CARDS).map((p) => (
                  <div key={p._id} role="listitem">
                    <FlashCard product={p} />
                  </div>
                ))}
              </div>
            ) : (
              <FlashCardSkeleton />
            )}
          </div>
        </div>
      </section>

      <section className="py-8 bg-white" aria-labelledby="categories-heading">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 id="categories-heading" className="sr-only">Shop by Category</h2>
          <ul className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap list-none m-0 p-0">
            {STATIC_CATS.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                  className="flex flex-col items-center gap-2 sm:gap-3 group"
                >
                  <div
                    className="w-[80px] sm:w-[110px] h-[80px] sm:h-[110px] rounded-[14px] sm:rounded-[20px] flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#FFB700] transition-all shadow-sm"
                    style={{ background: cat.bg }}
                    aria-hidden="true"
                  >
                    <img
                      src={cat.img}
                      alt=""
                      className="w-[75%] sm:w-[80%] h-[75%] sm:h-[80%] object-contain"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[12px] sm:text-[14px] font-medium text-black text-center whitespace-pre-line leading-tight group-hover:text-[#FFB700] transition-colors">
                    {cat.label.replace('\n', ' ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-6" aria-labelledby="promo-banners-1-heading">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 id="promo-banners-1-heading" className="sr-only">Promotional offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/shop" className="rounded-[10px] overflow-hidden relative flex items-center w-full h-[180px] sm:h-[207px] shadow-sm" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #4a148c 30%, #7c3aed 70%, #a855f7 100%)' }}>
              <div className="relative p-4 sm:p-6 z-10 w-[45%] sm:w-[50%]">
                <h3 className="font-black text-[16px] sm:text-[22px] leading-tight mb-0.5">
                  <span className="text-[#FFB700]">BEST</span>
                </h3>
                <h3 className="text-white font-black text-[16px] sm:text-[22px] leading-tight mb-1">DEALS</h3>
                <p className="text-white text-[11px] sm:text-[13px] mb-2 sm:mb-3">OF THE WEEK</p>
                <span className="inline-block bg-black text-white text-[10px] sm:text-[11px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded hover:bg-gray-800 transition-colors">
                  Shop Now
                </span>
              </div>
              <img
                src="/images/best deals.png"
                alt=""
                aria-hidden="true"
                className="absolute right-0 bottom-0 h-full w-[58%] sm:w-[55%] object-contain object-right-bottom"
                loading="lazy"
              />
            </Link>

            <Link to="/shop" className="rounded-[10px] overflow-hidden relative flex items-center w-full h-[180px] sm:h-[207px] shadow-sm" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #b45309 30%, #f59e0b 60%, #fbbf24 100%)' }}>
              <div className="relative p-4 sm:p-6 z-10 w-[45%] sm:w-[50%]">
                <h3 className="text-white font-black text-[16px] sm:text-[22px] leading-tight mb-0.5">SAVE MORE</h3>
                <h3 className="text-white font-black text-[16px] sm:text-[22px] leading-tight mb-1">EVERYDAY</h3>
                <p className="text-white/80 text-[11px] sm:text-[12px] mb-2 sm:mb-3">Great products at unbeatable prices</p>
                <span className="inline-block bg-black text-white text-[10px] sm:text-[11px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded hover:bg-gray-800 transition-colors">
                  Shop Now
                </span>
              </div>
              <img
                src="/images/save more.png"
                alt=""
                aria-hidden="true"
                className="absolute right-0 bottom-0 h-full w-[58%] sm:w-[55%] object-contain object-right-bottom"
                loading="lazy"
              />
            </Link>

            <Link to="/shop?newArrival=true" className="rounded-[10px] overflow-hidden relative flex items-center w-full h-[180px] sm:h-[207px] shadow-sm" style={{ background: 'linear-gradient(135deg, #831843 0%, #be185d 30%, #ec4899 60%, #f9a8d4 100%)' }}>
              <div className="relative p-4 sm:p-6 z-10 w-[45%] sm:w-[50%]">
                <h3 className="text-white font-black text-[16px] sm:text-[22px] leading-tight mb-0.5">BEAUTY</h3>
                <h3 className="text-white font-black text-[16px] sm:text-[22px] leading-tight mb-1">DEALS</h3>
                <p className="text-white/80 text-[11px] sm:text-[12px] mb-2 sm:mb-3">Glow more, save more!</p>
                <span className="inline-block bg-black text-white text-[10px] sm:text-[11px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded hover:bg-gray-800 transition-colors">
                  Shop Now
                </span>
              </div>
              <img
                src="/images/beauty.png"
                alt=""
                aria-hidden="true"
                className="absolute right-0 bottom-0 h-full w-[58%] sm:w-[55%] object-contain object-right-bottom"
                loading="lazy"
              />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white" aria-labelledby="popular-heading">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <SectionHeader title="Popular Products" />
          <h2 id="popular-heading" className="sr-only">Popular Products</h2>
          {popular.length > 0
            ? <ProductRow products={popular} label="Popular products" />
            : <ProductRowSkeleton />
          }
        </div>
      </section>

      <section className="py-8 bg-gray-50" aria-labelledby="new-arrivals-heading">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <SectionHeader title="New Arrivals" />
          <h2 id="new-arrivals-heading" className="sr-only">New Arrivals</h2>
          {homeNewArrivals.length > 0
            ? <ProductRow products={homeNewArrivals} label="New arrivals" />
            : <ProductRowSkeleton />
          }
        </div>
      </section>

      <section className="bg-white py-6" aria-labelledby="sub-banners-heading">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <h2 id="sub-banners-heading" className="sr-only">Shop by department</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/shop?category=home-appliances" className="rounded-[15px] overflow-hidden relative flex items-center w-full h-[110px] sm:h-[129px] shadow-sm bg-cover bg-center" style={{ backgroundImage: "url('/images/card%201.png')", backgroundColor: '#1E2A3A' }}>
              <div className="relative p-4 sm:p-5 z-10 w-[55%]">
                <h3 className="text-white font-black text-[13px] lg:text-[16px] leading-tight mb-0.5">PREMIUM HOME</h3>
                <p className="text-white font-black text-[13px] lg:text-[16px] leading-tight mb-0.5 sm:mb-1">APPLIANCES</p>
                <p className="text-white/70 text-[10px] lg:text-[11px] mb-1 sm:mb-2">For a smarter kitchen</p>
                <span className="inline-block bg-[#FFB700] text-black text-[9px] lg:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded hover:bg-amber-500 transition-colors">
                  Shop Now
                </span>
              </div>
            </Link>

            <Link to="/shop?category=electronics" className="rounded-[15px] overflow-hidden relative flex items-center w-full h-[110px] sm:h-[129px] shadow-sm bg-cover bg-center" style={{ backgroundImage: "url('/images/card2.png')", backgroundColor: '#1A1A2E' }}>
              <div className="relative p-4 sm:p-5 z-10 w-[55%]">
                <h3 className="text-white font-black text-[13px] lg:text-[16px] leading-tight mb-0.5">LATEST GADGETS</h3>
                <p className="text-[#FFB700] text-[10px] lg:text-[11px] font-bold mb-0.5">UP TO 45% OFF</p>
                <p className="text-white/60 text-[10px] lg:text-[11px] mb-1 sm:mb-2">Grab the best offers</p>
                <span className="inline-block bg-[#FFB700] text-black text-[9px] lg:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded hover:bg-amber-500 transition-colors">
                  Shop Now
                </span>
              </div>
            </Link>

            <Link to="/shop?category=beauty" className="rounded-[15px] overflow-hidden relative flex items-center w-full h-[110px] sm:h-[129px] shadow-sm bg-cover bg-center" style={{ backgroundImage: "url('/images/card3.png')", backgroundColor: '#F5D5C8' }}>
              <div className="relative p-4 sm:p-5 z-10 w-[55%]">
                <h3 className="text-[#8B2252] font-black text-[13px] lg:text-[16px] leading-tight mb-0.5">BEAUTY AND</h3>
                <p className="text-[#8B2252] font-black text-[13px] lg:text-[16px] leading-tight mb-0.5">PERSONAL CARE</p>
                <p className="text-[#8B2252]/80 text-[10px] lg:text-[11px] font-bold mb-0.5">UP TO 40% OFF</p>
                <p className="text-[#8B2252]/60 text-[10px] lg:text-[11px] mb-1 sm:mb-2">Look good, feel great</p>
                <span className="inline-block bg-[#FFB700] text-black text-[9px] lg:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded hover:bg-amber-500 transition-colors">
                  Shop Now
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50" aria-labelledby="beauty-heading">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <SectionHeader title="Beauty and Cosmetics" to="/shop?category=beauty" />
          <h2 id="beauty-heading" className="sr-only">Beauty and Cosmetics</h2>
          {beautyProducts.length > 0
            ? <ProductRow products={beautyProducts} label="Beauty and cosmetics products" />
            : <ProductRowSkeleton />
          }
        </div>
      </section>

      <section className="py-8 bg-white" aria-labelledby="electronics-heading">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <SectionHeader title="Electronic Appliances" to="/shop?category=electronics" />
          <h2 id="electronics-heading" className="sr-only">Electronic Appliances</h2>
          {electronicsProducts.length > 0
            ? <ProductRow products={electronicsProducts} label="Electronic appliances" />
            : <ProductRowSkeleton />
          }
        </div>
      </section>

      <section className="py-12 bg-white border-t border-gray-100" aria-labelledby="brands-heading">
        <div className="text-center mb-6 md:mb-8">
          <h2 id="brands-heading" className="text-xl md:text-[28px] font-black">
            <span className="text-black">Our Best </span>
            <span className="text-[#FFB700]">Sellers</span>
          </h2>
        </div>
        <div className="overflow-hidden relative" aria-hidden="true">
          <div
            className="flex items-center gap-[24.58px] whitespace-nowrap"
            style={{ animation: 'marquee 28s linear infinite' }}
          >
            {[...BRAND_LOGOS, ...BRAND_LOGOS].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-[39px] object-contain flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
          .transition-transform { transition: none !important; }
          .animate-spin         { animation: none !important; }
          .animate-pulse        { animation: none !important; }
        }
      `}</style>

    </Layout>
  );
}