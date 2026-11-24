import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useBanners, BannerButton, SmartLink } from './bannerUtils.jsx';
import useChristmasTheme from '../christmas/useChristmasTheme.js';
import { ChristmasBackdrop, HangingSnowflakes, PineFrame } from '../christmas/Scenes.jsx';
import '../christmas/christmas.css';
import './hero.css';

const HERO_INTERVAL = 5000;

// Shown only when no hero banners have been added in Admin → Banners.
const DEFAULT_SLIDES = [
  { title: 'House Of Cambridge', image: { url: '/images/hero-slide-1-7a4bbd.png' }, mobileImage: { url: '/images/hero-slide-1-mobile.png' } },
  { title: 'Beauty Deals — Glow More, Save More!', image: { url: '/images/hero-slide-2.png' }, mobileImage: { url: '/images/hero-slide-2-mobile.png' } },
  { title: 'Self Care Starts Here', image: { url: '/images/hero-slide-3-6a4322.png' }, mobileImage: { url: '/images/hero-slide-3-mobile.png' } },
].map((s) => ({ ...s, isDefault: true, background: 'image', showText: true, buttons: [{ label: 'Shop Now', link: '/shop', style: 'primary' }] }));

const CHRISTMAS_SLIDE = {
  background: 'christmas',
  showText: true,
  title: 'Merry Christmas',
  subtitle: 'Wrap up the perfect gifts for everyone you love',
  buttons: [
    { label: 'Shop Christmas Gifts', link: '/shop', style: 'christmas' },
    { label: 'Flash Deals', link: '/flash-sale', style: 'outline' },
  ],
};

const hasText = (s) => s.showText !== false && (s.title || s.subtitle || s.buttons?.length);

function ChristmasSlideText({ s, mobile }) {
  return (
    <div className={`relative z-10 h-full flex flex-col items-center justify-center text-center ${mobile ? 'px-6 pt-[86px] pb-12' : 'px-6 pt-10'}`}>
      {s.title && <h2 className={`hoc-hero-xmas-title ${mobile ? 'text-[34px]' : 'text-[64px]'}`}>{s.title}</h2>}
      {s.subtitle && (
        <p className={`text-[#fde7a6] font-medium mt-2 ${mobile ? 'text-[14px]' : 'text-[19px]'}`}>{s.subtitle}</p>
      )}
      {s.buttons?.length > 0 && (
        <div className={`flex flex-wrap justify-center gap-3 ${mobile ? 'mt-5' : 'mt-8'}`}>
          {s.buttons.map((b, i) => <BannerButton key={i} button={b} size={mobile ? 'sm' : 'md'} />)}
        </div>
      )}
    </div>
  );
}

function ImageSlideText({ s }) {
  return (
    <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-8 md:px-16 w-full min-h-[437px] flex items-center">
      <div className="max-w-xl">
        {s.title && (
          <div className="flex items-start gap-3">
            <span className="w-1 h-[44px] bg-[#FFB700] rounded-full flex-shrink-0 mt-1" aria-hidden="true" />
            <h2 className="text-white text-[36px] font-bold leading-[44px] drop-shadow">{s.title}</h2>
          </div>
        )}
        {s.subtitle && <p className="ml-4 mt-2 text-white/90 text-[17px] drop-shadow">{s.subtitle}</p>}
        {s.buttons?.length > 0 && (
          <div className="ml-4 mt-5 flex flex-wrap gap-3">
            {s.buttons.map((b, i) => <BannerButton key={i} button={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Slide({ s, christmas }) {
  const isXmas = s.background === 'christmas';
  const wholeLink = !s.buttons?.length && s.link;

  return (
    <div className="hoc-hero-fade relative">
      {/* Phones */}
      <div className="md:hidden relative overflow-hidden">
        {isXmas ? (
          <div className="relative min-h-[360px]">
            <ChristmasBackdrop />
            <PineFrame compact />
            <ChristmasSlideText s={s} mobile />
          </div>
        ) : (
          <>
            <img src={s.mobileImage?.url || s.image?.url} alt={s.title || 'Banner'} className="w-full h-auto object-cover block" />
            {s.christmasFrame && <PineFrame compact />}
            {hasText(s) && !s.isDefault && (
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-10 bg-gradient-to-t from-black/70 to-transparent">
                {s.title && <p className="text-white font-bold text-[18px] leading-tight">{s.title}</p>}
                {s.subtitle && <p className="text-white/85 text-[12px] mt-1">{s.subtitle}</p>}
                {s.buttons?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {s.buttons.map((b, i) => <BannerButton key={i} button={b} size="sm" />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tablets & desktops */}
      <div
        className="hidden md:block relative min-h-[437px] bg-cover bg-center overflow-hidden"
        style={!isXmas && s.image?.url ? { backgroundImage: `url(${s.image.url})` } : undefined}
        role={isXmas ? undefined : 'img'}
        aria-label={isXmas ? undefined : s.title || 'Banner'}
      >
        {isXmas ? (
          <>
            <ChristmasBackdrop />
            <PineFrame />
            <div className="relative min-h-[437px] flex">
              <div className="w-full">
                <ChristmasSlideText s={s} />
              </div>
            </div>
          </>
        ) : (
          <>
            {hasText(s) && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" aria-hidden="true" />}
            {s.christmasFrame && <PineFrame />}
            {hasText(s) && <ImageSlideText s={s} />}
          </>
        )}
      </div>

      {christmas && <HangingSnowflakes />}
      {wholeLink && <SmartLink to={s.link} className="absolute inset-0 z-[7]" aria-label={s.title || 'Open banner'} />}
    </div>
  );
}

/** Home page hero slider. Banners come from Admin → Banners; falls back to the built-in slides. */
export default function HeroCarousel() {
  const christmas = useChristmasTheme();
  const { banners, loaded } = useBanners('hero');
  const slides = useMemo(() => {
    if (banners.length) return banners;
    return christmas ? [CHRISTMAS_SLIDE, ...DEFAULT_SLIDES] : DEFAULT_SLIDES;
  }, [banners, christmas]);

  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const count = slides.length;

  const startAuto = useCallback(() => {
    clearInterval(timer.current);
    if (count > 1) timer.current = setInterval(() => setIndex((p) => (p + 1) % count), HERO_INTERVAL);
  }, [count]);

  useEffect(() => {
    setIndex(0);
    startAuto();
    return () => clearInterval(timer.current);
  }, [startAuto]);

  const go = (i) => {
    setIndex((i + count) % count);
    startAuto();
  };

  if (!loaded) {
    return <section className="bg-gray-900 min-h-[220px] md:min-h-[437px]" aria-label="Loading banners" />;
  }

  const cur = slides[Math.min(index, count - 1)];

  return (
    <section
      className="relative overflow-hidden bg-gray-900"
      aria-label="Promotional hero carousel"
      aria-roledescription="carousel"
    >
      <Slide key={`${cur._id || cur.title}-${index}`} s={cur} christmas={christmas} />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <Icon icon="mdi:chevron-left" width={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <Icon icon="mdi:chevron-right" width={20} aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" role="tablist" aria-label="Slide indicators">
            {slides.map((s, i) => (
              <button
                key={s._id || i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}${s.title ? `: ${s.title}` : ''}`}
                onClick={() => go(i)}
                className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full transition-all ${i === index ? 'bg-black' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
