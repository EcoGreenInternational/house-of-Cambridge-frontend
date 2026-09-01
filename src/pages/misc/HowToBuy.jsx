import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { Link } from 'react-router-dom';
import {
  FiShoppingBag,
  FiSearch,
  FiShoppingCart,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
  FiMessageCircle,
  FiHelpCircle,
} from 'react-icons/fi';

const STEPS = [
  {
    icon: FiSearch,
    title: 'Find your product',
    text: 'Use the search bar, browse categories, or open a product page to view photos, features, prices, and stock availability.',
  },
  {
    icon: FiShoppingCart,
    title: 'Add to cart or buy now',
    text: 'Choose your quantity and click Add to Cart. If you are ready to order immediately, use the Buy Now option where available.',
  },
  {
    icon: FiShoppingBag,
    title: 'Review your cart',
    text: 'Check item quantities, delivery charges, and any available discounts before continuing to checkout.',
  },
  {
    icon: FiCreditCard,
    title: 'Complete checkout',
    text: 'Enter your shipping details, choose a payment method, and confirm your order. Guest checkout is available for a faster purchase.',
  },
  {
    icon: FiTruck,
    title: 'Wait for delivery',
    text: 'After payment confirmation, we process and dispatch your order. You will receive updates as your parcel moves forward.',
  },
  {
    icon: FiCheckCircle,
    title: 'Track or follow up',
    text: 'Use your order reference to track progress, or contact us if you need help with delivery, returns, or product questions.',
  },
];

const TIPS = [
  'Create an account to save addresses, track orders, and manage your wishlist more easily.',
  'Keep your phone number and email address accurate so you receive order confirmations and delivery updates.',
  'If you need help before ordering, message us on WhatsApp or review the FAQ page first.',
];

export default function HowToBuy() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Pages', href: '#' }, { label: 'How To Buy' }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-14">
        <section className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
          <div className="bg-[#F5F5F5] px-6 md:px-8 py-8 md:py-10 flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#FFB700] text-[11px] font-bold uppercase tracking-wider mb-4">
                <FiHelpCircle size={12} aria-hidden="true" />
                Shopping guide
              </div>
              <h1 className="text-[30px] md:text-[38px] font-black text-[#1A1A1A] leading-tight mb-3">
                How To Buy from House of Cambridge
              </h1>
              <p className="text-[13px] md:text-[14px] text-[#60717B] leading-relaxed max-w-xl mb-5">
                Follow these simple steps to find products, place an order, and complete payment with confidence.
                If you need help at any point, our support channels are always available.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-[#FFB700] text-black text-[13px] font-bold hover:bg-amber-500 transition-colors"
                >
                  Start Shopping
                </Link>
                <Link
                  to="/faq"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-md border border-[#E9E9E9] bg-white text-[#1A1A1A] text-[13px] font-semibold hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
                >
                  View FAQs
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full lg:max-w-85">
              {[
                { label: 'Fast checkout', value: 'Guest & account' },
                { label: 'Order support', value: 'WhatsApp & phone' },
                { label: 'Delivery updates', value: 'Track your parcel' },
                { label: 'Secure purchase', value: 'Trusted process' },
              ].map((item) => (
                <div key={item.label} className="rounded-[10px] border border-[#E9E9E9] bg-white px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#60717B] mb-1">{item.label}</p>
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6 mt-6 items-start">
          <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 md:p-8 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
            <h2 className="text-[20px] font-black text-[#1A1A1A] mb-6">Order process</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="border border-[#E9E9E9] rounded-[10px] p-5 hover:border-[#FFB700]/60 hover:shadow-[2px_3px_8px_rgba(0,0,0,0.05)] transition-all bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#FFB700] shrink-0">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider">Step {index + 1}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{title}</h3>
                  <p className="text-[13px] text-[#60717B] leading-relaxed">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-[#171C26] text-white rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 text-[#FFB700] text-[11px] font-bold uppercase tracking-wider mb-3">
                <FiMessageCircle size={12} aria-hidden="true" />
                Helpful tips
              </div>
              <h2 className="text-[18px] font-black mb-4">A smoother checkout starts here</h2>
              <ul className="space-y-3">
                {TIPS.map((tip) => (
                  <li key={tip} className="text-[13px] leading-relaxed text-gray-200 flex gap-2">
                    <span className="text-[#FFB700] mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-6 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
              <h2 className="text-[18px] font-black text-[#1A1A1A] mb-3">Need help ordering?</h2>
              <p className="text-[13px] text-[#60717B] leading-relaxed mb-5">
                Our team can help you place an order, explain payment options, or guide you through delivery details.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://wa.me/94764604227"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-[#25D366] text-white text-[13px] font-bold hover:opacity-90 transition-opacity"
                >
                  Chat on WhatsApp
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-md border border-[#E9E9E9] text-[#1A1A1A] text-[13px] font-semibold hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  );
}
