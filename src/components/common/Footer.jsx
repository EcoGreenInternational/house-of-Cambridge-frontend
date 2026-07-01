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
    <footer className="bg-[#171C26] text-gray-400">

      <div className="relative overflow-hidden h-[170px]" style={{ background: '#758688' }}>
        <div className="max-w-[1280px] mx-auto px-14 h-full flex items-center justify-between relative">

          <div className="flex-shrink-0">
            <p className="text-white font-black text-[14px] tracking-wide mb-0.5">Stay Updated with Us</p>
            <h3 className="text-white font-black leading-tight mb-0.5" style={{ fontSize: '34px' }}>
              Get <span className="text-[#FFB700]">20% Off</span> Discount Coupon
            </h3>
            <p className="text-white font-black text-[14px]">by Subscribe our Newsletter</p>
          </div>

          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <form onSubmit={handleNewsletter} className="flex items-center" aria-label="Newsletter signup">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                aria-label="Email address"
                className="w-44 px-3 py-2 text-[12px] text-[#1A1A1A] placeholder-gray-400 bg-white outline-none border-0 rounded-l-sm"
              />
              <button
                type="submit"
                className="bg-[#FFB700] text-black text-[12px] font-bold px-4 py-2 rounded-r-sm hover:bg-amber-500 transition-colors whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </form>

            <div className="flex items-center flex-shrink-0 pointer-events-none select-none" aria-hidden="true">
              <img src="/images/arrow.png" alt="" className="w-[100px] h-[100px] object-contain -mr-4 z-10 flex-shrink-0" />
              <img src="/images/headphone.png" alt="" className="h-[200px] w-auto object-contain flex-shrink-0" />
              <img src="/images/newsletter-email.png" alt="" className="w-[70px] h-[70px] object-contain ml-2 flex-shrink-0" />
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 border-b border-white/5">

        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src="/images/logo.png" alt="House of Cambridge" className="h-8 lg:h-10 w-auto object-contain" />
            <span className="text-white font-bold text-[14px] lg:text-[18px]">House Of Cambridge</span>
          </div>
          <p className="text-[12px] lg:text-[14px] leading-relaxed text-white mb-2">
            We are more than just an online store; we are a platform built to deliver quality, convenience, and trust.
          </p>
          <p className="text-[#FFB700] text-[12px] lg:text-[14px] font-semibold mb-4">Shop with confidence!</p>
        </div>

        <div>
          <h4 className="text-[#FFB700] text-[13px] lg:text-[14px] font-bold mb-3">ABOUT</h4>
          <ul className="space-y-2 text-[12px] lg:text-[13px]">
            <li><Link to="/about"          className="text-white hover:text-[#FFB700] transition-colors">About Us</Link></li>
            <li><Link to="/privacy-policy" className="text-white hover:text-[#FFB700] transition-colors">Privacy Policy</Link></li>
            <li><Link to="/return-policy"  className="text-white hover:text-[#FFB700] transition-colors">Return and Refund Policy</Link></li>
            <li><Link to="/terms"          className="text-white hover:text-[#FFB700] transition-colors">Terms and Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#FFB700] text-[13px] lg:text-[14px] font-bold mb-3">HELP</h4>
          <ul className="space-y-2 text-[12px] lg:text-[13px]">
            <li><Link to="/faq" className="text-white hover:text-[#FFB700] transition-colors">Frequently Asked Questions</Link></li>
            <li><Link to="/how-to-buy" className="text-white hover:text-[#FFB700] transition-colors">How To Buy</Link></li>
            <li><Link to="/shipping" className="text-white hover:text-[#FFB700] transition-colors">Shipping & Delivery</Link></li>
            <li><Link to="/warranty" className="text-white hover:text-[#FFB700] transition-colors">Warranty Information</Link></li>
            <li><Link to="/return-products" className="text-white hover:text-[#FFB700] transition-colors">Return Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#FFB700] text-[13px] lg:text-[14px] font-bold mb-3">CONTACT US</h4>
          <ul className="space-y-2 text-[12px] lg:text-[13px]">
            <li className="flex items-center gap-2">
              <Icon icon="mdi:whatsapp" width={14} className="text-green-500 shrink-0" aria-hidden="true" />
              <a href="https://wa.me/94764604227" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFB700] transition-colors">076 460 4227</a>
            </li>
            <li className="flex items-center gap-2">
              <Icon icon="mdi:phone" width={14} className="text-red-500 shrink-0" aria-hidden="true" />
              <a href="tel:+94112847846" className="text-white hover:text-[#FFB700] transition-colors">0112 847 846</a>
            </li>
            <li className="flex items-center gap-2">
              <Icon icon="mdi:email" width={14} className="text-yellow-500 shrink-0" aria-hidden="true" />
              <a href="mailto:info@houseofcambridge.co.uk" className="text-white hover:text-[#FFB700] transition-colors break-all">
                info@houseofcambridge.co.uk
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="mdi:map-marker" width={14} className="text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-white">No 63 Old Road, Pannipitiya</span>
            </li>
          </ul>
          <div className="flex items-center gap-3 mt-4" aria-label="Social media links">
            <a
              href="https://www.facebook.com/share/1EvLTYix5L/?mibextid=wwXIfr"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <Icon icon="mdi:facebook" width={14} className="text-white" />
            </a>
            <a
              href="https://www.instagram.com/houseofcambridge"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <Icon icon="mdi:instagram" width={14} className="text-white" />
            </a>
            <a
              href="https://www.tiktok.com/@houseofcambridge1"
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 bg-black rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <Icon icon="logos:tiktok-icon" width={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-4 text-center text-xs text-gray-500">
        <span>©2026 Developed by Lee Harvey. All rights reserved.</span>
      </div>
    </footer>
  );
}