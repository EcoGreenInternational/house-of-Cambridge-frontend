import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../../redux/slices/authSlice.js';
import { FiMail, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const INPUT_CLS =
  'w-full px-3 py-2.5 bg-[#EEEEEE] border border-[#C5C5C5] rounded-[6px] text-[13px] text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#FFB700] focus:bg-white transition-colors';

const PAGE_BG = { background: 'linear-gradient(149deg, rgba(255,255,255,1) 57%, rgba(254,242,228,1) 85%)' };

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [sent,  setSent]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(forgotPassword(email)).unwrap();
      setSent(true);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="min-h-screen flex items-center" style={PAGE_BG}>
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex items-center gap-12 w-full">

        <div className="hidden lg:flex lg:w-[45%] items-center justify-center flex-shrink-0">
          <img src="/images/auth/auth-forgot-illustration.png" alt="" className="w-full max-w-[420px] object-contain" aria-hidden="true" />
        </div>

        <div className="flex-1 max-w-[460px] mx-auto lg:mx-0">
          <div className="bg-white border border-[#C5C5C5] rounded-sm overflow-hidden">

            <div className="p-8 pb-6">
              <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-15 w-auto object-contain mb-6" /></Link>
              <h1 className="text-[20px] font-bold text-[#1A1A1A] mb-1">Forgot Your Password?</h1>
              <p className="text-[13px] text-[#60717B] mb-5">Enter your email and we'll send a reset link.</p>

              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[6px] p-3 mb-5" role="note">
                <FiAlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  If you signed up with Google or Facebook, please use those to sign in instead - password reset only works for email accounts.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="forgot-email" className="block text-[13px] font-medium text-[#60717B] mb-1.5">
                    Email Address <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <FiMail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      autoComplete="email"
                      className={`${INPUT_CLS} pl-9`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFB700] text-black py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>

                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 border border-[#C5C5C5] bg-white rounded-[6px] py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                >
                  <FiArrowLeft size={14} aria-hidden="true" /> Back to Login
                </Link>
              </form>
            </div>

            <div className="border-t border-[#E9E9E9] bg-gray-50 px-8 py-5" aria-live="polite">
              <p className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-3">After clicking send you will see:</p>
              {sent ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <FiMail size={18} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1A1A]">Reset Link Sent!</p>
                    <p className="text-[12px] text-[#60717B] mt-0.5">
                      We sent a password reset link to <strong className="text-[#1A1A1A]">{email}</strong>. Check your inbox (and spam folder).
                    </p>
                    <Link to="/login" className="mt-3 inline-block text-[#FFB700] text-[12px] font-medium hover:underline">
                      ← Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 opacity-60" aria-hidden="true">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FiMail size={18} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1A1A]">Reset Link Sent!</p>
                    <p className="text-[12px] text-[#60717B] mt-0.5">
                      You'll receive an email with a link to reset your password within 5 minutes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}