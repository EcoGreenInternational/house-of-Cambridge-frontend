import { useBanners, BannerButton, SmartLink } from './bannerUtils.jsx';
import { ChristmasBackdrop, PineFrame } from '../christmas/Scenes.jsx';

/**
 * A row of banner cards managed from Admin → Banners.
 * Shows `fallback` (the built-in design) when no banners exist for this section.
 */
export default function ManagedBanners({ placement, fallback, heightClass, radiusClass = 'rounded-[10px]' }) {
  const { banners, loaded } = useBanners(placement);

  if (!loaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${heightClass} ${radiusClass} bg-gray-100 animate-pulse`} />
        ))}
      </div>
    );
  }
  if (!banners.length) return fallback;

  const cols = banners.length === 1 ? 'md:grid-cols-1' : banners.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 ${cols} gap-4`}>
      {banners.map((b) => {
        const isXmas = b.background === 'christmas';
        const target = b.link || b.buttons?.[0]?.link || '/shop';
        const showText = b.showText !== false && (b.title || b.subtitle || b.buttons?.length);
        return (
          <div
            key={b._id}
            className={`relative overflow-hidden shadow-sm bg-cover bg-center ${heightClass} ${radiusClass}`}
            style={!isXmas && b.image?.url ? { backgroundImage: `url(${b.image.url})` } : undefined}
          >
            {isXmas && <ChristmasBackdrop />}
            {(isXmas || b.christmasFrame) && <PineFrame compact sides={['right']} />}
            <SmartLink to={target} className="absolute inset-0 z-[1]" aria-label={b.title || 'Open offer'} />
            {showText && (
              <div className="relative z-[2] h-full flex flex-col justify-center p-4 sm:p-6 max-w-[62%] pointer-events-none">
                {b.title && <h3 className="text-white font-black text-[16px] sm:text-[22px] leading-tight drop-shadow">{b.title}</h3>}
                {b.subtitle && <p className="text-white/90 text-[11px] sm:text-[13px] mt-1 drop-shadow">{b.subtitle}</p>}
                {b.buttons?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-3 pointer-events-auto">
                    {b.buttons.map((btn, i) => <BannerButton key={i} button={btn} size="sm" />)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
