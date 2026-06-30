import { useState, useCallback, useRef } from 'react';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

const SERVICES = [
  { icon: 'mdi:truck', title: 'Fast Delivery', desc: 'Islandwide delivery to your doorstep' },
  { icon: 'mdi:shield-check', title: 'Secure Payments', desc: '100% secure online payments' },
  { icon: 'mdi:check-circle', title: 'Genuine Products', desc: 'Original products from trusted brands' },
  { icon: 'mdi:refresh', title: 'Easy Returns', desc: 'Hassle-free returns within 30 days' },
  { icon: 'mdi:headphones', title: 'Customer Support', desc: 'Friendly support 24/7' },
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

const CONTACT_INFO = {
  whatsapp: '076 460 4227',
  whatsappHref: 'https://wa.me/94764604227',
  phone: '0112 847 846',
  phoneHref: 'tel:+94112847846',
  email: 'info@houseofcambridge.co.uk',
  emailHref: 'mailto:info@houseofcambridge.co.uk',
  address: 'No 63 Old Road, Pannipitiya',
  country: 'Sri Lanka',
};

const FIELD_LIMITS = {
  name: 100,
  email: 254,
  phone: 20,
  message: 1000,
};

const RATE_LIMIT_MS = 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9\s\+\-\(\)]{7,20}$/;

const inputCls =
  'w-full bg-[#EEEEEE] border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#FFB700] focus:bg-white transition-colors';

function sanitize(value) {
  return value.replace(/[<>"'`]/g, '').trimStart();
}

function validateForm({ name, email, phone, message }) {
  if (!name.trim() || name.trim().length < 2) return 'Please enter your full name.';
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  if (!PHONE_RE.test(phone)) return 'Please enter a valid phone number.';
  if (message && message.length > FIELD_LIMITS.message)
    return `Message must not exceed ${FIELD_LIMITS.message} characters.`;
  return null;
}

const INITIAL_FORM = { name: '', email: '', phone: '', message: '' };

export default function ContactUs() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const lastSubmitRef = useRef(0);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const maxLen = FIELD_LIMITS[name];
    const sanitized = sanitize(maxLen ? value.slice(0, maxLen) : value);
    setForm((prev) => ({ ...prev, [name]: sanitized }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitRef.current < RATE_LIMIT_MS) {
      toast.error('Please wait a moment before sending another message.');
      return;
    }

    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    lastSubmitRef.current = now;

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm(INITIAL_FORM);
      setErrors({});
    } catch {
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  const newLocal = <div className="max-w-[1280px] mx-auto px-6 pb-10">
    <div className="rounded-[12px] overflow-hidden border border-[#E9E9E9] shadow-sm h-[300px]">
      <iframe
        title="House of Cambridge location map"
        src={`https://www.google.com/maps?q=${encodeURIComponent(
          `${CONTACT_INFO.address}, ${CONTACT_INFO.country}`
        )}&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade" />
    </div>
  </div>;
  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-6">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact Us' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-10">
        <div className="bg-white border border-[#E9E9E9] rounded-[14px] overflow-hidden shadow-[2px_4px_16px_rgba(0,0,0,0.06)] grid grid-cols-1 md:grid-cols-2">

          <div className="bg-white p-8 flex flex-col gap-7">
            <div>
              <h1 className="text-[26px] font-black mb-1">
                <span className="text-[#FFB700]">Get</span>
                <span className="text-[#1A1A1A]"> In Touch</span>
              </h1>
              <p className="text-[13px] text-[#60717B] leading-relaxed">
                Questions, comments, or suggestions? Simply fill in the form and we'll be in touch shortly.
              </p>
            </div>

            <ul className="space-y-5" aria-label="Contact details">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#FFB700]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <Icon icon="mdi:whatsapp" width={16} className="text-[#FFB700]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#60717B] uppercase tracking-wide mb-0.5">WhatsApp</p>
                  <a
                    href={CONTACT_INFO.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] text-[#1A1A1A] font-medium hover:text-[#FFB700] transition-colors"
                  >
                    {CONTACT_INFO.whatsapp}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#FFB700]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <Icon icon="mdi:phone" width={16} className="text-[#FFB700]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#60717B] uppercase tracking-wide mb-0.5">Landline</p>
                  <a
                    href={CONTACT_INFO.phoneHref}
                    className="text-[14px] text-[#1A1A1A] font-medium hover:text-[#FFB700] transition-colors"
                  >
                    {CONTACT_INFO.phone}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#FFB700]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <Icon icon="mdi:email" width={16} className="text-[#FFB700]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#60717B] uppercase tracking-wide mb-0.5">Email</p>
                  <a
                    href={CONTACT_INFO.emailHref}
                    className="text-[14px] text-[#1A1A1A] font-medium hover:text-[#FFB700] transition-colors"
                  >
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#FFB700]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                  <Icon icon="mdi:map-marker" width={16} className="text-[#FFB700]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#60717B] uppercase tracking-wide mb-0.5">Address</p>
                  <address className="not-italic">
                    <p className="text-[14px] text-[#1A1A1A] font-medium">{CONTACT_INFO.address}</p>
                    <p className="text-[12px] text-[#60717B]">{CONTACT_INFO.country}</p>
                  </address>
                </div>
              </li>
            </ul>

          </div>

          <div className="p-8">
            <h2 className="text-[26px] font-black mb-1">
              <span className="text-[#FFB700]">Drop Us</span>
              <span className="text-[#1A1A1A]"> A Message</span>
            </h2>
            <p className="text-[13px] text-[#60717B] mb-6">We typically respond within 24 hours.</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="contact-name" className="block text-[12px] font-medium text-[#60717B] mb-1.5">
                  Name <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  maxLength={FIELD_LIMITS.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                  className={inputCls}
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="text-[11px] text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-[12px] font-medium text-[#60717B] mb-1.5">
                  Email <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  maxLength={FIELD_LIMITS.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className={inputCls}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-[11px] text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-[12px] font-medium text-[#60717B] mb-1.5">
                  Phone Number <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="07X XXX XXXX"
                  maxLength={FIELD_LIMITS.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  aria-invalid={!!errors.phone}
                  className={inputCls}
                />
                {errors.phone && (
                  <p id="phone-error" role="alert" className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-[12px] font-medium text-[#60717B] mb-1.5">
                  Message
                  <span className="text-[11px] text-gray-400 ml-1">
                    ({form.message.length}/{FIELD_LIMITS.message})
                  </span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  maxLength={FIELD_LIMITS.message}
                  className={inputCls + ' resize-none'}
                />
              </div>

              <button
  type="submit"
  disabled={submitting}
  className="w-full bg-[#FFB700] text-black font-bold text-[14px] py-2.5 rounded-[6px] 
             hover:bg-amber-500 active:scale-[0.985] transition-all flex items-center 
             justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
>
  {submitting ? (
    <span>Sending…</span>
  ) : (
    <>
      <Icon icon="mdi:send" width={14} aria-hidden="true" /> Send Message
    </>
  )}
</button>
            </form>
          </div>
        </div>
      </div>

      {newLocal}

      <section className="bg-[#FAFAFA] py-12" aria-labelledby="services-heading">
        <div className="max-w-[1280px] mx-auto px-6">
          <h2 id="services-heading" className="sr-only">Our Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="bg-white border border-[#E9E9E9] rounded-[14px] shadow-[2px_3px_6px_rgba(0,0,0,0.07)] p-5 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon icon={s.icon} width={18} className="text-[#FFB700]" aria-hidden="true" />
                </div>
                <p className="text-[12px] font-bold text-[#FFB700] mb-1">{s.title}</p>
                <p className="text-[11px] text-[#60717B] leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-white overflow-hidden" aria-labelledby="brands-contact-heading">
        <div className="max-w-[1280px] mx-auto px-6 mb-6">
          <h2 id="brands-contact-heading" className="text-center text-[22px] font-black">
            <span className="text-[#FFB700]">Trusted By </span>
            <span className="text-[#1A1A1A]">Top Brands</span>
          </h2>
        </div>
        <div className="overflow-hidden" aria-hidden="true">
          <div
            className="flex items-center gap-10 whitespace-nowrap"
            style={{ animation: 'marquee 28s linear infinite' }}
          >
            {[...BRAND_LOGOS, ...BRAND_LOGOS].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-8 object-contain flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </Layout>
  );
}