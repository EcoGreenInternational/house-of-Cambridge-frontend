import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, googleLogin, /**acebookLogin **/ } from '../../redux/slices/authSlice.js';

// import useFacebookSDK from '../../hooks/useFacebookSDK.js';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const INPUT_CLS =
  'w-full px-3 py-2.5 bg-[#EEEEEE] border border-[#C5C5C5] rounded-[6px] text-[13px] text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#FFB700] focus:bg-white transition-colors';
const LABEL_CLS  = 'block text-[13px] font-medium text-[#60717B] mb-1.5';
const SECTION_CLS = 'text-[11px] font-bold text-[#60717B] uppercase tracking-wider pb-1.5 border-b border-[#E9E9E9] mb-3 mt-5 first:mt-0';

const NEXT_STEPS = [
  { n: '1', text: 'Complete your profile setup' },
  { n: '2', text: 'Verify your email address' },
  { n: '3', text: 'Start shopping & earning points' },
  { n: '4', text: 'Unlock exclusive member deals' },
];

const MEMBER_BENEFITS = [
  '📦 Real-time order tracking',
  '🎁 Loyalty points on every purchase',
  '♡ Personalised wishlist',
  '🔄 One-click easy returns',
  '🎂 Birthday discount coupon',
];

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

function passwordStrength(p) {
  if (!p) return null;
  const score = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  if (score <= 1) return { label: 'Weak',   color: 'bg-red-500',   text: 'text-red-500',   w: '25%' };
  if (score === 2) return { label: 'Fair',   color: 'bg-amber-500', text: 'text-amber-500', w: '50%' };
  if (score === 3) return { label: 'Good',   color: 'bg-yellow-400',text: 'text-yellow-600',w: '75%' };
  return              { label: 'Strong', color: 'bg-green-500', text: 'text-green-600', w: '100%' };
}

export default function Register() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', dob: '',
    gender: '', email: '', password: '', confirm: '',
    newsletter: false, terms: false,
  });
  const [showPass,      setShowPass]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

  //const fbReady = useFacebookSDK();
  const set     = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim())         { toast.error('First Name is required'); return; }
    if (!form.lastName.trim())          { toast.error('Last Name is required'); return; }
    if (!form.email.trim())             { toast.error('Email Address is required'); return; }
    if (form.password.length < 8)       { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (!form.terms)                    { toast.error('Please agree to terms and conditions'); return; }
    const name = `${form.firstName} ${form.lastName}`.trim();
    try {
      const result = await dispatch(register({ name, email: form.email, password: form.password, phone: form.phone })).unwrap();
      toast.success(result.message ||'Account created successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Registration failed');
    }
  };

  const handleGoogleLogin = async () => {
  setSocialLoading('google');
  try {
    await dispatch(googleLogin()).unwrap(); 
    navigate('/', { replace: true });
  } catch (err) {
    toast.error(typeof err === 'string' ? err : 'Google sign-up failed');
  } finally {
    setSocialLoading('');
  }
};

  /**const handleFacebookLogin = () => {
    if (!fbReady) { toast.error('Facebook SDK not ready yet, please try again'); return; }
    setSocialLoading('facebook');
    window.FB.login((response) => {
      if (response.authResponse) {
        dispatch(facebookLogin(response.authResponse.accessToken))
          .unwrap()
          .then(() => navigate('/', { replace: true }))
          .catch((err) => toast.error(typeof err === 'string' ? err : 'Facebook sign-up failed'))
          .finally(() => setSocialLoading(''));
      } else {
        setSocialLoading('');
        toast.error('Facebook sign-up was cancelled');
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
              SIGN UP NOW!<br /><span className="text-[#FFB700]">UNLOCK DEALS,<br />REWARDS & MORE.</span>
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:flex-none lg:w-[34%] flex items-start justify-center py-10 px-4 overflow-y-auto">
        <div className="w-full max-w-[420px] bg-white border border-[#C5C5C5] rounded-sm p-8">
          <div className="lg:hidden mb-6">
            <Link to="/"><img src="/images/logo.png" alt="House of Cambridge" className="h-9 w-auto object-contain" /></Link>
          </div>

          <h1 className="text-[20px] font-bold text-[#1A1A1A] mb-0.5">Create Your Account</h1>
          <p className="text-[13px] text-[#60717B] mb-5">Join House of Cambridge - it's free and takes less than a minute.</p>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <p className={SECTION_CLS}>Personal Information</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-fname" className={LABEL_CLS}>First Name <span className="text-red-500" aria-hidden="true">*</span></label>
                <input id="reg-fname" type="text" value={form.firstName} onChange={set('firstName')} required placeholder="Amara" autoComplete="given-name" className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="reg-lname" className={LABEL_CLS}>Last Name <span className="text-red-500" aria-hidden="true">*</span></label>
                <input id="reg-lname" type="text" value={form.lastName} onChange={set('lastName')} required placeholder="Perera" autoComplete="family-name" className={INPUT_CLS} />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className={LABEL_CLS}>Phone Number</label>
              <input id="reg-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+94 77 123 4567" autoComplete="tel" className={INPUT_CLS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-dob" className={LABEL_CLS}>Date of Birth <span className="text-[11px] font-normal">(optional)</span></label>
                <input id="reg-dob" type="date" value={form.dob} onChange={set('dob')} autoComplete="bday" className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="reg-gender" className={LABEL_CLS}>Gender <span className="text-[11px] font-normal">(optional)</span></label>
                <select id="reg-gender" value={form.gender} onChange={set('gender')} className={INPUT_CLS}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <p className={SECTION_CLS}>Account Credentials</p>

            <div>
              <label htmlFor="reg-email" className={LABEL_CLS}>Email Address <span className="text-red-500" aria-hidden="true">*</span></label>
              <input id="reg-email" type="email" value={form.email} onChange={set('email')} required placeholder="amara@email.com" autoComplete="email" className={INPUT_CLS} />
            </div>

            <div>
              <label htmlFor="reg-password" className={LABEL_CLS}>Password <span className="text-red-500" aria-hidden="true">*</span></label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  className={`${INPUT_CLS} pr-10`}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden" aria-hidden="true">
                    <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.w }} />
                  </div>
                  <span className={`text-[11px] font-medium ${strength.text}`} aria-label={`Password strength: ${strength.label}`}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" className={LABEL_CLS}>Confirm Password <span className="text-red-500" aria-hidden="true">*</span></label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={`${INPUT_CLS} pr-10`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <p className={SECTION_CLS}>Preferences & Consent</p>

            <label className="flex items-start gap-2 text-[13px] text-[#1A1A1A] cursor-pointer">
              <input type="checkbox" checked={form.newsletter} onChange={set('newsletter')} className="w-3.5 h-3.5 mt-0.5 accent-[#FFB700]" />
              <span>Subscribe to our newsletter for deals and updates</span>
            </label>

            <label className="flex items-start gap-2 text-[13px] text-[#1A1A1A] cursor-pointer">
              <input type="checkbox" checked={form.terms} onChange={set('terms')} required className="w-3.5 h-3.5 mt-0.5 accent-[#FFB700]" />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-[#FFB700] font-medium hover:underline">Terms & Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-[#FFB700] font-medium hover:underline">Privacy Policy</Link>
                {' '}<span className="text-red-500" aria-hidden="true">*</span>
              </span>
            </label>

            <button type="submit" disabled={loading} className="w-full bg-[#FFB700] text-black py-2.5 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors disabled:opacity-60">
              {loading ? 'Creating account…' : 'Create My Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4" aria-hidden="true">
            <div className="flex-1 h-px bg-[#E9E9E9]" />
            <span className="text-[12px] text-[#60717B]">or sign up with</span>
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
           {/* <button type="button" onClick={handleFacebookLogin} disabled={!!socialLoading} className="w-full flex items-center justify-center gap-2.5 border border-[#C5C5C5] bg-white rounded-[6px] py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors disabled:opacity-60">
              {socialLoading === 'facebook'
                ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                : <FacebookIcon />
              }
              Continue with Facebook
            </button> */}
          </div>

          <p className="text-center text-[13px] text-[#60717B] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#1A1A1A] hover:text-[#FFB700]">Sign in →</Link>
          </p>
        </div>
      </div>

      <div className="hidden xl:flex xl:w-[26%] flex-col gap-5 py-10 pr-8 pl-3 overflow-y-auto">
        <div className="bg-white border border-[#C5C5C5] rounded-sm p-5">
          <h2 className="text-[11px] font-bold text-[#60717B] uppercase tracking-widest mb-4">What Happens Next?</h2>
          <ol className="space-y-3">
            {NEXT_STEPS.map(({ n, text }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FFB700] text-black text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">{n}</span>
                <p className="text-[13px] text-[#1A1A1A]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white border border-[#C5C5C5] rounded-sm p-5">
          <h2 className="text-[11px] font-bold text-[#60717B] uppercase tracking-widest mb-3">Member Benefits</h2>
          <ul className="space-y-2">
            {MEMBER_BENEFITS.map((b) => <li key={b} className="text-[13px] text-[#1A1A1A]">{b}</li>)}
          </ul>
        </div>
        <div className="bg-white border border-[#C5C5C5] rounded-sm p-5">
          <h2 className="text-[11px] font-bold text-[#60717B] uppercase tracking-widest mb-2">Your Data Is Safe</h2>
          <p className="text-[12px] text-[#60717B] leading-relaxed">
            We never share your personal information with third parties. Your data is encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}