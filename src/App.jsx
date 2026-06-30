import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import { fetchCart } from './redux/slices/cartSlice';
import { fetchWishlist } from './redux/slices/userSlice';
import ScrollToTop from './components/common/ScrollToTop';
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
import DataPrivacy from './pages/misc/DataPrivacy';
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

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((s) => s.auth);
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useSelector((s) => s.auth);
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['admin', 'superadmin'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
   
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) await dispatch(loadUser());
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
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />

      
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />

     
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/guest-checkout" element={<GuestCheckoutPage />} />
        <Route path="/payment-processing" element={<PaymentProcessingPage />} />
        <Route path="/payment-denied" element={<PaymentDeniedPage />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/track-order/:id" element={<OrderTracking />} />
        <Route path="/track-order" element={<OrderTracking />} />
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

       
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy-policy" element={<DataPrivacy />} />
        <Route path="/terms" element={<TermsAndConditions />} />

        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;