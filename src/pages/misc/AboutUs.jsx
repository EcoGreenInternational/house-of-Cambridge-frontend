import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { FiTruck, FiShield, FiCheck, FiHeadphones, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

const SERVICES = [
  { icon: FiTruck, title: 'Fast Delivery', desc: 'Islandwide delivery\nto your doorstep' },
  { icon: FiShield, title: 'Secure Payments', desc: '100% secure online\npayments' },
  { icon: FiCheck, title: 'Genuine Products', desc: 'Original products\nfrom trusted brands' },
  { icon: FiHeadphones, title: 'Customer Support', desc: 'Friendly support\n24/7' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: 'Hassle-free returns\nwithin 30 days' },
];

const TESTIMONIALS = [
  {
    name: 'Prasanna Dalugoda',
    location: 'Colombo, Sri Lanka',
    date: '21 Feb 2025',
    rating: 5,
    text: 'HOC has transformed my shopping experience! The product quality is exceptional and the delivery service is incredibly fast. I especially love their customer support team who are always ready to help. Highly recommended for anyone looking for reliable online shopping in Sri Lanka!',
  },
  {
    name: 'Chathuranga Madushan',
    location: 'Athurugiriya, Sri Lanka',
    date: '11 March 2025',
    rating: 5,
    text: "As a regular customer of HOC, I'm consistently impressed by their wide range of products and competitive prices. The website is user-friendly and makes shopping a breeze. Their secure payment system gives me peace of mind with every purchase. Outstanding service!",
  },
  {
    name: 'Sasindu Kavishka',
    location: 'Rathnapura, Sri Lanka',
    date: '12 Oct 2025',
    rating: 5,
    text: "HOC is my go-to platform for all my shopping needs. The product descriptions are accurate, and the quality always exceeds my expectations. Their return policy is hassle-free, and customer service is top-notch. Best e-commerce platform in Sri Lanka!",
  },
];

const ACHIEVEMENTS = [
  { value: '5,000+', label: 'Products' },
  { value: '10,000+', label: 'Happy Customers' },
  { value: '50+', label: 'Trusted Brands' },
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

const VALUE_BADGES = [
  { icon: '🎁', title: 'Curated Products', desc: 'Hand-picked quality items' },
  { icon: '💰', title: 'Great Prices', desc: 'Best deals guaranteed' },
  { icon: '🔒', title: 'Safe & Secure', desc: '100% secure checkout' },
  { icon: '❤️', title: 'Customer Focused', desc: '24/7 dedicated support' },
];

function SectionHeading({ yellow, rest }) {
  return (
    <h2 className="text-[32px] font-black leading-tight mb-4">
      <span className="text-[#FFB700]">{yellow}</span>
      <span className="text-[#1A1A1A]">{rest}</span>
    </h2>
  );
}

export default function AboutUs() {
  return (
    <Layout>
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FEF9EE 0%, #FFF8E7 40%, #FFFDF8 70%, #FFFFFF 100%)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-14 flex items-center gap-10">
          <div className="flex-1 max-w-[580px]">
            <span className="inline-block text-[#FFB700] font-bold text-[15px] tracking-widest uppercase mb-4">
              ABOUT US
            </span>
            <h1 className="text-[42px] font-black text-[#1A1A1A] leading-tight mb-4">
              Your Trusted Partner<br />
              <span className="text-[#FFB700]">For Quality</span> And Value
            </h1>
            <p className="text-[15px] text-[#60717B] leading-relaxed mb-6 max-w-[480px]">
              House of Cambridge (HOC) is Sri Lanka's premier e-commerce platform, offering customers a one-stop
              destination for high-quality products, unbeatable prices, and a seamless online shopping experience.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#FFB700] text-black font-bold text-[14px] px-7 py-3 rounded-full hover:bg-amber-500 transition-colors"
            >
              Discover our Shop <FiArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center" aria-hidden="true">
            <img
              src="/images/aboutusmain.png"
              alt=""
              className="w-full max-w-[500px] h-auto object-contain"
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]" aria-hidden="true">
          <svg viewBox="0 0 1280 48" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 fill-white">
            <path d="M0,48 C320,0 960,0 1280,48 L1280,48 L0,48 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]} />
      </div>

      <section className="max-w-[1280px] mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <img
            src="/images/about/about-who-we-are.png"
            alt="Our team at House of Cambridge"
            className="w-full max-w-[540px] rounded-[14px] object-cover shadow-lg"
          />
        </div>
        <div>
          <SectionHeading yellow="Who " rest="We Are" />
          <p className="text-[14px] text-[#60717B] leading-relaxed mb-4">
            House of Cambridge (HOC) is a leading online shopping destination in Sri Lanka, offering a wide range of
            trusted products across beauty, electronics, home appliances, baby care, and more. Our vision is to
            revolutionize digital retail in Sri Lanka — we bring together quality products, competitive prices, and
            outstanding customer service all in one convenient platform.
          </p>
          <p className="text-[14px] text-[#60717B] leading-relaxed mb-8">
            At HOC, we understand the evolving needs of modern shoppers. Our mission is to make quality products
            accessible to everyone across Sri Lanka through a seamless, secure, and user-friendly online marketplace.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {VALUE_BADGES.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-3 bg-[#FFFBF0] border border-[#FFE8A0] rounded-[10px] p-3"
              >
                <span className="text-xl" aria-hidden="true">{b.icon}</span>
                <div>
                  <p className="text-[12px] font-bold text-[#1A1A1A]">{b.title}</p>
                  <p className="text-[11px] text-[#60717B]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAFAFA] py-14" aria-labelledby="why-choose-heading">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-10">
            <h2
              id="why-choose-heading"
              className="text-[32px] font-black leading-tight mb-4"
            >
              <span className="text-[#FFB700]">Why </span>
              <span className="text-[#1A1A1A]">Choose Us</span>
            </h2>
            <p className="text-[14px] text-[#60717B]">We make shopping easy, safe, and enjoyable — every time.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="bg-white border border-[#E9E9E9] rounded-[14px] shadow-[2px_3px_6px_rgba(0,0,0,0.07)] p-5 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <s.icon size={20} className="text-[#FFB700]" aria-hidden="true" />
                </div>
                <p className="text-[13px] font-bold text-[#FFB700] mb-1">{s.title}</p>
                <p className="text-[11px] text-[#60717B] leading-snug whitespace-pre-line">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 py-14" aria-labelledby="testimonials-heading">
        <div className="text-center mb-10">
          <h2
            id="testimonials-heading"
            className="text-[32px] font-black leading-tight mb-4"
          >
            <span className="text-[#FFB700]">What </span>
            <span className="text-[#1A1A1A]">Our Customers Say</span>
          </h2>
          <p className="text-[14px] text-[#60717B]">Real experiences from real shoppers across Sri Lanka.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="bg-white border border-[#E9E9E9] rounded-[8px] p-5 relative shadow-[2px_3px_8px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
            >
              <span className="absolute top-3 right-4 text-[#FFB700] text-5xl font-serif leading-none opacity-25" aria-hidden="true">
                "
              </span>
              <div className="flex gap-0.5 mb-3" role="img" aria-label={`${t.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} size={12} className={s <= t.rating ? 'text-[#FFB700]' : 'text-gray-200'} aria-hidden="true" />
                ))}
              </div>
              <p className="text-[13px] text-[#60717B] leading-relaxed mb-4">{t.text}</p>
              <footer className="border-t border-gray-100 pt-3">
                <p className="text-[13px] font-bold text-[#1A1A1A]">{t.name}</p>
                <p className="text-[11px] text-[#60717B] mt-0.5">
                  <span>{t.location}</span>
                  <span aria-hidden="true"> · </span>
                  <time>{t.date}</time>
                </p>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#1A1A1A] py-14" aria-labelledby="achievements-heading">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <h2 id="achievements-heading" className="text-[30px] font-black text-white mb-2">
            <span className="text-[#FFB700]">Our </span>Achievements
          </h2>
          <p className="text-[14px] text-gray-400 mb-10">Numbers that tell our story.</p>
          <div className="grid grid-cols-3 gap-8 max-w-[700px] mx-auto">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.label} className="text-center">
                <p className="text-[48px] font-black text-[#FFB700] leading-none">{a.value}</p>
                <p className="text-[14px] text-gray-300 mt-2">{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden"
        style={{ background: 'rgba(252, 221, 142, 0.75)' }}
        aria-labelledby="cta-heading"
      >
        <div className="max-w-[1280px] mx-auto px-6 py-10 flex items-center gap-8">
          <img
            src="/images/about/about-cta-product-402c2d.png"
            alt=""
            aria-hidden="true"
            className="hidden md:block w-[200px] object-contain flex-shrink-0"
          />
          <div className="flex-1">
            <h2 id="cta-heading" className="text-[28px] font-black text-[#1A1A1A] mb-2">
              Start Shopping with Confidence
            </h2>
            <p className="text-[15px] text-[#60717B] mb-5">
              Quality products, Best prices, and Dedicated support — All in one place.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white font-bold text-[14px] px-7 py-3 rounded-[6px] hover:bg-black transition-colors"
            >
              Shop Now <FiArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white" aria-labelledby="brands-heading">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-8">
            <h2 id="brands-heading" className="text-[28px] font-black">
              <span className="text-[#FFB700]">Trusted By </span>
              <span className="text-[#1A1A1A]">Top Brands</span>
            </h2>
          </div>

          <div className="overflow-hidden relative" aria-hidden="true">
            <div
              className="flex items-center gap-10 whitespace-nowrap"
              style={{ animation: 'marquee 28s linear infinite' }}
            >
              {[...BRAND_LOGOS, ...BRAND_LOGOS].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-9 object-contain flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>
    </Layout>
  );
}