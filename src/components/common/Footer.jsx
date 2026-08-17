import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Subscribed! You get 20% off your next order.');
    setEmail('');
  };

  return (
    <footer className="bg-[#171C26] text-gray-400 font-sans">

      {/* TOP NEWSLETTER BANNER */}
      <div className="relative overflow-hidden py-6 md:py-0 md:h-[150px]" style={{ background: '#758688' }}>
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 h-full flex items-center justify-between relative gap-6">

          {/* Headline Text */}
          <div className="flex-shrink-0 text-left py-4 md:py-0">
            <p className="text-white font-bold text-[12px] sm:text-[13px] md:text-[14px] tracking-wide mb-0.5">
              Stay Updated with Us
            </p>
            <h3 className="text-white font-black leading-tight mb-0.5 text-[20px] sm:text-[26px] md:text-[32px]">
              Get <span className="text-[#FFB700]">20% Off</span> Discount Coupon
            </h3>
            <p className="text-white font-bold text-[11px] sm:text-[13px] md:text-[14px]">
              by Subscribe our Newsletter
            </p>
          </div>

          {/* Newsletter Form */}
          <form
            onSubmit={handleNewsletter}
            className="hidden sm:flex items-center w-full max-w-[280px] lg:max-w-[320px] flex-shrink-0"
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              aria-label="Email address"
              className="flex-1 min-w-0 px-3.5 py-2.5 text-[12px] text-[#1A1A1A] placeholder-gray-400 bg-white outline-none rounded-l-md border-0"
            />
            <button
              type="submit"
              className="bg-[#FFB700] text-black text-[12px] font-bold px-5 py-2.5 rounded-r-md hover:bg-amber-500 transition-colors whitespace-nowrap"
            >
              Subscribe Now
            </button>
          </form>

          {/* Decorative Images */}
          <div className="flex items-center flex-shrink-0 pointer-events-none select-none relative" aria-hidden="true">
            <img src="/images/arrow.png" alt="" className="hidden md:block w-[60px] lg:w-[90px] h-auto object-contain -mr-2 z-10" />
            <img src="/images/headphone.png" alt="" className="h-[80px] sm:h-[110px] md:h-[165px] w-auto object-contain z-10 -mb-2 md:-mb-4" />
            <img src="/images/newsletter-email.png" alt="" className="w-[30px] sm:w-[45px] md:w-[60px] h-auto object-contain ml-2 md:ml-4" />
          </div>

        </div>
      </div>

      {/* MAIN FOOTER CONTENT - PRECISE HORIZONTAL & VERTICAL LAYOUT */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-4 items-start">

          {/* COLUMN 1: BRAND INFO (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full">
            <div>
              {/* Row 1 Top Baseline: Logo Emblem & Title */}
              <div className="flex items-center gap-3 mb-5">
                <img src="/images/logo-emblem-449bab.png" alt="House of Cambridge" className="h-10 md:h-12 w-auto object-contain" />
                <span className="font-serif text-[#d2aa50] text-[18px] md:text-[20px] font-semibold leading-tight">
                  House Of Cambridge
                </span>
              </div>

              {/* Rows 2-4: Paragraph Content */}
              <p className="text-[12px] md:text-[13px] leading-[1.6] text-white/90 max-w-xs mb-6">
                We are more than just an online store;<br />
                we are a platform built to deliver quality,<br />
                convenience, and trust.
              </p>
            </div>

            {/* Row 6 Bottom Baseline: Shop with confidence */}
            <p className="text-[#FFB700] text-[13px] md:text-[14px] font-semibold mt-auto pt-1">
              Shop with confidence!
            </p>
          </div>

          {/* COLUMN 2: ABOUT LINKS (2 Columns) */}
          <div className="lg:col-span-2">
            {/* Row 1 Top Baseline: ABOUT Heading */}
            <h4 className="text-[#FFB700] text-[13px] md:text-[14px] font-bold mb-5 uppercase tracking-wider leading-none pt-2">
              ABOUT
            </h4>

            {/* Rows 2-5: Nav Links */}
            <ul className="space-y-3 text-[12px] md:text-[13px]">
              <li><Link to="/about" className="text-white hover:text-[#FFB700] transition-colors">About Us</Link></li>
              <li><Link to="/privacy-policy" className="text-white hover:text-[#FFB700] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/return-policy" className="text-white hover:text-[#FFB700] transition-colors">Return and Refund Policy</Link></li>
              <li><Link to="/terms" className="text-white hover:text-[#FFB700] transition-colors">Terms and Conditions</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: HELP LINKS (3 Columns) */}
          <div className="lg:col-span-3 pt-2">
            <h4 className="text-[#FFB700] text-[13px] md:text-[14px] font-bold mb-5 uppercase tracking-wider leading-none">
              HELP
            </h4>
            <ul className="space-y-3 text-[12px] md:text-[13px]">
              <li><Link to="/faq" className="text-white hover:text-[#FFB700] transition-colors">Frequently Asked Questions</Link></li>
              <li><Link to="/how-to-buy" className="text-white hover:text-[#FFB700] transition-colors">How To Buy</Link></li>
              <li><Link to="/contact" className="text-white hover:text-[#FFB700] transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/orders" className="text-white hover:text-[#FFB700] transition-colors">Return Products</Link></li>
            </ul>
          </div>

          {/* COLUMN 4: CONTACT US (3 Columns) */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full px-2 lg:px-0">
            <div>
              {/* Row 1 Top Baseline: CONTACT US Heading */}
              <h4 className="text-[#FFB700] text-[13px] md:text-[14px] font-bold mb-5 uppercase tracking-wider leading-none pt-2">
                CONTACT US
              </h4>

              {/* Rows 2-5: Contact details */}
              <ul className="space-y-3 text-[12px] md:text-[13px]">
                <li className="flex items-center gap-2.5">
                  <Icon icon="mdi:whatsapp" width={16} className="text-green-500 shrink-0" aria-hidden="true" />
                  <a href="https://wa.me/94764604227" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFB700] transition-colors">
                    076 460 4227
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Icon icon="mdi:phone" width={16} className="text-amber-500 shrink-0" aria-hidden="true" />
                  <a href="tel:+94112847846" className="text-white hover:text-[#FFB700] transition-colors">
                    0112 847 846
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Icon icon="mdi:email" width={16} className="text-amber-500 shrink-0" aria-hidden="true" />
                  <a href="mailto:info@houseofcambridge.co.uk" className="text-white hover:text-[#FFB700] transition-colors break-all">
                    info@houseofcambridge.co.uk
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon icon="mdi:map-marker" width={16} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-white">No 63 Old Road, Pannipitiya</span>
                </li>
              </ul>
            </div>

            {/* Row 6 Bottom Baseline: Social Icons */}
            <div className="flex items-center gap-3 mt-6 lg:mt-auto pt-1" aria-label="Social media links">
              <a
                href="https://www.facebook.com/share/1EvLTYix5L/?mibextid=wwXIfr"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Icon icon="logos:facebook" width={20} />
              </a>
              <a
                href="https://www.instagram.com/houseofcambridge.lk?igsh=MXIzcjV5anhtMGYyMA=="
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Icon icon="skill-icons:instagram" width={18} />
              </a>
              <a
                href="https://www.tiktok.com/@houseofcambridge1"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
                  <Icon icon="logos:tiktok-icon" width={12} />
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>
      {/* COPYRIGHT BOTTOM BAR */}
      <div className="border-t border-white/10 max-w-[1280px] mx-auto px-4 py-4 text-center text-xs text-gray-400">
        <span>©2026 Developed by Lee Harvey. All rights reserved.</span>
      </div>
    </footer>
  );
}
