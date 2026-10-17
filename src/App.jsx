import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import { fetchCart } from './redux/slices/cartSlice';
import { fetchWishlist } from './redux/slices/userSlice';
import ScrollToTop from './components/common/ScrollToTop';
import ComingSoon, { getLaunchDate } from './ComingSoon';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EmailVerification from './pages/auth/EmailVerification';
import ShopPage from './pages/shop/ShopPage';
import ProductDetail from './pages/shop/ProductDetail';
import FlashSalePage from './pages/shop/FlashSalePage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import GuestCheckoutPage from './pages/checkout/GuestCheckout';
import PaymentProcessingPage from './pages/checkout/PaymentProcess';
import PaymentDeniedPage from './pages/checkout/PaymentDetails';
import OrderConfirmation from './pages/orders/OrderConfirmation';
import OrderTracking from './pages/orders/OrderTracking';
import OrderHistory from './pages/orders/OrderHistory';
import OrderDetail from './pages/orders/OrderDetail';
import ReturnRequest from './pages/orders/ReturnRequest';
import ReturnStatus from './pages/orders/ReturnStatus';
import ProfileDashboard from './pages/profile/ProfileDashboard';
import EditProfile from './pages/profile/EditProfile';
import AddressManagement from './pages/profile/AddressManagement';
import Wishlist from './pages/profile/Wishlist';
import NotificationCenter from './pages/profile/NotificationCenter';
import LoyaltyPoints from './pages/profile/LoyaltyPoints';
import PaymentMethods from './pages/profile/PaymentMethods';
import AboutUs from './pages/misc/AboutUs';
import ContactUs from './pages/misc/ContactUs';
import FAQ from './pages/misc/FAQ';
import HowToBuy from './pages/misc/HowToBuy';
import DataPrivacy from './pages/misc/DataPrivacy';
import ReturnAndRefundPolicy from './pages/misc/ReturnAndRefundPolicy';
import TermsAndConditions from './pages/misc/TermsAndConditions';
import Error404 from './pages/misc/Error404';
import WriteReview from './pages/reviews/WriteReview';
import ReviewSubmitted from './pages/reviews/ReviewSubmitted';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBrands from './pages/admin/AdminBrands';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReturns from './pages/admin/AdminReturns';
import AdminBroadcast from './pages/admin/AdminBroadcast';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminFlashSales from './pages/admin/AdminFlash';
import AdminInvoices from './pages/admin/AdminInvoices';


function ProtectedRoute({ children }) {
  const { isAuthenticated, authChecked } = useSelector((s) => s.auth);
  if (!authChecked) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Signed-in customers use the member checkout; everyone else uses guest checkout
function MemberCheckoutRoute({ children }) {
  const { isAuthenticated, authChecked } = useSelector((s) => s.auth);
  if (!authChecked) return null;
  return isAuthenticated ? children : <Navigate to="/guest-checkout" replace />;
}

function GuestCheckoutRoute({ children }) {
  const { isAuthenticated, authChecked } = useSelector((s) => s.auth);
  if (!authChecked) return null;
  return isAuthenticated ? <Navigate to="/checkout" replace /> : children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, authChecked } = useSelector((s) => s.auth);
  if (!authChecked) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['admin', 'superadmin'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

const launchCelebrationKey = 'house-of-cambridge-launch-celebration-seen';
const celebrationColors = ['#FFB700', '#FF8C00', '#1A1A1A', '#F7D794', '#FFFFFF'];

function hasSeenLaunchCelebration() {
  try {
    return localStorage.getItem(launchCelebrationKey) === 'true';
  } catch {
    return false;
  }
}

function LaunchCelebration({ onDismiss }) {
  const balls = Array.from({ length: 24 }, (_, index) => ({
    left: `${(index * 37) % 101}%`,
    delay: `${(index % 8) * 0.18}s`,
    color: celebrationColors[index % celebrationColors.length],
    size: `${18 + (index % 4) * 6}px`,
  }));

  return (
    <div className="launch-celebration" role="status" aria-label="Website launch celebration">
      <style>{`
        .launch-celebration {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(26, 26, 26, 0.42);
          animation: launch-celebration-fade 7s ease forwards;
          pointer-events: none;
        }
        .launch-celebration-content {
          position: relative;
          z-index: 1;
          max-width: min(90vw, 520px);
          padding: 36px 42px;
          border: 2px solid #FFB700;
          border-radius: 20px;
          background: #fffaf1;
          color: #1A1A1A;
          text-align: center;
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.25);
          animation: launch-celebration-pop 0.7s ease-out both;
        }
        .launch-celebration-content h2 {
          margin: 0 0 10px;
          color: #FF8C00;
          font-size: clamp(28px, 6vw, 48px);
          font-weight: 900;
          letter-spacing: 1px;
        }
        .launch-celebration-content p {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .launch-celebration-dismiss {
          margin-top: 22px;
          padding: 10px 22px;
          border: 0;
          border-radius: 999px;
          background: #1A1A1A;
          color: #fff;
          cursor: pointer;
          font-weight: 700;
          pointer-events: auto;
        }
        .launch-celebration-ball {
          position: absolute;
          top: -60px;
          left: var(--ball-left);
          width: var(--ball-size);
          height: var(--ball-size);
          border-radius: 50%;
          background: var(--ball-color);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
          animation: launch-celebration-fall 5s ease-in forwards;
          animation-delay: var(--ball-delay);
        }
        @keyframes launch-celebration-fall {
          to { transform: translateY(115vh) rotate(540deg); }
        }
        @keyframes launch-celebration-pop {
          from { opacity: 0; transform: scale(0.75); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes launch-celebration-fade {
          0%, 82% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      {balls.map((ball, index) => (
        <span
          className="launch-celebration-ball"
          key={index}
          style={{
            '--ball-left': ball.left,
            '--ball-delay': ball.delay,
            '--ball-color': ball.color,
            '--ball-size': ball.size,
          }}
        />
      ))}
      <div className="launch-celebration-content">
        <h2>We are live!</h2>
        <p>Welcome to House of Cambridge. Let&apos;s celebrate!</p>
        <button type="button" className="launch-celebration-dismiss" onClick={onDismiss}>
          Start shopping
        </button>
      </div>
    </div>
  );
}

function LaunchGate() {
  const [isLaunched, setIsLaunched] = useState(() => Date.now() >= getLaunchDate().getTime());
  const [showCelebration, setShowCelebration] = useState(
    () => Date.now() >= getLaunchDate().getTime() && !hasSeenLaunchCelebration(),
  );

  useEffect(() => {
    if (isLaunched) return undefined;

    const launchDelay = Math.max(0, getLaunchDate().getTime() - Date.now());
    const timer = window.setTimeout(() => {
      setIsLaunched(true);
      if (!hasSeenLaunchCelebration()) setShowCelebration(true);
    }, launchDelay);

    return () => window.clearTimeout(timer);
  }, [isLaunched]);

  useEffect(() => {
    if (!isLaunched || !showCelebration) return undefined;

    try {
      localStorage.setItem(launchCelebrationKey, 'true');
    } catch {
      // The celebration still works for the current visit if storage is unavailable.
    }

    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [isLaunched, showCelebration]);

  if (!isLaunched) return <ComingSoon />;

  return (
    <>
      <Home />
      {showCelebration && <LaunchCelebration onDismiss={() => setShowCelebration(false)} />}
    </>
  );
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    const init = async () => {
      await dispatch(loadUser());
      dispatch(fetchCart());
    };
    init();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [isAuthenticated, dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '13px', fontWeight: '500', maxWidth: '360px' },
          success: { iconTheme: { primary: '#FFB700', secondary: '#000' } },
        }}
      />
      <Routes>
        <Route path="/" element={<LaunchGate />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />

        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<MemberCheckoutRoute><CheckoutPage /></MemberCheckoutRoute>} />
        <Route path="/guest-checkout" element={<GuestCheckoutRoute><GuestCheckoutPage /></GuestCheckoutRoute>} />
        <Route path="/payment-processing" element={<PaymentProcessingPage />} />
        <Route path="/payment-denied" element={<PaymentDeniedPage />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/track-order/:id" element={<OrderTracking />} />
        <Route path="/track-order" element={<OrderTracking />} />
        <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/orders/:orderId/return" element={<ProtectedRoute><ReturnRequest /></ProtectedRoute>} />
        <Route path="/return-status/:orderId" element={<ProtectedRoute><ReturnStatus /></ProtectedRoute>} />

        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/profile/addresses" element={<ProtectedRoute><AddressManagement /></ProtectedRoute>} />
        <Route path="/profile/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
        <Route path="/profile/loyalty" element={<ProtectedRoute><LoyaltyPoints /></ProtectedRoute>} />
        <Route path="/profile/payment" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />

        <Route path="/add-review" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
        <Route path="/add-review/:productId" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
        <Route path="/review-submitted" element={<ProtectedRoute><ReviewSubmitted /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
        <Route path="/admin/brands" element={<AdminRoute><AdminBrands /></AdminRoute>} />
        <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
        <Route path="/admin/returns" element={<AdminRoute><AdminReturns /></AdminRoute>} />
        <Route path="/admin/flash-sales" element={<AdminRoute><AdminFlashSales /></AdminRoute>} />
        <Route path="/admin/broadcast" element={<AdminRoute><AdminBroadcast /></AdminRoute>} />
        <Route path="/admin/invoices" element={<AdminRoute><AdminInvoices /></AdminRoute>} />

        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/how-to-buy" element={<HowToBuy />} />
        <Route path="/privacy-policy" element={<DataPrivacy />} />
        <Route path="/return-policy" element={<ReturnAndRefundPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />

        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;