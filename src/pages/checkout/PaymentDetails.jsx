import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startPayHerePayment } from '../../utils/payhere';
import { FiAlertTriangle } from 'react-icons/fi';

const FAILURE_REASONS = [
  'Insufficient funds in your account',
  'Incorrect card details entered',
  'Card expired or blocked for online transactions',
  'Transaction limit exceeded',
];

export default function PaymentDeniedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [retrying, setRetrying] = useState(false);

  // Cart is emptied once the order exists, so retry pays that same order instead of re-checking out
  const orderId = /^[a-f\d]{24}$/i.test(searchParams.get('order') || '') ? searchParams.get('order') : null;

  const handleTryAgain = async () => {
    if (!orderId) { navigate('/checkout'); return; }
    if (retrying) return;
    setRetrying(true);
    try {
      await startPayHerePayment(orderId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start card payment');
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
      <div className="w-full max-w-[900px] bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row">

        <div
          className="md:w-[45%] bg-red-50 flex items-center justify-center p-10 min-h-[300px]"
          aria-hidden="true"
        >
          <img
            src="/images/checkout/payment-denied.png"
            alt=""
            className="w-full max-w-[260px] object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="hidden flex-col items-center justify-center text-center">
            <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" aria-hidden="true">
                <rect x="18" y="10" width="44" height="60" rx="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                <rect x="24" y="20" width="32" height="4" rx="2" fill="#EF4444" opacity="0.4" />
                <rect x="24" y="28" width="20" height="4" rx="2" fill="#EF4444" opacity="0.3" />
                <circle cx="40" cy="50" r="10" fill="#EF4444" />
                <path d="M40 44v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="40" cy="55" r="1.5" fill="white" />
              </svg>
            </div>
            <p className="text-red-500 font-bold text-[13px]">Payment Error</p>
          </div>
        </div>

        <main className="md:w-[55%] p-8 md:p-12 flex flex-col justify-center">

          <div className="flex justify-center mb-5" aria-hidden="true">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle size={28} className="text-red-500" />
            </div>
          </div>

          <h1 className="text-[24px] font-black text-[#1A1A1A] text-center mb-3">
            Your Payment was Denied
          </h1>
          <p className="text-[13px] text-[#60717B] text-center mb-8 leading-relaxed">
            Sorry, we weren&apos;t able to complete your payment at this time.
            Please check your payment details and try again, or use a different payment method.
          </p>

          <div
            className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[10px] p-4 mb-7"
            role="note"
          >
            <p className="text-[12px] font-bold text-[#1A1A1A] mb-2">
              Common reasons for payment failure:
            </p>
            <ul className="space-y-1">
              {FAILURE_REASONS.map((r) => (
                <li key={r} className="text-[12px] text-[#60717B] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5C5C5] flex-shrink-0" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTryAgain}
              disabled={retrying}
              className="flex-1 bg-[#FFB700] text-black font-bold text-[14px] py-3.5 rounded-[8px] hover:bg-amber-500 transition-colors disabled:opacity-60"
            >
              {retrying ? 'Redirecting…' : 'Try Again'}
            </button>
            <Link
              to={orderId ? `/order-confirmation/${orderId}` : '/cart'}
              className="flex-1 border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold text-[14px] py-3.5 rounded-[8px] hover:bg-gray-50 transition-colors text-center"
            >
              {orderId ? 'View Order' : 'Cancel'}
            </Link>
          </div>

          <p className="text-[11px] text-[#60717B] text-center mt-5">
            Need help?{' '}
            <Link to="/contact" className="text-[#FFB700] font-semibold hover:underline">
              Contact our support team
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}