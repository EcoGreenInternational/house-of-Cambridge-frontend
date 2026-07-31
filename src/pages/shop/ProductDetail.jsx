import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct, fetchProducts, createReview } from '../../redux/slices/productSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { toggleWishlist } from '../../redux/slices/userSlice';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ProductCard from '../../components/ui/ProductCard';
import { PageSpinner } from '../../components/ui/Spinner';
import {
  FiHeart, FiShield, FiTruck, FiRefreshCw,
  FiMinus, FiPlus, FiZoomIn, FiChevronLeft, FiChevronRight, FiCheck,
} from 'react-icons/fi';
import { FaHeart, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TABS = ['Description', 'Reviews & Ratings', 'Usage Instructions'];
const MAX_REVIEW_LENGTH = 1000;
const MAX_QTY = 99;
const SCROLL_AMOUNT = 220;
const MAX_RELATED = 10;

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

function safePrice(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function safeRating(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
}

function safeInteger(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function StarBar({ label, count, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[#60717B] w-12 text-right">{sanitizeText(label)}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-[#FFB700] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] text-[#60717B] w-6">{safeInteger(count)}</span>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, products, loading } = useSelector((s) => s.products);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { wishlist } = useSelector((s) => s.user);

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const productStock = safeInteger(product?.stock ?? 0);

  const safeId = id ? encodeURIComponent(id) : null;
  const isWishlisted = wishlist.some((p) => (p._id || p) === id);
 const handleRatingChange = useCallback((s) => {
    const rating = Math.min(5, Math.max(1, Math.round(s)));
    setReview((prev) => ({ ...prev, rating }));
  }, []);

  const handleCommentChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length <= MAX_REVIEW_LENGTH) {
      setReview((prev) => ({ ...prev, comment: val }));
    }
  }, []);

  const handleQtyDecrement = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const handleQtyIncrement = useCallback(
    () => setQty((q) => Math.min(productStock, MAX_QTY, q + 1)),
    [productStock]
  );

  const scrollRelated = useCallback((dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchProduct(id));
    window.scrollTo(0, 0);
    setActiveImg(0);
    setQty(1);
    setTab(0);
    setReview({ rating: 5, comment: '' });
  }, [id, dispatch]);

  useEffect(() => {
    if (product?.category?._id) {
      dispatch(fetchProducts({ category: product.category._id, page: 1 }));
    }
  }, [product?.category?._id, dispatch]);

  if (!id) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">Product not found.</p>
          <Link to="/shop" className="text-[#FFB700] hover:underline mt-2 inline-block">Back to Shop</Link>
        </div>
      </Layout>
    );
  }

  if (loading || !product) return <Layout><PageSpinner /></Layout>;

const price = safePrice(
  product.flashSalePrice > 0 
    ? product.flashSalePrice 
    : product.discountPrice > 0 
      ? product.discountPrice 
      : product.price
);

const originalPrice = (product.flashSalePrice > 0 || product.discountPrice > 0) 
  ? safePrice(product.price) 
  : null;
  const discountPct = originalPrice && originalPrice > 0
    ? Math.min(99, Math.max(0, Math.round((1 - price / originalPrice) * 100)))
    : 0;


  const productRatings = safeRating(product.ratings);
  const productNumReviews = safeInteger(product.numReviews);
  const productName = sanitizeText(product.name);

const handleAddToCart = () => {
  if (!product._id) return;

  const toastId = toast.loading('Adding to cart...');

  dispatch(addToCart({ productId: product._id, quantity: qty }))
    .then(() => {
      toast.success('Added to cart!', { id: toastId });
    })
    .catch(() => {
      toast.error('Failed to add to cart', { id: toastId });
    });
};

const handleBuyNow = () => {
  if (!product._id) return;

  const toastId = toast.loading('Adding to cart...');

  dispatch(addToCart({ productId: product._id, quantity: qty }))
    .then(() => {
      toast.success('Added to cart!', { id: toastId });
      navigate('/checkout');
    })
    .catch(() => {
      toast.error('Failed to add to cart', { id: toastId });
    });
};

const handleWishlist = () => {
  if (!isAuthenticated) {
    toast.error('Please login to save items');
    return;
  }
  if (!product._id) return;

  dispatch(toggleWishlist(product._id));
  toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
};

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }
    if (!product._id) return;

    const trimmedComment = review.comment.trim();
    if (!trimmedComment) {
      toast.error('Please write a comment before submitting.');
      return;
    }
    if (trimmedComment.length > MAX_REVIEW_LENGTH) {
      toast.error(`Review must be under ${MAX_REVIEW_LENGTH} characters.`);
      return;
    }

    const rating = Math.min(5, Math.max(1, Math.round(review.rating)));

    setSubmitting(true);
    try {
      const action = await dispatch(
        createReview({ id: product._id, data: { rating, comment: trimmedComment } })
      );
      if (action.meta.requestStatus === 'fulfilled') {
        toast.success('Review submitted!');
        setReview({ rating: 5, comment: '' });
        dispatch(fetchProduct(id));
      } else {
        toast.error(
          typeof action.payload === 'string' ? sanitizeText(action.payload) : 'Failed to submit review'
        );
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

 
  const relatedProducts = products
    .filter((p) => p._id && p._id !== id)
    .slice(0, MAX_RELATED);

  const ATTRIBUTES = [
    product.brand  && { label: 'Brand',  value: sanitizeText(String(product.brand)) },
    product.weight && { label: 'Weight(g)', value: sanitizeText(String(product.weight)) },
    product.volume && { label: 'Volume', value: sanitizeText(String(product.volume)) },
    product.model  && { label: 'Model',  value: sanitizeText(String(product.model)) },
    product.origin && { label: 'Origin', value: sanitizeText(String(product.origin)) },
  ].filter(Boolean);

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => Math.round(safeRating(r.rating)) === s).length,
  }));

  const images = Array.isArray(product.images) ? product.images : [];
  const safeActiveImg = Math.min(activeImg, Math.max(0, images.length - 1));

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            {
              label: sanitizeText(product.category?.name || 'Products'),
              href: `/shop?category=${encodeURIComponent(product.category?._id || '')}`,
            },
            { label: productName },
          ]}
        />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="flex gap-3">
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-[70px] flex-shrink-0" role="list" aria-label="Product images">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    role="listitem"
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={i === safeActiveImg}
                    className={`aspect-square rounded-[6px] overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      i === safeActiveImg
                        ? 'border-[#FFB700]'
                        : 'border-[#E9E9E9] hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${productName} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/70x70?text=Img'; }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative aspect-square bg-[#F8F8F8] rounded-[10px] overflow-hidden border border-[#E9E9E9]">
              <img
                src={images[safeActiveImg]?.url || 'https://placehold.co/600?text=Product'}
                alt={productName}
                className="w-full h-full object-contain p-4"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/600?text=Product'; }}
              />
              <button
                className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors"
                aria-label="Zoom image"
              >
                <FiZoomIn size={15} className="text-[#60717B]" aria-hidden="true" />
              </button>
              {productStock === 0 && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center" aria-label="Out of stock">
                  <span className="text-white font-bold text-sm bg-black/60 px-4 py-1.5 rounded">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[12px] text-[#60717B] mb-1">
              {sanitizeText(product.category?.name)}
            </p>
            <h1 className="text-[20px] font-bold text-[#1A1A1A] leading-snug mb-3">
              {productName}
            </h1>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center gap-1"
                aria-label={`Rated ${productRatings.toFixed(1)} out of 5 — ${productNumReviews} reviews`}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar
                    key={s}
                    size={13}
                    className={s <= Math.round(productRatings) ? 'text-[#FFB700]' : 'text-gray-200'}
                    aria-hidden="true"
                  />
                ))}
                <span className="text-[12px] text-[#60717B] ml-1">({productNumReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <FiCheck size={13} aria-hidden="true" />
                <span className="text-[12px] font-medium">Verified Seller</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-1">
              <span className="text-[28px] font-black text-[#1A1A1A]">
                Rs. {price.toLocaleString()}
              </span>
              {originalPrice && (
                <>
                  <span className="text-[16px] text-gray-400 line-through">
                    Rs. {originalPrice.toLocaleString()}
                  </span>
                  <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-[#60717B] mb-4">
              Inclusive of all taxes. Free delivery on orders above Rs 5,000.
            </p>

            {ATTRIBUTES.length > 0 && (
              <div className="border border-[#E9E9E9] rounded-[6px] overflow-hidden mb-4">
                {ATTRIBUTES.map((a, i) => (
                  <div
                    key={a.label}
                    className={`flex text-[12px] ${i % 2 === 0 ? 'bg-[#F8F8F8]' : 'bg-white'}`}
                  >
                    <span className="w-28 px-3 py-2 font-medium text-[#60717B] border-r border-[#E9E9E9] flex-shrink-0">
                      {a.label}
                    </span>
                    <span className="px-3 py-2 text-[#1A1A1A]">{a.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div
              className={`text-[13px] font-medium mb-4 ${
                productStock > 0 ? 'text-green-600' : 'text-red-500'
              }`}
              aria-live="polite"
            >
              {productStock > 0
                ? `✓ In Stock — ${productStock} units available`
                : '✗ Out of Stock'}
            </div>

            {productStock > 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[13px] text-[#60717B]" id="qty-label">Quantity:</span>
                  <div
                    className="flex items-center border border-[#C5C5C5] rounded-[6px] overflow-hidden"
                    role="group"
                    aria-labelledby="qty-label"
                  >
                    <button
                      onClick={handleQtyDecrement}
                      disabled={qty <= 1}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors border-r border-[#C5C5C5] disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <FiMinus size={13} aria-hidden="true" />
                    </button>
                    <span
                      className="w-12 text-center text-[14px] font-semibold"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {qty}
                    </span>
                    <button
                      onClick={handleQtyIncrement}
                      disabled={qty >= productStock || qty >= MAX_QTY}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors border-l border-[#C5C5C5] disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <FiPlus size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-5">
 
  <button
    onClick={handleBuyNow}
    className="w-full bg-[#FFB700] hover:bg-[#e6a600] active:scale-[0.985] text-black font-bold text-[14px] py-3.5 rounded-[6px] transition-all duration-200 cursor-pointer shadow-sm"
  >
    Buy Now
  </button>


  <button
    onClick={handleAddToCart}
    className="w-full bg-white hover:bg-gray-50 border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold text-[14px] py-3.5 rounded-[6px] transition-all duration-200 cursor-pointer active:scale-[0.985]"
  >
    Add to Cart
  </button>


  <button
    onClick={handleWishlist}
    className={`w-full border-2 font-bold text-[14px] py-3.5 rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.985] ${
      isWishlisted
        ? 'border-red-500 text-red-500 hover:bg-red-50'
        : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-gray-50'
    }`}
    aria-pressed={isWishlisted}
  >
    {isWishlisted ? (
      <FaHeart size={16} className="text-red-500" />
    ) : (
      <FiHeart size={16} />
    )}
    {isWishlisted ? 'Saved to Wishlist' : 'Add To Wishlist'}
  </button>
</div>
              </>
            )}

            <div className="grid grid-cols-3 gap-2 border-t border-[#E9E9E9] pt-4">
              {[
                { icon: FiShield,   title: 'Genuine Product', desc: '100% authentic' },
                { icon: FiTruck,    title: 'Fast Delivery',   desc: 'Island-wide' },
                { icon: FiRefreshCw,title: 'Easy Returns',    desc: '30 day policy' },
              ].map((b) => (
                <div key={b.title} className="text-center">
                  <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-1">
                    <b.icon size={15} className="text-[#FFB700]" aria-hidden="true" />
                  </div>
                  <p className="text-[11px] font-bold text-[#1A1A1A]">{b.title}</p>
                  <p className="text-[10px] text-[#60717B]">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 mb-12">
          <div className="flex border-b border-[#E9E9E9]" role="tablist">
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                role="tab"
                aria-selected={tab === i}
                aria-controls={`tabpanel-${i}`}
                id={`tab-${i}`}
                className={`px-6 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                  tab === i
                    ? 'border-[#FFB700] text-[#FFB700]'
                    : 'border-transparent text-[#60717B] hover:text-[#1A1A1A]'
                }`}
              >
                {t}{t === 'Reviews & Ratings' ? ` (${productNumReviews})` : ''}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {tab === 0 && (
              <div
                id="tabpanel-0"
                role="tabpanel"
                aria-labelledby="tab-0"
                className="text-[14px] text-[#60717B] leading-relaxed max-w-[800px]"
              >
                {product.description
                  ? <p>{sanitizeText(product.description)}</p>
                  : <p className="text-gray-400">No description available.</p>}
              </div>
            )}

            {tab === 1 && (
              <div
                id="tabpanel-1"
                role="tabpanel"
                aria-labelledby="tab-1"
                className="flex flex-col lg:flex-row gap-8"
              >
                {productNumReviews > 0 && (
                  <div className="lg:w-[260px] flex-shrink-0">
                    <div className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[10px] p-5">
                      <div className="text-center mb-4">
                        <p className="text-[56px] font-black text-[#1A1A1A] leading-none">
                          {productRatings.toFixed(1)}
                        </p>
                        <div
                          className="flex gap-0.5 justify-center my-2"
                          aria-label={`${productRatings.toFixed(1)} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FaStar
                              key={s}
                              size={16}
                              className={s <= Math.round(productRatings) ? 'text-[#FFB700]' : 'text-gray-200'}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-[12px] text-[#60717B]">{productNumReviews} reviews</p>
                      </div>
                      <div className="space-y-2">
                        {starCounts.map(({ star, count }) => (
                          <StarBar
                            key={star}
                            label={`${star} ★`}
                            count={count}
                            total={productNumReviews}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <div className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[10px] p-5 mb-6">
                    <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-4">Write a Review</h3>
                    {!isAuthenticated ? (
                      <p className="text-[13px] text-[#60717B]">
                        Please{' '}
                        <Link to="/login" className="text-[#FFB700] font-medium hover:underline">
                          login
                        </Link>{' '}
                        to write a review.
                      </p>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="space-y-3" noValidate>
                        <fieldset>
                          <legend className="text-[12px] text-[#60717B] mb-1.5">Your Rating</legend>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleRatingChange(s)}
                                aria-label={`Rate ${s} out of 5`}
                                aria-pressed={s === review.rating}
                              >
                                <FaStar
                                  size={22}
                                  className={s <= review.rating ? 'text-[#FFB700]' : 'text-gray-300'}
                                  aria-hidden="true"
                                />
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <div>
                          <textarea
                            id="review-comment"
                            value={review.comment}
                            onChange={handleCommentChange}
                            required
                            rows={3}
                            maxLength={MAX_REVIEW_LENGTH}
                            placeholder="Share your experience with this product..."
                            className="w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] bg-white outline-none focus:border-[#FFB700] resize-none"
                            aria-label="Review comment"
                          />
                          <p className="text-[11px] text-gray-400 text-right mt-0.5">
                            {review.comment.length}/{MAX_REVIEW_LENGTH}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={submitting || !review.comment.trim()}
                          className="bg-[#FFB700] text-black px-6 py-2.5 rounded-[6px] font-bold text-[13px] hover:bg-amber-500 transition-colors disabled:opacity-60"
                        >
                          {submitting ? 'Submitting…' : 'Submit Review'}
                        </button>
                      </form>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-[13px] text-gray-400 text-center py-8">
                      No reviews yet. Be the first to review!
                    </p>
                  ) : (
                    <div className="space-y-4" role="list" aria-label="Customer reviews">
                      {reviews.map((r, i) => {
                        const reviewerName = sanitizeText(r.name || r.user?.name || 'Anonymous');
                        const reviewComment = sanitizeText(r.comment || '');
                        const reviewRating = safeRating(r.rating);
                        let reviewDate = '';
                        try {
                          reviewDate = new Date(r.createdAt).toLocaleDateString();
                        } catch {
                          reviewDate = '';
                        }

                        return (
                          <div
                            key={r._id || i}
                            className="border border-[#E9E9E9] rounded-[8px] p-4 bg-white"
                            role="listitem"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-9 h-9 rounded-full bg-[#FFB700] flex items-center justify-center flex-shrink-0 text-black font-bold text-[13px]"
                                aria-hidden="true"
                              >
                                {reviewerName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[13px] font-bold text-[#1A1A1A]">{reviewerName}</p>
                                  {reviewDate && (
                                    <time className="text-[11px] text-[#60717B]" dateTime={r.createdAt}>
                                      {reviewDate}
                                    </time>
                                  )}
                                </div>
                                <div
                                  className="flex gap-0.5 mb-2"
                                  aria-label={`Rated ${reviewRating} out of 5`}
                                >
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <FaStar
                                      key={s}
                                      size={11}
                                      className={s <= reviewRating ? 'text-[#FFB700]' : 'text-gray-200'}
                                      aria-hidden="true"
                                    />
                                  ))}
                                </div>
                                <p className="text-[13px] text-[#60717B] leading-relaxed">{reviewComment}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 2 && (
              <div
                id="tabpanel-2"
                role="tabpanel"
                aria-labelledby="tab-2"
                className="max-w-2xl"
              >
                {Array.isArray(product.usageInstructions) && product.usageInstructions.length > 0 ? (
                  <ol className="space-y-3">
                    {product.usageInstructions.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-[#FFB700] text-black text-[12px] font-bold flex items-center justify-center mt-0.5" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span className="text-[14px] text-[#60717B] leading-relaxed pt-1">
                          {sanitizeText(String(point))}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[10px] p-6 text-center">
                    <p className="text-gray-400">No usage instructions available for this product.</p>
                    <p className="text-[12px] text-gray-400 mt-1">
                      Please refer to the product packaging for details.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="border-t border-[#E9E9E9] pt-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[22px] font-black">
                <span className="text-[#FFB700]">You May </span>
                <span className="text-[#1A1A1A]">Also Like</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollRelated(-1)}
                  className="w-8 h-8 rounded-full border border-[#C5C5C5] flex items-center justify-center hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
                  aria-label="Scroll related products left"
                >
                  <FiChevronLeft size={15} aria-hidden="true" />
                </button>
                <button
                  onClick={() => scrollRelated(1)}
                  className="w-8 h-8 rounded-full border border-[#C5C5C5] flex items-center justify-center hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
                  aria-label="Scroll related products right"
                >
                  <FiChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
              role="list"
              aria-label="Related products"
            >
              {relatedProducts.map((p) => (
                <div
                  key={p._id}
                  className="shrink-0 w-50"
                  style={{ scrollSnapAlign: 'start' }}
                  role="listitem"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}