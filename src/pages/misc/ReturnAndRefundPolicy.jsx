import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { FiAlertTriangle, FiArrowUp, FiCheckCircle } from 'react-icons/fi';

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'eligibility', label: '2. Return Eligibility' },
  { id: 'non-returnable', label: '3. Non-Returnable Items' },
  { id: 'request', label: '4. How to Request a Return' },
  { id: 'inspection', label: '5. Inspection & Approval' },
  { id: 'refunds', label: '6. Refunds' },
  { id: 'exchanges', label: '7. Exchanges' },
  { id: 'damaged', label: '8. Damaged or Incorrect Items' },
  { id: 'contact', label: '9. Contact Us' },
];

const ALL_TOC_IDS = TOC.map(({ id }) => id);

function SectionHeading({ id, children }) {
  return (
    <h2 id={id} className="text-[18px] font-black text-[#1A1A1A] pb-2.5 mb-4 border-b border-[#E9E9E9] scroll-mt-24">
      {children}
    </h2>
  );
}

function Body({ children }) {
  return <p className="text-[13px] text-[#60717B] leading-relaxed mb-3">{children}</p>;
}

function Ul({ items }) {
  return (
    <ul className="space-y-1.5 mb-4 pl-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-[13px] text-[#60717B] leading-relaxed">
          <span className="text-[#FFB700] mt-1 flex-shrink-0" aria-hidden="true">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReturnAndRefundPolicy() {
  const [active, setActive] = useState('overview');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    const observers = ALL_TOC_IDS.map((id) => {
      const element = document.getElementById(id);
      if (!element) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-20% 0px -70% 0px' },
      );
      observer.observe(element);
      return observer;
    }).filter(Boolean);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      observers.forEach((observer) => observer.disconnect());
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Pages', href: '#' }, { label: 'Return and Refund Policy' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mb-6">
        <div className="bg-[#F5F5F5] border border-[#E9E9E9] rounded-[10px] px-8 py-7">
          <h1 className="text-[32px] font-black text-[#1A1A1A] leading-tight mb-1">Return and Refund Policy</h1>
          <p className="text-[13px] text-[#60717B] mb-5">
            We want you to shop with confidence. This policy explains when and how House of Cambridge accepts returns and issues refunds.
          </p>
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: 'Version', value: '1.0' },
              { label: 'Last Updated', value: '09 October 2026' },
              { label: 'Return Window', value: '30 days from delivery' },
              { label: 'Applies To', value: 'Eligible online orders' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-1">
                <dt className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider">{label}:</dt>
                <dd className="text-[12px] text-[#1A1A1A]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mb-6">
        <div className="bg-amber-50 border border-amber-300 rounded-[8px] px-5 py-4 flex gap-3" role="note">
          <FiAlertTriangle size={16} className="text-[#FFB700] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-bold text-[#1A1A1A] mb-1">Before sending an item back</p>
            <p className="text-[12px] text-[#60717B] leading-relaxed">
              Please contact us and wait for return instructions. Items sent without an approved return request may be delayed or rejected.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pb-14 flex gap-6 items-start">
        <aside
          className="hidden lg:block w-[220px] flex-shrink-0 self-start sticky top-[120px]"
          aria-label="Return policy contents"
        >
          <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
            <div className="px-4 py-3 border-b border-[#E9E9E9]">
              <span className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider">Contents</span>
            </div>
            <nav aria-label="Page sections">
              {TOC.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  aria-current={active === item.id ? 'true' : undefined}
                  className={`w-full text-left px-4 py-2 text-[12px] transition-colors border-l-[3px] ${
                    active === item.id
                      ? 'border-[#FFB700] bg-amber-50 text-[#FFB700] font-bold'
                      : 'border-transparent text-[#60717B] hover:text-[#1A1A1A] hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-[820px]">
          <section id="overview">
            <SectionHeading id="overview">1. Overview</SectionHeading>
            <Body>House of Cambridge accepts returns for eligible products within 30 calendar days of delivery. Products must be returned in a condition that allows them to be resold, subject to the exclusions and requirements below.</Body>
            <Body>This policy does not limit any rights you may have under applicable consumer protection law. If an item is faulty, damaged in transit, or not what you ordered, contact us as soon as possible so we can help.</Body>
          </section>

          <section id="eligibility" className="mt-8">
            <SectionHeading id="eligibility">2. Return Eligibility</SectionHeading>
            <Body>To qualify for a change-of-mind return, an item must:</Body>
            <Ul items={[
              'Be returned within 30 days of the delivery date.',
              'Be unused, unopened, and in its original packaging with labels, accessories, manuals, and promotional items included.',
              'Be accompanied by the order number or other proof of purchase.',
              'Be securely packaged to prevent damage during return transit.',
            ]} />
            <div className="flex gap-2 items-start bg-green-50 border border-green-200 rounded-[8px] px-4 py-3 mb-4">
              <FiCheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[12px] text-green-800 leading-relaxed">Faulty, damaged, or incorrectly supplied items may qualify for a replacement, repair, or full refund even when they do not meet the normal change-of-mind conditions.</p>
            </div>
          </section>

          <section id="non-returnable" className="mt-8">
            <SectionHeading id="non-returnable">3. Non-Returnable Items</SectionHeading>
            <Body>Unless the item is faulty, damaged, or incorrectly supplied, we generally cannot accept returns for:</Body>
            <Ul items={[
              'Opened cosmetics, personal-care, hygiene, or healthcare products.',
              'Opened baby-care products where health or safety could be affected.',
              'Products made to your specifications or personalised for you.',
              'Gift cards, downloadable products, and products clearly marked as final sale.',
              'Items returned without their original accessories or with signs of use, wear, alteration, or accidental damage.',
            ]} />
          </section>

          <section id="request" className="mt-8">
            <SectionHeading id="request">4. How to Request a Return</SectionHeading>
            <Body>Contact our support team through the Contact Us page or the return option in your account. Include your order number, the item you wish to return, the reason, and clear photographs where the item is damaged or faulty.</Body>
            <Body>We will review the request and provide the next steps, including the return address or collection instructions. Please do not send an item to the address on the parcel until your request has been approved.</Body>
          </section>

          <section id="inspection" className="mt-8">
            <SectionHeading id="inspection">5. Inspection and Approval</SectionHeading>
            <Body>Returned items are inspected after receipt. We will notify you whether the return has been approved. If a return is rejected because it does not meet this policy, we may arrange to send the item back to you and any additional delivery cost may apply.</Body>
            <Body>Return shipping costs for a change-of-mind return are normally the customer’s responsibility. We will cover reasonable return costs for items that are faulty, damaged on arrival, or incorrectly supplied.</Body>
          </section>

          <section id="refunds" className="mt-8">
            <SectionHeading id="refunds">6. Refunds</SectionHeading>
            <Body>Once an approved return is received and inspected, the refund will be sent to the original payment method. Refunds normally take 5–10 business days after approval to appear, depending on your bank or payment provider.</Body>
            <Ul items={[
              'The refunded amount includes the price paid for the approved item.',
              'Original standard delivery charges are refundable when the item was faulty, damaged, incorrect, or when required by applicable law.',
              'Express delivery, collection fees, and return postage are not refundable for change-of-mind returns.',
              'If only part of an order is returned, delivery charges are generally not refunded unless the return is due to our error or a faulty item.',
            ]} />
          </section>

          <section id="exchanges" className="mt-8">
            <SectionHeading id="exchanges">7. Exchanges</SectionHeading>
            <Body>We can arrange an exchange for an eligible item when the requested replacement is available. If it is unavailable, we will offer a refund or another suitable resolution. Price differences may apply when exchanging for a different product.</Body>
          </section>

          <section id="damaged" className="mt-8">
            <SectionHeading id="damaged">8. Damaged or Incorrect Items</SectionHeading>
            <Body>Check your order as soon as it arrives. If the package or product is damaged, incomplete, or different from what you ordered, contact us promptly with your order number and photographs of the product and packaging. Please keep the packaging until the issue is resolved.</Body>
            <Body>After verification, we may arrange a replacement, repair, collection, or full refund depending on the circumstances and product availability.</Body>
          </section>

          <section id="contact" className="mt-8">
            <SectionHeading id="contact">9. Contact Us</SectionHeading>
            <Body>For return or refund assistance, contact House of Cambridge through our Contact Us page. Please include your order number in every message so we can respond efficiently.</Body>
            <Body>We may update this policy from time to time. The version displayed on this page applies to orders placed after its effective date, subject to your statutory rights.</Body>
          </section>
        </main>
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-[#FFB700] text-[#1A1A1A] shadow-lg hover:bg-amber-400 transition-colors"
        >
          <FiArrowUp size={18} aria-hidden="true" />
        </button>
      )}
    </Layout>
  );
}
