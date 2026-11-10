import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiX, FiShoppingBag, FiTag, FiGift, FiZap } from 'react-icons/fi';

const CONFETTI_COLORS = ['#FFB700', '#FF8C00', '#FFFFFF', '#F7D794', '#E67E22', '#F1C40F'];
const SNOWFLAKES = ['❄', '❅', '❆', '•', '✦'];

const API_BASE = import.meta.env.VITE_API_URL ;

export default function ElevenElevenPopup() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(true);
  const [campaign, setCampaign] = useState({
    isEnabled: true,
    theme: '11_11',
    campaignName: '11:11 Mega Sale',
    badgeText: '11:11 MEGA SHOPPING FESTIVAL',
    heading: '11 : 11',
    subheading: 'BIGGEST SALE OF THE YEAR',
    discountPercent: 5,
    greetingText: 'Applied automatically on EVERY product across the entire store!',
    ctaText: 'Claim 5% OFF & Shop Now',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchCampaign = async () => {
      try {
        const res = await axios.get(`${API_BASE}/products/campaign-popup`);
        if (res.data?.success && res.data.campaign && isMounted) {
          setCampaign(res.data.campaign);
        }
      } catch {
        // Fallback to defaults
      }
    };
    fetchCampaign();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!campaign.isEnabled) return;
    try {
      const dismissed = sessionStorage.getItem('hoc_campaign_popup_dismissed');
      if (!dismissed) {
        setHasDismissed(false);
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable fallback
    }
  }, [campaign.isEnabled]);

  const handleDismiss = () => {
    setIsOpen(false);
    setHasDismissed(true);
    try {
      sessionStorage.setItem('hoc_campaign_popup_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleShopNow = () => {
    handleDismiss();
    navigate('/shop');
  };

  const handleReopen = () => {
    setIsOpen(true);
  };

  if (!campaign.isEnabled) return null;

  const isChristmas = campaign.theme === 'christmas';
  const isNewYear = campaign.theme === 'new_year';
  const is1111 = campaign.theme === '11_11';

  return (
    <>
      {/* Floating Celebration Pill on bottom-left */}
      {hasDismissed && !isOpen && (
        <button
          type="button"
          onClick={handleReopen}
          className={`fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer font-bold text-[12px] group border-2 ${
            isChristmas
              ? 'bg-[#1E0505] text-[#FFD700] border-[#D32F2F] shadow-rose-950/50'
              : isNewYear
              ? 'bg-[#0B132B] text-[#64DFDF] border-[#48CAE4] shadow-cyan-950/50'
              : 'bg-[#1A1A1A] text-[#FFB700] border-[#FFB700] shadow-black/50'
          }`}
          aria-label={`Open ${campaign.campaignName} Banner`}
        >
          <span className="animate-bounce">
            {isChristmas ? '🎄' : isNewYear ? '✨' : '🎉'}
          </span>
          <span className="font-black tracking-wider uppercase">
            {campaign.campaignName || 'SPECIAL SALE'}
          </span>
          {campaign.discountPercent > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                isChristmas
                  ? 'bg-[#D32F2F] text-white'
                  : isNewYear
                  ? 'bg-[#48CAE4] text-[#0B132B]'
                  : 'bg-[#FFB700] text-[#1A1A1A]'
              }`}
            >
              {campaign.discountPercent}% OFF
            </span>
          )}
        </button>
      )}

      {/* Main Popup Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={campaign.campaignName}
        >
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
              20% { opacity: 1; }
              100% { transform: translateY(520px) rotate(720deg); opacity: 0; }
            }
            @keyframes snow-fall {
              0% { transform: translateY(-20px) translateX(-10px); opacity: 0; }
              20% { opacity: 0.9; }
              50% { transform: translateY(220px) translateX(15px); }
              100% { transform: translateY(520px) translateX(-10px); opacity: 0.1; }
            }
            @keyframes gold-pulse {
              0%, 100% { box-shadow: 0 0 25px rgba(255, 183, 0, 0.35), inset 0 0 15px rgba(255, 183, 0, 0.15); }
              50% { box-shadow: 0 0 45px rgba(255, 140, 0, 0.6), inset 0 0 25px rgba(255, 140, 0, 0.25); }
            }
            @keyframes christmas-glow {
              0%, 100% { box-shadow: 0 0 30px rgba(211, 47, 47, 0.4), inset 0 0 20px rgba(27, 94, 32, 0.2); }
              50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.5), inset 0 0 25px rgba(211, 47, 47, 0.3); }
            }
            @keyframes scale-in {
              0% { transform: scale(0.85); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>

          {/* Modal Card */}
          <div
            className={`relative w-full max-w-lg rounded-[26px] p-6 sm:p-8 text-center overflow-hidden shadow-2xl border-2 ${
              isChristmas
                ? 'bg-gradient-to-b from-[#3a0808] via-[#1a0505] to-[#0d1a10] border-[#D32F2F] text-white'
                : isNewYear
                ? 'bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B] border-[#48CAE4] text-white'
                : 'bg-gradient-to-b from-[#222222] via-[#1A1A1A] to-[#121212] border-[#FFB700] text-white'
            }`}
            style={{
              animation: `${isChristmas ? 'christmas-glow' : 'gold-pulse'} 3.5s infinite ease-in-out, scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)`,
            }}
          >
            {/* Animated Festive Particles (Snow for Christmas, Confetti for 11:11) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {isChristmas
                ? Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute text-white/70 select-none"
                      style={{
                        left: `${(i * 17) % 96}%`,
                        top: '-15px',
                        fontSize: `${10 + (i % 4) * 5}px`,
                        animation: `snow-fall ${3 + (i % 5) * 0.8}s ease-in-out infinite`,
                        animationDelay: `${(i % 6) * 0.45}s`,
                      }}
                    >
                      {SNOWFLAKES[i % SNOWFLAKES.length]}
                    </span>
                  ))
                : Array.from({ length: 20 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute w-2 h-2 rounded-full opacity-0"
                      style={{
                        backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                        left: `${(i * 19) % 96}%`,
                        top: '-10px',
                        animation: `confetti-fall ${2.5 + (i % 4) * 0.6}s linear infinite`,
                        animationDelay: `${(i % 5) * 0.4}s`,
                        width: `${4 + (i % 3) * 3}px`,
                        height: `${4 + (i % 3) * 3}px`,
                      }}
                    />
                  ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <FiX size={18} />
            </button>

            {/* Header Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-3 border ${
                isChristmas
                  ? 'bg-rose-950/60 border-rose-500/50 text-amber-300'
                  : isNewYear
                  ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300'
                  : 'bg-[#FFB700]/15 border-[#FFB700]/40 text-[#FFB700]'
              }`}
            >
              <span>{isChristmas ? '🎄' : isNewYear ? '✨' : <FiZap className="animate-pulse inline" size={13} />}</span>
              <span>{campaign.badgeText || 'SPECIAL FESTIVAL'}</span>
              <span>{isChristmas ? '🎁' : isNewYear ? '🥂' : <FiGift size={13} className="inline" />}</span>
            </div>

            {/* Typography Heading Banner */}
            <div className="relative my-2">
              <h2
                className={`font-black text-[46px] sm:text-[62px] leading-tight tracking-tight filter ${
                  isChristmas
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFFFFF] to-[#FF8C00] drop-shadow-[0_4px_16px_rgba(211,47,47,0.5)]'
                    : isNewYear
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#48CAE4] via-[#FFFFFF] to-[#90E0EF]'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFB700] via-[#FFA500] to-[#FF8C00] drop-shadow-[0_4px_12px_rgba(255,183,0,0.35)]'
                }`}
              >
                {campaign.heading || 'SPECIAL OFFER'}
              </h2>
              {campaign.subheading && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span
                    className={`h-[2px] w-12 bg-gradient-to-r from-transparent ${
                      isChristmas ? 'to-[#FFD700]' : 'to-[#FFB700]'
                    }`}
                  />
                  <span
                    className={`text-[13px] sm:text-[15px] font-bold tracking-widest uppercase ${
                      isChristmas ? 'text-amber-200' : 'text-amber-200'
                    }`}
                  >
                    {campaign.subheading}
                  </span>
                  <span
                    className={`h-[2px] w-12 bg-gradient-to-l from-transparent ${
                      isChristmas ? 'to-[#FFD700]' : 'to-[#FFB700]'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Offer / Greeting Card */}
            <div
              className={`my-5 p-4 rounded-[18px] border shadow-inner ${
                isChristmas
                  ? 'bg-[#180303]/90 border-rose-500/30'
                  : isNewYear
                  ? 'bg-[#080E21]/90 border-cyan-500/30'
                  : 'bg-[#141414]/90 border-[#FFB700]/30'
              }`}
            >
              {campaign.discountPercent > 0 && (
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <FiTag className={isChristmas ? 'text-[#FFD700]' : 'text-[#FFB700]'} size={24} />
                  <span className="text-[28px] sm:text-[32px] font-black leading-tight text-white">
                    FLAT <span className={isChristmas ? 'text-[#FFD700]' : 'text-[#FFB700]'}>{campaign.discountPercent}% OFF</span>
                  </span>
                </div>
              )}
              <p className="text-[13px] text-zinc-200 font-medium leading-relaxed">
                {campaign.greetingText || 'Enjoy our exclusive celebration discounts across all products!'}
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleShopNow}
                className={`w-full py-3.5 px-6 rounded-[14px] font-black text-[15px] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer uppercase tracking-wider active:scale-[0.99] hover:brightness-110 ${
                  isChristmas
                    ? 'bg-gradient-to-r from-[#D32F2F] via-[#E53935] to-[#B71C1C] text-white shadow-rose-900/40 border border-amber-300/40'
                    : isNewYear
                    ? 'bg-gradient-to-r from-[#48CAE4] to-[#0077B6] text-[#0B132B] shadow-cyan-500/30'
                    : 'bg-gradient-to-r from-[#FFB700] to-[#FF8C00] text-[#1A1A1A] shadow-[#FFB700]/25'
                }`}
              >
                <FiShoppingBag size={18} />
                {campaign.ctaText || 'Shop Celebration Deals Now'}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-[12px] text-white/50 hover:text-white/80 transition-colors font-medium underline underline-offset-2"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
