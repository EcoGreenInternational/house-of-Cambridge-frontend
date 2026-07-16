import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail, clearAuthError } from '../../redux/slices/authSlice.js';
import { FiCheck, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const VERIFIED_CHECKLIST = [
  'Account created successfully',
  'Welcome email sent to your inbox',

  'Bronze Member status unlocked',
];

function OTPInput({ onComplete }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);
npm 
  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== '')) onComplete(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((c, idx) => { next[idx] = c; });
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) onComplete(pasted);
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste} role="group" aria-label="One-time password input">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
          className="w-12 h-12 text-center text-[20px] font-bold text-[#1A1A1A] bg-[#E9E9E9] border-2 border-[#C5C5C5] rounded-[6px] outline-none focus:border-[#FFB700] focus:bg-white transition-colors"
        />
      ))}
    </div>
  );
}

function Countdown({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <time
      dateTime={`PT${Math.floor(remaining / 60)}M${remaining % 60}S`}
      className={remaining < 60 ? 'text-red-500' : 'text-[#1A1A1A]'}
    >
      {mm}:{ss}
    </time>
  );
}

const PAGE_BG = { background: 'linear-gradient(135deg, rgba(254,242,228,1) 22%, rgba(255,255,255,1) 64%)' };

export default function EmailVerification() {
  const { token }   = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [verified,      setVerified]      = useState(false);
  const [expired,       setExpired]       = useState(false);
  const [pendingToken,  setPendingToken]  = useState('');

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearAuthError()); }
  }, [error, dispatch]);

  useEffect(() => {
    if (!token) return;
    dispatch(verifyEmail(token)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') setVerified(true);
    });
  }, [token, dispatch]);

  const handleVerify = () => {
    if (pendingToken.length < 6) { toast.error('Please enter all 6 digits'); return; }
    dispatch(verifyEmail(pendingToken)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') setVerified(true);
      else toast.error('Invalid or expired code. Please try again.');
    });
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center" style={PAGE_BG}>
        <div className="max-w-[1100px] mx-auto px-6 py-12 flex items-center gap-12 w-full">
          <div className="hidden lg:flex lg:w-[45%] items-center justify-center flex-shrink-0">
            <img src="/images/auth/auth-verified-illustration.png" alt="" className="w-full max-w-[380px] object-contain" aria-hidden="true" />
          </div>

          <div className="flex-1 max-w-[460px] mx-auto lg:mx-0">
            <div className="bg-white border border-[#C5C5C5] rounded-sm p-8">
              <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-9 w-auto object-contain mb-6" /></Link>

              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4" aria-hidden="true">
                <FiCheck size={26} className="text-green-500" />
              </div>
              <h1 className="text-[22px] font-bold text-[#1A1A1A] mb-1">Email Verified!</h1>
              <p className="text-[13px] text-[#60717B] mb-6">Welcome to House of Cambridge! Here's what happened:</p>

              <ul className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[6px] p-4 mb-6 space-y-3">
                {VERIFIED_CHECKLIST.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <FiCheck size={11} className="text-green-500" />
                    </div>
                    <p className="text-[13px] text-[#1A1A1A]">{item}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5">
                <button onClick={() => navigate('/profile')} className="w-full bg-[#FFB700] text-black py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors">
                  Go To My Account
                </button>
                <button onClick={() => navigate('/shop')} className="w-full bg-[#1A1A1A] text-white py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-black transition-colors">
                  Start Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center" style={PAGE_BG}>
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex items-center gap-12 w-full">
        <div className="hidden lg:flex lg:w-[45%] items-center justify-center flex-shrink-0">
          <img src="/images/auth/auth-verify-illustration.png" alt="" className="w-full max-w-[400px] object-contain" aria-hidden="true" />
        </div>

        <div className="flex-1 max-w-[460px] mx-auto lg:mx-0">
          <div className="bg-white border border-[#C5C5C5] rounded-sm p-8">
            <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-9 w-auto object-contain mb-6" /></Link>

            <h1 className="text-[20px] font-bold text-[#1A1A1A] mb-1">Verify Your Email Address</h1>
            <p className="text-[13px] text-[#60717B] mb-6">
              We sent a 6-digit verification code to your email. Enter it below to activate your account.
            </p>

            <OTPInput onComplete={setPendingToken} />

            <div className="text-center mt-4 mb-5">
              {expired ? (
                <p className="text-[13px] text-red-500 font-medium" role="alert">Code expired. Please request a new one.</p>
              ) : (
                <p className="text-[13px] text-[#60717B]">
                  Code expires in:{' '}
                  <strong><Countdown seconds={8 * 60 + 42} onExpire={() => setExpired(true)} /></strong>
                </p>
              )}
            </div>

            <p className="text-center text-[12px] text-[#60717B] mb-5">
              Didn't receive the code?{' '}
              <button
                onClick={() => toast.success('Verification code resent!')}
                className="text-[#FFB700] font-medium hover:underline"
              >
                Resend code
              </button>
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleVerify}
                disabled={loading || pendingToken.length < 6}
                className="w-full bg-[#FFB700] text-black py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FiCheck size={15} aria-hidden="true" />
                {loading ? 'Verifying…' : 'Verify Email'}
              </button>
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 border border-[#C5C5C5] bg-white rounded-[6px] py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors"
              >
                <FiArrowLeft size={14} aria-hidden="true" /> Back To Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}