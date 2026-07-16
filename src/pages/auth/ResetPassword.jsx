import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../../redux/slices/authSlice.js';
import { FiEye, FiEyeOff, FiCheck, FiX, FiShield, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const INPUT_CLS =
  'w-full px-3 py-2.5 bg-[#EEEEEE] border border-[#C5C5C5] rounded-[6px] text-[13px] text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#FFB700] focus:bg-white transition-colors pr-10';

const PAGE_BG = { background: 'linear-gradient(135deg, rgba(254,242,228,1) 22%, rgba(255,255,255,1) 64%)' };

const POST_RESET_ITEMS = [
  'Be redirected to the login page',
  'Receive a confirmation email',
  'Sign in with your new password',
];

const REDIRECT_DELAY_MS = 3000;

function Req({ met, label }) {
  return (
    <div className="flex items-center gap-1.5">
      {met
        ? <FiCheck size={11} className="text-green-500" aria-hidden="true" />
        : <FiX    size={11} className="text-gray-300"  aria-hidden="true" />
      }
      <span className={`text-[11px] ${met ? 'text-green-600' : 'text-[#60717B]'}`}>{label}</span>
    </div>
  );
}

export default function ResetPassword() {
  const { token } = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const [form,        setForm]        = useState({ password: '', confirm: '' });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success,     setSuccess]     = useState(false);

  const p = form.password;
  const reqs = {
    len:     p.length >= 8,
    upper:   /[A-Z]/.test(p),
    num:     /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
    match:   p.length > 0 && p === form.confirm,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8)       { toast.error('Password must be at least 8 characters'); return; }
    try {
      await dispatch(resetPassword({ token, password: form.password })).unwrap();
      setSuccess(true);
      setTimeout(() => navigate('/login'), REDIRECT_DELAY_MS);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center" style={PAGE_BG}>
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex items-center gap-12 w-full">

        <div className="hidden lg:flex lg:w-[45%] items-center justify-center flex-shrink-0">
          <img src="/images/auth/auth-reset-illustration.png" alt="" className="w-full max-w-[380px] object-contain" aria-hidden="true" />
        </div>

        <div className="flex-1 max-w-[460px] mx-auto lg:mx-0">
          <div className="bg-white border border-[#C5C5C5] rounded-sm overflow-hidden">

            <div className="p-8 pb-6">
              <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-9 w-auto object-contain mb-6" /></Link>

              <h1 className="text-[20px] font-bold text-[#1A1A1A] mb-1">Set New Password</h1>
              <p className="text-[13px] text-[#60717B] mb-5">Choose a strong password for your account.</p>

              <div className="flex items-center gap-2 bg-[#E9E9E9] rounded-[6px] px-3 py-2 mb-4">
                <FiShield size={13} className="text-[#60717B] flex-shrink-0" aria-hidden="true" />
                <p className="text-[12px] text-[#60717B]">
                  Reset token: <span className="font-mono text-[#1A1A1A] font-medium">{token?.slice(0, 12)}…</span>
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[6px] p-3 mb-5" role="note">
                <FiAlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  This link is valid for 1 hour only. Never share your password with anyone.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-password" className="block text-[13px] font-medium text-[#60717B] mb-1.5">
                    New Password <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className={INPUT_CLS}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-[13px] font-medium text-[#60717B] mb-1.5">
                    Confirm Password <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      required
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      className={INPUT_CLS}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>

                {form.password && (
                  <div className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[6px] p-3" role="list" aria-label="Password requirements">
                    <p className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-2">Password Requirements</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Req met={reqs.len}     label="At least 8 characters" />
                      <Req met={reqs.upper}   label="One uppercase letter" />
                      <Req met={reqs.num}     label="One number" />
                      <Req met={reqs.special} label="One special character" />
                      <Req met={reqs.match}   label="Passwords match" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-[#FFB700] text-black py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors disabled:opacity-60">
                  {loading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            </div>

            <div className="border-t border-[#E9E9E9] bg-gray-50 px-8 py-5" aria-live="polite">
              <p className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-3">After resetting you will:</p>
              {success ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                    <FiCheck size={22} className="text-green-500" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1A1A1A]">Password Updated!</p>
                  <p className="text-[12px] text-[#60717B] mt-1">Redirecting you to the login page…</p>
                </div>
              ) : (
                <ul className="space-y-1.5 opacity-60" aria-hidden="true">
                  {POST_RESET_ITEMS.map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FiCheck size={10} className="text-green-500" />
                      </div>
                      <p className="text-[12px] text-[#60717B]">{t}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}