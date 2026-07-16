import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, googleLogin, /**facebookLogin **/ } from '../../redux/slices/authSlice.js';
import { fetchCart } from '../../redux/slices/cartSlice.js';

// import useFacebookSDK from '../../hooks/useFacebookSDK.js';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BENEFITS = [
  { icon: '📦', title: 'Track Your Orders',  desc: 'Real-time delivery updates' },
  { icon: '🎁', title: 'Earn Loyalty Points', desc: 'Points on every purchase' },
  { icon: '♡', title: 'Save to Wishlist',    desc: 'Never lose track of items' },
  { icon: '🔄', title: 'Easy Returns',        desc: 'One-click return requests' },
  { icon: '🚚', title: 'Saved Addresses',     desc: 'Faster checkout every time' },
];

const INPUT_CLS =
  'w-full px-3 py-2.5 bg-[#EEEEEE] border border-[#C5C5C5] rounded-[6px] text-[13px] text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#FFB700] focus:bg-white transition-colors';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

/** const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect width="18" height="18" rx="3" fill="#1877F2"/>
    <path d="M12.375 11.25l.45-2.925H9.99V6.525c0-.8.39-1.575 1.65-1.575H12.9V2.4S11.7 2.175 10.56 2.175c-2.34 0-3.87 1.42-3.87 3.99v2.16H4.2v2.925H6.69V18h3.3v-6.75h2.385Z" fill="white"/>
  </svg>
); **/

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { loading, isAuthenticated, user } = useSelector((s) => s.auth);

  const [form,          setForm]          = useState({ email: '', password: '' });
  const [showPass,      setShowPass]      = useState(false);
  const [remember,      setRemember]      = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

  // const fbReady = useFacebookSDK();
  const from    = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    dispatch(fetchCart());
    navigate(['admin', 'superadmin'].includes(user.role) ? '/admin' : from, { replace: true });
  }, [isAuthenticated, user, navigate, from, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(form)).unwrap();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Login failed');
    }
  };

 const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      await dispatch(googleLogin()).unwrap(); // No argument — Firebase handles it inside thunk
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Google sign-in failed');
    } finally {
      setSocialLoading('');
    }
  };

  /** const handleFacebookLogin = () => {
    if (!fbReady) { toast.error('Facebook SDK not ready yet, please try again'); return; }
    setSocialLoading('facebook');
    window.FB.login((response) => {
      if (response.authResponse) {
        dispatch(facebookLogin(response.authResponse.accessToken))
          .unwrap()
          .catch((err) => toast.error(typeof err === 'string' ? err : 'Facebook sign-in failed'))
          .finally(() => setSocialLoading(''));
      } else {
        setSocialLoading('');
        toast.error('Facebook sign-in was cancelled');
      }
    }, { scope: 'email,public_profile' });
  }; **/

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(136deg, rgba(254,242,228,1) 42%, rgba(255,255,255,1) 83%)' }}>

      <div className="hidden lg:block lg:w-[40%] relative flex-shrink-0 overflow-hidden">
        <img src="/images/auth/auth-login-bg.png" alt="" className="absolute bottom-0 right-0 h-[90%] w-full object-contain object-bottom pointer-events-none select-none" aria-hidden="true" />
        <div className="relative z-10 p-10">
          <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-20 w-auto object-contain" /></Link>
          <div className="mt-14">
            <h2 className="font-black leading-tight text-[#1A1A1A]" style={{ fontSize: '36px' }}>
              WELCOME BACK!<br /><span className="text-[#FFB700]">SHOP SMARTER,<br />FASTER & EASIER.</span>
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:flex-none lg:w-[34%] flex items-start justify-center py-10 px-4 overflow-y-auto">
        <div className="w-full max-w-[420px] bg-white border border-[#C5C5C5] rounded-sm p-9">
          <div className="lg:hidden mb-6">
            <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-9 w-auto object-contain" /></Link>
          </div>

          <h1 className="text-[22px] font-bold text-[#1A1A1A] mb-0.5">Welcome Back</h1>
          <p className="text-[13px] text-[#60717B] mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-[13px] font-medium text-[#60717B] mb-1.5">
                Email Address <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="amara@gmail.com"
                autoComplete="email"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-[13px] font-medium text-[#60717B]">
                  Password <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <Link to="/forgot-password" className="text-[12px] text-[#1A1A1A] font-medium hover:text-[#FFB700]">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${INPUT_CLS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-[#1A1A1A] cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-[#FFB700]" />
              Keep me signed in on this device
            </label>

            <button type="submit" disabled={loading} className="w-full bg-[#FFB700] text-black py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5" aria-hidden="true">
            <div className="flex-1 h-px bg-[#E9E9E9]" />
            <span className="text-[12px] text-[#60717B]">or continue with</span>
            <div className="flex-1 h-px bg-[#E9E9E9]" />
          </div>

          <div className="space-y-2.5">
            <button type="button" onClick={handleGoogleLogin} disabled={!!socialLoading} className="w-full flex items-center justify-center gap-2.5 border border-[#C5C5C5] bg-white rounded-[6px] py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors disabled:opacity-60">
              {socialLoading === 'google'
                ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                : <GoogleIcon />
              }
              Continue with Google
            </button>
             
           {/* 
<button type="button" onClick={handleFacebookLogin} disabled={!!socialLoading} className="w-full flex items-center justify-center gap-2.5 border border-[#C5C5C5] bg-white rounded-[6px] py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors disabled:opacity-60">
  {socialLoading === 'facebook'
    ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    : <FacebookIcon />
  }
  Continue with Facebook
</button> 
*/}
            
          </div>

          <p className="text-center text-[13px] text-[#60717B] mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#1A1A1A] hover:text-[#FFB700]">Create one free →</Link>
          </p>
          <p className="text-center mt-2">
            <Link to="/" className="text-[13px] text-[#FFB700] font-medium hover:underline">Continue as Guest →</Link>
          </p>
        </div>
      </div>

      <div className="hidden xl:flex xl:w-[26%] flex-col gap-5 py-10 pr-8 pl-3 overflow-y-auto">
        <div className="bg-white border border-[#C5C5C5] rounded-sm p-5">
          <h2 className="text-[11px] font-bold text-[#60717B] uppercase tracking-widest mb-4">Why Create an Account?</h2>
          <ul className="space-y-3.5">
            {BENEFITS.map(({ icon, title, desc }) => (
              <li key={title} className="flex gap-3 items-start">
                <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{title}</p>
                  <p className="text-[12px] text-[#60717B]">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-[#C5C5C5] rounded-sm p-5">
          <h2 className="text-[11px] font-bold text-[#60717B] uppercase tracking-widest mb-3">Need Help?</h2>
          <ul className="space-y-2.5">
            <li><Link to="/faq" className="flex items-center gap-2 text-[13px] text-[#1A1A1A] hover:text-[#FFB700]"><span aria-hidden="true">❓</span> FAQs</Link></li>
            <li><Link to="/contact" className="flex items-center gap-2 text-[13px] text-[#1A1A1A] hover:text-[#FFB700]"><span aria-hidden="true">💬</span> Contact Support</Link></li>
            <li><a href="tel:0764604227" className="flex items-center gap-2 text-[13px] text-[#1A1A1A] hover:text-[#FFB700]"><span aria-hidden="true">📞</span> 076 460 4227</a></li>
            <li><a href="tel:0112847846" className="flex items-center gap-2 text-[13px] text-[#1A1A1A] hover:text-[#FFB700]"><span aria-hidden="true">📞</span> 011 284 7846</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}