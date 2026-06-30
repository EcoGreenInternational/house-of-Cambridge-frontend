import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { FiInfo } from 'react-icons/fi';

const TOC = [
  { id: 'introduction', label: '1. Introduction' },
  { id: 'info-collect', label: '2. Information We Collect', sub: [
    { id: 'personal-data',     label: '2.1 Personal Data'       },
    { id: 'usage-data',        label: '2.2 Usage Data'          },
    { id: 'cookies-tracking',  label: '2.3 Cookies & Tracking'  },
  ]},
  { id: 'how-we-use',        label: '3. How We Use Your Data'          },
  { id: 'data-sharing',      label: '4. Data Sharing & Disclosure'     },
  { id: 'data-retention',    label: '5. Data Retention'                },
  { id: 'your-rights',       label: '6. Your Rights'                   },
  { id: 'cookies-policy',    label: '7. Cookies Policy'                },
  { id: 'security-measures', label: '8. Security Measures'             },
  { id: 'third-party',       label: '9. Third-Party Services'          },
];

const USE_TABLE = [
  { purpose: 'Process and fulfil orders',                   data: 'Name, address, payment details, order info',       basis: 'Contractual necessity'              },
  { purpose: 'Send order confirmations & shipping updates', data: 'Email, order details, tracking info',              basis: 'Contractual necessity'              },
  { purpose: 'Loyalty programme management',               data: 'Purchase history, points balance',                 basis: 'Legitimate interest / consent'      },
  { purpose: 'Marketing emails & promotions',              data: 'Email, browsing behaviour',                        basis: 'Consent (opt-in only)'              },
  { purpose: 'Website analytics & improvement',            data: 'Usage data, cookies',                              basis: 'Legitimate interest'                },
  { purpose: 'Fraud prevention & security',               data: 'IP address, device data, transaction data',        basis: 'Legitimate interest / legal obligation' },
  { purpose: 'Customer support & live chat',              data: 'Name, email, chat logs',                           basis: 'Legitimate interest / consent'      },
];

const RETENTION_TABLE = [
  { type: 'Order records',             period: '7 years',                      reason: 'Legal / tax compliance'                   },
  { type: 'Customer account data',     period: 'Until deletion request',       reason: 'Service continuity'                       },
  { type: 'Live chat logs',            period: '2 years',                      reason: 'Support & dispute resolution'             },
  { type: 'Inventory logs',            period: '6 years',                      reason: 'Business operations'                      },
  { type: 'Marketing consent records', period: '6 years from last activity',   reason: 'Compliance with consent obligations'      },
];

const COOKIES_TABLE = [
  { type: 'Essential / Strictly Necessary', purpose: 'Session management, authentication (JWT refresh token), cart persistence', duration: 'Session / 7 days' },
  { type: 'Functional (Optional)',          purpose: 'Remember language, region, and UI preferences',                            duration: '1 year'          },
  { type: 'Analytics',                      purpose: 'Google Analytics — anonymised usage tracking',                             duration: 'Up to 2 years'   },
  { type: 'Marketing',                      purpose: 'Retargeting and personalised advertisements (opt-in only)',                duration: 'Up to 1 year'    },
];

const ALL_TOC_IDS = TOC.flatMap((t) => [t.id, ...(t.sub || []).map((s) => s.id)]);

function SectionHeading({ id, children }) {
  return (
    <h2 id={id} className="text-[18px] font-black text-[#1A1A1A] pb-2.5 mb-4 border-b border-[#E9E9E9] scroll-mt-24">
      {children}
    </h2>
  );
}

function SubHeading({ id, children }) {
  return (
    <h3 id={id} className="text-[14px] font-bold text-[#1A1A1A] mt-5 mb-2 scroll-mt-24">
      {children}
    </h3>
  );
}

function Body({ children }) {
  return <p className="text-[13px] text-[#60717B] leading-relaxed mb-3">{children}</p>;
}

function Ul({ items }) {
  return (
    <ul className="space-y-1.5 mb-3 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-[#60717B] leading-relaxed">
          <span className="text-[#FFB700] mt-1 flex-shrink-0" aria-hidden="true">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DataTable({ headers, rows, caption }) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-[#E9E9E9] mb-4">
      <table className="w-full text-[12px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-[#F5F5F5] border-b border-[#E9E9E9]">
            {headers.map((h) => (
              <th key={h} scope="col" className="text-left px-4 py-2.5 font-bold text-[#1A1A1A]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F0]">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-[#60717B] leading-relaxed align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicy() {
  const [active, setActive] = useState('introduction');

  const scrollTo = (id) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const observers = ALL_TOC_IDS.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-20% 0px -70% 0px' },
      );
      obs.observe(el);
      return obs;
    }).filter(Boolean);
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Pages', href: '#' }, { label: 'Privacy Policy' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mb-6">
        <div className="bg-[#F5F5F5] border border-[#E9E9E9] rounded-[10px] overflow-hidden flex items-center gap-6 px-8 py-7">
          <div className="flex-1 min-w-0">
            <h1 className="text-[32px] font-black text-[#1A1A1A] leading-tight mb-1">Privacy Policy</h1>
            <p className="text-[13px] text-[#60717B] mb-5">
              How House of Cambridge uses and protects your personal information.
            </p>
            <dl className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { label: 'Version',       value: '1.0'                              },
                { label: 'Last Updated',  value: '31 March 2026'                    },
                { label: 'Effective Date',value: '01 April 2026'                    },
                { label: 'Applies To',    value: 'All users of houseofcambridge.co.uk' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-1">
                  <dt className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider">{label}:</dt>
                  <dd className="text-[12px] text-[#1A1A1A]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <img
            src="/images/misc/privacy-hero-illustration-79800d.png"
            alt=""
            aria-hidden="true"
            className="hidden lg:block w-[200px] object-contain flex-shrink-0"
          />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-[8px] px-5 py-4 flex gap-3" role="note">
          <FiInfo size={16} className="text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-bold text-[#1A1A1A] mb-1">Note</p>
            <p className="text-[12px] text-[#60717B] leading-relaxed">
              This policy is compliant with applicable data protection regulations including GDPR principles and local
              Sri Lankan data protection guidelines. Our security systems implement AES-256 encryption and TLS 1.2+
              for all data transmissions.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pb-14 flex gap-6 items-start">

        <aside className="hidden lg:block w-[220px] flex-shrink-0 sticky top-24" aria-label="Privacy Policy contents">
          <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">
            <div className="px-4 py-3 border-b border-[#E9E9E9]">
              <span className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider">Contents</span>
            </div>
            <nav aria-label="Page sections">
              {TOC.map((item) => (
                <div key={item.id}>
                  <button
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
                  {item.sub?.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollTo(s.id)}
                      aria-current={active === s.id ? 'true' : undefined}
                      className={`w-full text-left pl-7 pr-4 py-1.5 text-[11px] transition-colors border-l-[3px] ${
                        active === s.id
                          ? 'border-[#FFB700] bg-amber-50 text-[#FFB700] font-medium'
                          : 'border-transparent text-gray-400 hover:text-[#60717B]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-8">
          <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-7 shadow-[2px_3px_8px_rgba(0,0,0,0.04)]">

            <section aria-labelledby="introduction">
              <SectionHeading id="introduction">1. Introduction</SectionHeading>
              <Body>
                House Of Cambridge ("we," "our," or "us") is committed to protecting your personal information and your
                right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you visit our website houseofcambridge.co.uk and make purchases from us.
              </Body>
              <Body>
                Please read this policy carefully. If you disagree with its terms, please discontinue use of our
                website. By accessing or using our platform, you consent to the data practices described in this policy.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="info-collect">
              <SectionHeading id="info-collect">2. Information We Collect</SectionHeading>
              <SubHeading id="personal-data">2.1 Personal Data You Provide</SubHeading>
              <Body>
                We collect personal information that you voluntarily provide to us when you register on our website,
                make a purchase, participate in activities, or contact us. This includes:
              </Body>
              <Ul items={[
                'Full name, email address, and phone number',
                'Shipping and billing addresses',
                'Account username and password (stored as a bcrypt hash)',
                'Payment information (processed via PCI DSS compliant gateways)',
                'Order history, wishlist items, and product reviews',
                'Live chat messages and customer support correspondence',
                'Loyalty programme data and preferences',
              ]} />
              <SubHeading id="usage-data">2.2 Usage Data (Automatically Collected)</SubHeading>
              <Body>
                When you use our website, we automatically collect certain technical information to improve your
                experience and the performance of our platform:
              </Body>
              <Ul items={[
                'IP address, browser type and version, operating system',
                'Pages visited, links clicked, time spent on pages',
                'Referring URLs and exit pages',
                'Device identifiers and screen resolution',
                'Shopping cart and checkout behaviour (anonymised for analytics)',
              ]} />
              <SubHeading id="cookies-tracking">2.3 Cookies & Tracking Technologies</SubHeading>
              <Body>
                We use cookies, pixel tags, and similar tracking technologies. See Section 7 for full details of our
                cookie usage and how to manage your preferences.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="how-we-use">
              <SectionHeading id="how-we-use">3. How We Use Your Information</SectionHeading>
              <Body>We use the information we collect for the following purposes:</Body>
              <DataTable
                caption="How we use your data"
                headers={['Purpose', 'Data Used', 'Legal Basis']}
                rows={USE_TABLE.map((r) => [r.purpose, r.data, r.basis])}
              />
            </section>

            <section className="mt-8" aria-labelledby="data-sharing">
              <SectionHeading id="data-sharing">4. Data Sharing &amp; Disclosure</SectionHeading>
              <Body>
                We do not sell, trade, or rent your personal information to third parties. We may share your
                information only in the following circumstances:
              </Body>
              <Ul items={[
                'Analytics: Anonymised, aggregated data may be shared with Google Analytics to understand website usage patterns.',
                'Legal Obligations: We may disclose your information if required by law, court order, or regulatory authority in Sri Lanka or any applicable jurisdiction.',
                'Business Transfers: In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity, subject to equivalent privacy protections.',
              ]} />
              <Body>
                All third-party service providers are contractually required to keep your personal information
                confidential and to use it only for the specific purpose for which it was shared.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="data-retention">
              <SectionHeading id="data-retention">5. Data Retention</SectionHeading>
              <Body>
                We retain your personal data only for as long as necessary for the purposes described in this policy
                or as required by law.
              </Body>
              <DataTable
                caption="Data retention periods"
                headers={['Data Type', 'Retention Period', 'Reason']}
                rows={RETENTION_TABLE.map((r) => [r.type, r.period, r.reason])}
              />
              <Body>
                Upon account deletion request, personal identifiers are anonymised (soft delete) while order records
                are retained for legal compliance. See Section 6 for your rights regarding data deletion.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="your-rights">
              <SectionHeading id="your-rights">6. Your Rights</SectionHeading>
              <Body>You have the following rights with respect to the personal data held by us:</Body>
              <Ul items={[
                'Right of Access: Request a copy of the personal data we hold about you.',
                'Right to Rectification: Request correction of inaccurate or incomplete data.',
                'Right to Erasure: Request deletion of your data (subject to legal retention obligations).',
                'Right to Restrict Processing: Request that we limit the processing of your data in certain circumstances.',
                'Right to Data Portability: Request your data in a structured, machine-readable format.',
                'Right to Object: Object to processing of your data for marketing purposes at any time.',
                'Right to Withdraw Consent: Withdraw consent for marketing communications at any time via the unsubscribe link in any email or via your account settings.',
              ]} />
              <Body>
                To exercise any of these rights, please contact us at{' '}
                <a
                  href="mailto:info@houseofcambridge.co.uk"
                  className="font-semibold text-[#1A1A1A] underline underline-offset-2 hover:text-[#FFB700] transition-colors"
                >
                  info@houseofcambridge.co.uk
                </a>
                . We will respond within 30 days of receiving your request.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="cookies-policy">
              <SectionHeading id="cookies-policy">7. Cookies Policy</SectionHeading>
              <Body>
                We use cookies and similar tracking technologies to enhance your browsing experience and analyse
                website traffic. Cookies are small text files stored on your device.
              </Body>
              <DataTable
                caption="Cookie types and purposes"
                headers={['Cookie Type', 'Purpose', 'Duration']}
                rows={COOKIES_TABLE.map((r) => [r.type, r.purpose, r.duration])}
              />
              <Body>
                You may manage your cookie preferences at any time through the Cookie Settings panel accessible in the
                website footer. Essential cookies cannot be disabled as they are required for basic functionality.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="security-measures">
              <SectionHeading id="security-measures">8. Security Measures</SectionHeading>
              <Body>
                We implement industry-standard technical and organisational measures to protect your personal data
                against unauthorised access, alteration, disclosure, or destruction:
              </Body>
              <Ul items={[
                'All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (HTTPS)',
                'Passwords are hashed using bcrypt with a minimum work factor of 10 — they are never stored in plain text',
                'Sensitive database data is encrypted at rest using AES-256',
                'Payments are processed manually — we never transmit or store card numbers or CVV codes on our servers',
                'JWT tokens expire after 1 hour; refresh tokens are stored in HTTP-only, SameSite=Strict cookies',
                'API rate limiting (100 requests / 15 minutes) and login throttling (5 attempts / 15 minutes) are enforced',
                'Database backups are encrypted with AES-256 and stored in a geographically separated AWS S3 bucket',
              ]} />
              <Body>
                While we employ robust security measures, no method of transmission over the internet or electronic
                storage is 100% secure. We will notify you and relevant authorities in the event of a data breach as
                required by law.
              </Body>
            </section>

            <section className="mt-8" aria-labelledby="third-party">
              <SectionHeading id="third-party">9. Third-Party Services</SectionHeading>
              <Body>
                Our website may contain links to third-party websites and we integrate with the following external
                services. We are not responsible for the privacy practices of these third parties and encourage you
                to review their policies:
              </Body>
              <Ul items={[
                'Cloudinary — image storage and delivery (their privacy policies apply to uploaded media)',
                'SendGrid (Twilio) — transactional and marketing email delivery',
                'Amazon Web Services (AWS) — cloud hosting, storage, and CDN',
                'Google Analytics — anonymised website analytics',
                'Shipping carriers — tracking information shared as necessary for order fulfilment',
              ]} />
            </section>

          </div>
        </main>
      </div>
    </Layout>
  );
}