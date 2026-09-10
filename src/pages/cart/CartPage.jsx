import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  applyCoupon,
  clearCartAsync,
} from '../../redux/slices/cartSlice';
import { fetchAddresses } from '../../redux/slices/userSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import { calcTotalWeightKg } from '../../utils/shipping';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  FiTrash2, FiMinus, FiPlus, FiTag, FiMapPin,
  FiX, FiChevronRight, FiStar, FiPackage,
} from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcAmex } from 'react-icons/fa';
import toast from 'react-hot-toast';

const formatWeight = (weightGrams) => {
  if (!Number.isFinite(weightGrams) || weightGrams <= 0) return '—';
  return weightGrams > 1000
    ? `${(weightGrams / 1000).toFixed(2)} kg`
    : `${weightGrams.toLocaleString()} g`;
};

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  

  const { cart, loading }             = useSelector((s) => s.cart);
  const { addresses }                 = useSelector((s) => s.user);
  const { isAuthenticated }           = useSelector((s) => s.auth);
  const { products: relatedProducts } = useSelector((s) => s.products);

  const [couponCode,    setCouponCode]    = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const scrollRef = useRef(null);

  const VAT_RATE = Number(import.meta.env.VITE_VAT_RATE) || 0;

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchAddresses());
  }, [dispatch, isAuthenticated]);

  const items = cart?.items || [];

  useEffect(() => {
    if (items.length > 0 && items[0]?.product?.category) {
      const catId =
        typeof items[0].product.category === 'object'
          ? items[0].product.category._id
          : items[0].product.category;
      if (catId) dispatch(fetchProducts({ category: catId }));
    }
  }, [dispatch, items.length]);

  
  const handleQty = useCallback((item, qty) => {
    const productId = item?.product?._id || item?.product;
    if (qty <= 0) {
      dispatch(removeFromCart({ productId, itemId: item?._id, variantName: item?.selectedVariant?.name }));
    } else {
      dispatch(updateCartItem({ productId, quantity: qty, itemId: item?._id, variantName: item?.selectedVariant?.name }));
    }
  }, [dispatch]);

  const handleClearCart = useCallback(() => {
    dispatch(clearCartAsync()).then(() => toast.success('Cart cleared'));
  }, [dispatch]);

  const handleCoupon = useCallback(() => {
    if (!couponCode.trim()) return;
    dispatch(applyCoupon(couponCode.toUpperCase())).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        setCouponApplied(couponCode.toUpperCase());
        toast.success('Coupon applied!');
      } else {
        toast.error(action.payload || 'Invalid coupon');
      }
    });
  }, [dispatch, couponCode]);

  const removeCoupon = useCallback(() => {
    setCouponApplied('');
    setCouponCode('');
  }, []);

  const handleRemoveItem = useCallback((item) => {
    const productId = item?.product?._id || item?.product;
    dispatch(removeFromCart({ productId, itemId: item?._id, variantName: item?.selectedVariant?.name }));
    toast.success('Item removed');
  }, [dispatch]);

  const handleUpdateCart = useCallback(() => {
    dispatch(fetchCart());
    toast.success('Cart updated!');
  }, [dispatch]);

  if (loading && !cart) return <Layout><PageSpinner /></Layout>;


  const subtotal      = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount      = cart?.discount || 0;
  const totalWeightKg = calcTotalWeightKg(items);
  const totalWeightGrams = totalWeightKg * 1000;
  const vat           = Math.round((subtotal - discount) * VAT_RATE);
  const cartTotal     = subtotal - discount + vat;
  const loyaltyPoints = Math.floor(subtotal / 50);
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  const cartItemIds = new Set(items.map((i) => i.product?._id));
  const suggestions = relatedProducts.filter((p) => !cartItemIds.has(p._id)).slice(0, 8);

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shopping Cart' }]} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pb-14">

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[22px] font-black text-[#1A1A1A]">
            Shopping Cart{' '}
            <span className="text-[18px] font-semibold text-[#60717B]">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              aria-label="Clear all items from cart"
              className="flex items-center gap-1.5 text-[13px] text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <FiTrash2 size={13} aria-hidden="true" /> Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4" aria-hidden="true">🛒</p>
            <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-1.5">Your cart is empty</h2>
            <p className="text-[13px] text-[#60717B] mb-6">
              Add items to your cart and they'll show up here.
            </p>
            <Link
              to="/shop"
              className="bg-[#FFB700] text-black px-8 py-3 rounded-[6px] font-bold text-[14px] hover:bg-amber-500 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex gap-6 items-start">

            <div className="flex-1 min-w-0">

              <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-5 py-3 mb-4 flex items-center gap-3" role="status">
                <div className="w-9 h-9 bg-[#FFB700]/20 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <FiStar size={16} className="text-[#FFB700]" />
                </div>
                <p className="text-[13px] text-[#1A1A1A]">
                  You'll earn{' '}
                  <span className="font-bold text-[#FFB700]">{loyaltyPoints} loyalty points</span>{' '}
                  with this purchase. Keep shopping to earn more!
                </p>
              </div>

              <div className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]" aria-label="Shopping cart items">
                    <thead>
                      <tr className="bg-[#F5F5F5] border-b border-[#E9E9E9]">
                        {['Product', 'Unit Price', 'Weight', 'Quantity', 'Subtotal'].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className={`text-[12px] font-bold text-[#60717B] uppercase tracking-wider px-4 py-3.5 ${h === 'Product' ? 'text-left px-5' : 'text-center'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {items.map((item) => {
                        const p      = item.product;
                        const itemWeightGrams = Number(item.selectedVariant?.weight ?? p?.weight ?? 0) * item.quantity;
                        const itemImg = item.selectedVariant?.image || p?.images?.[0]?.url || 'https://placehold.co/80?text=P';
                        const rowKey = item._id || `${p?._id}-${item.selectedVariant?.name || ''}`;

                        return (
                          <tr key={rowKey} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3.5">
                                <Link to={`/product/${p?._id}`} className="flex-shrink-0" tabIndex={-1} aria-hidden="true">
                                  <img
                                    src={itemImg}
                                    alt=""
                                    className="w-[70px] h-[70px] object-cover rounded-[8px] border border-[#E9E9E9]"
                                  />
                                </Link>
                                <div>
                                  <Link
                                    to={`/product/${p?._id}`}
                                    className="text-[13px] font-medium text-[#1A1A1A] hover:text-[#FFB700] transition-colors line-clamp-2 max-w-[200px] block"
                                  >
                                    {p?.name}
                                  </Link>
                                  {p?.brand && (
                                    <p className="text-[11px] text-gray-400 mt-0.5">{p.brand}</p>
                                  )}
                                  {item.selectedVariant?.name && (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[#1A1A1A] text-[11px] font-semibold">
                                      {item.selectedVariant.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span className="text-[14px] font-bold text-[#1A1A1A]">
                                Rs. {item.price?.toLocaleString()}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <span className="text-[13px] text-[#60717B]">
                                {formatWeight(itemWeightGrams)}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center" role="group" aria-label={`Quantity for ${p?.name}`}>
                                <div className="flex items-center border border-[#C5C5C5] rounded-[6px] overflow-hidden">
                                  <button
                                    onClick={() => handleQty(item, item.quantity - 1)}
                                    aria-label={`Decrease quantity of ${p?.name}`}
                                    className="w-8 h-8 flex items-center justify-center bg-[#FFB700] hover:bg-amber-500 transition-colors"
                                  >
                                    <FiMinus size={11} className="text-black" aria-hidden="true" />
                                  </button>
                                  <span
                                    className="w-10 h-8 flex items-center justify-center text-[13px] font-semibold text-[#1A1A1A] border-x border-[#C5C5C5] bg-white"
                                    aria-live="polite"
                                    aria-label={`Quantity: ${item.quantity}`}
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQty(item, item.quantity + 1)}
                                    aria-label={`Increase quantity of ${p?.name}`}
                                    className="w-8 h-8 flex items-center justify-center bg-[#FFB700] hover:bg-amber-500 transition-colors"
                                  >
                                    <FiPlus size={11} className="text-black" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-[14px] font-bold text-[#1A1A1A]">
                                  Rs. {(item.price * item.quantity).toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleRemoveItem(item)}
                                  aria-label={`Remove ${p?.name} from cart`}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                  <FiX size={13} aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#E9E9E9] px-5 py-3.5 flex items-center justify-between bg-[#FAFAFA]">
                  <Link
                    to="/shop"
                    className="text-[13px] font-medium text-[#60717B] hover:text-[#1A1A1A] transition-colors"
                  >
                    ← Continue Shopping
                  </Link>
                  <button
                    onClick={handleUpdateCart}
                    className="text-[13px] font-medium text-[#60717B] hover:text-[#1A1A1A] transition-colors"
                  >
                    ↺ Update Cart
                  </button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[16px] font-black text-[#1A1A1A] mb-4">You May Also Like</h3>
                  <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: 'none' }}
                    aria-label="Suggested products"
                  >
                    {suggestions.map((p) => {
                      const price = p.discountPrice > 0 ? p.discountPrice : p.price;
                      return (
                        <Link
                          key={p._id}
                          to={`/product/${p._id}`}
                          className="flex-shrink-0 w-[140px] bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="h-[110px] bg-gray-50 overflow-hidden">
                            <img
                              src={p.images?.[0]?.url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] text-[#1A1A1A] font-medium line-clamp-2 leading-snug mb-1.5">
                              {p.name}
                            </p>
                            <p className="text-[12px] font-bold text-[#1A1A1A]">
                              Rs. {price?.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="w-[300px] flex-shrink-0">
              <div className="bg-white border border-[#E9E9E9] rounded-[10px] p-5 sticky top-24 shadow-[2px_3px_8px_rgba(0,0,0,0.05)]">

                {defaultAddress && (
                  <div className="mb-5 pb-5 border-b border-[#F0F0F0]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                        Delivering To
                      </span>
                      <Link
                        to="/profile/addresses"
                        className="text-[11px] text-[#FFB700] font-medium hover:underline flex items-center gap-0.5"
                      >
                        Change <FiChevronRight size={10} aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiMapPin size={13} className="text-[#FFB700] mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-[12px] font-medium text-[#1A1A1A]">{defaultAddress.fullName}</p>
                        <p className="text-[11px] text-[#60717B] leading-relaxed">
                          {defaultAddress.addressLine1}, {defaultAddress.city}, {defaultAddress.state}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-5 pb-5 border-b border-[#F0F0F0]">
                  <p className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-2.5">
                    Promo / Voucher Code
                  </p>
                  {couponApplied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[6px] px-3 py-2" role="status" aria-label={`Coupon ${couponApplied} applied`}>
                      <div className="flex items-center gap-2">
                        <FiTag size={12} className="text-green-600" aria-hidden="true" />
                        <span className="text-[12px] font-bold text-green-700">{couponApplied}</span>
                        {discount > 0 && (
                          <span className="text-[11px] text-green-600">
                            · −Rs. {discount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={removeCoupon}
                        aria-label="Remove coupon"
                        className="text-green-600 hover:text-red-500 transition-colors ml-2"
                      >
                        <FiX size={13} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCoupon()}
                        placeholder="Enter code"
                        aria-label="Promo or voucher code"
                        maxLength={30}
                        className="flex-1 border border-[#C5C5C5] rounded-[6px] px-3 py-2 text-[12px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]"
                      />
                      <button
                        onClick={handleCoupon}
                        className="bg-[#1A1A1A] text-white px-3.5 rounded-[6px] text-[12px] font-bold hover:bg-black transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <p className="text-[12px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
                    Order Summary
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#60717B]">Subtotal</span>
                      <span className="font-medium text-[#1A1A1A]">Rs. {subtotal.toLocaleString()}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-green-600 flex items-center gap-1">
                          <FiTag size={11} aria-hidden="true" /> {couponApplied || 'Discount'}
                        </span>
                        <span className="text-green-600 font-medium">
                          −Rs. {discount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#60717B] flex items-center gap-1">
                        <FiPackage size={11} aria-hidden="true" /> Total Weight
                      </span>
                      <span className="font-medium text-[#1A1A1A]">
                        {formatWeight(totalWeightGrams)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#60717B]">VAT (8%)</span>
                      <span className="font-medium text-[#1A1A1A]">Rs. {vat.toLocaleString()}</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-[6px] px-3 py-2 text-[11px] text-amber-700" role="note">
                      🚚 Shipping cost will be calculated at checkout based on weight &amp; delivery method.
                    </div>

                    <div className="border-t border-[#E9E9E9] pt-2.5 flex justify-between">
                      <span className="text-[15px] font-black text-[#1A1A1A]">Total</span>
                      <span className="text-[15px] font-black text-[#1A1A1A]">
                        Rs. {cartTotal.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#60717B]">* Excluding shipping charge</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-[#FFB700] text-black font-bold text-[14px] py-3 rounded-[6px] hover:bg-amber-500 transition-colors mb-2"
                >
                  Proceed to Checkout
                </button>

                <p className="text-center text-[11px] text-[#60717B] mb-4 flex items-center justify-center gap-1">
                  🔒 Secure Checkout — SSL Encrypted
                </p>

                <div>
                  <p className="text-[11px] text-gray-400 text-center mb-2">We Accept</p>
                  <div className="flex items-center justify-center gap-3" aria-label="Accepted payment methods">
                    <FaCcVisa       size={32} className="text-[#1A1A6E]" aria-label="Visa" />
                    <FaCcMastercard size={32} className="text-[#EB001B]" aria-label="Mastercard" />
                    <FaCcPaypal     size={32} className="text-[#003087]" aria-label="PayPal" />
                    <FaCcAmex       size={32} className="text-[#2E77BC]" aria-label="American Express" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}