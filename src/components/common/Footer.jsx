import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook } from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaTiktok } from 'react-icons/fa6';
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

            <div className="relative h-[159px] w-[140px] flex-shrink-0 pointer-events-none select-none" aria-hidden="true">
              <img src="/images/newsletter-product.png" alt="" className="absolute bottom-0 w-full object-contain object-bottom" />
              <img src="/images/newsletter-headphones.png" alt="" className="absolute top-[10px] right-0 w-[45px] h-[50px] object-contain" />
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-white/5">

        <div>
          <div className="mb-4">
            <img src="/images/logo.png" alt="House of Cambridge" className="h-10 w-auto object-contain" />
          </div>
          <p className="text-sm leading-relaxed text-gray-400 mb-4">
            We are more than just an online store; we are a platform built to deliver quality, convenience, and trust.
          </p>
          <p className="text-[#FFB700] text-sm font-semibold mb-4">Shop with confidence!</p>
          <div className="flex items-center gap-2" aria-label="Social media links">
            <a
              href="https://www.facebook.com/share/1EvLTYix5L/?mibextid=wwXIfr"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#FFB700] hover:text-black text-gray-400 transition-all"
            >
              <FiFacebook size={14} />
            </a>
            <a
              href="https://www.instagram.com/houseofcambridge"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#FFB700] hover:text-black text-gray-400 transition-all"
            >
              <FiInstagram size={14} />
            </a>
            <a
              href="https://www.tiktok.com/@houseofcambridge1"
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#010101] hover:text-white text-gray-400 transition-all"
            >
              <FaTiktok size={14} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about"          className="hover:text-[#FFB700] transition-colors">About Us</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-[#FFB700] transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms"          className="hover:text-[#FFB700] transition-colors">Terms and Conditions</Link></li>
            <li><Link to="/contact"        className="hover:text-[#FFB700] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/faq"         className="hover:text-[#FFB700] transition-colors">FAQ</Link></li>
            <li><Link to="/flash-sale"  className="hover:text-[#FFB700] transition-colors">Flash Sale</Link></li>
            <li><Link to="/track-order" className="hover:text-[#FFB700] transition-colors">Track My Order</Link></li>
            <li><Link to="/orders"      className="hover:text-[#FFB700] transition-colors">My Orders</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <FiPhone size={13} className="text-[#FFB700] shrink-0" aria-hidden="true" />
              <a href="tel:0764604227" className="hover:text-[#FFB700] transition-colors">076 460 4227</a>
            </li>
            <li className="flex items-center gap-2.5">
              <FiPhone size={13} className="text-[#FFB700] shrink-0" aria-hidden="true" />
              <a href="tel:0112847846" className="hover:text-[#FFB700] transition-colors">0112 847 846</a>
            </li>
            <li className="flex items-center gap-2.5">
              <FiMail size={13} className="text-[#FFB700] shrink-0" aria-hidden="true" />
              <a href="mailto:info@houseofcambridge.co.uk" className="hover:text-[#FFB700] transition-colors break-all">
                info@houseofcambridge.co.uk
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <FiMapPin size={13} className="text-[#FFB700] shrink-0 mt-0.5" aria-hidden="true" />
              <span>No 63 Old Road, Pannipitiya</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-600">
        <span>©2026 Developed by Lee Harvey. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy-policy" className="hover:text-[#FFB700] transition-colors">Privacy</Link>
          <Link to="/terms"          className="hover:text-[#FFB700] transition-colors">Terms</Link>
          <Link to="/faq"            className="hover:text-[#FFB700] transition-colors">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}