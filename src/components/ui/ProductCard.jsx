import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice.js';
import { toggleWishlist } from '../../redux/slices/userSlice.js';
import { FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

function HeartIcon({ filled }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? '#e53535' : 'none'}
      stroke={filled ? '#e53535' : '#999'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        display: 'block',
        transition: 'fill 0.2s, stroke 0.2s, transform 0.15s',
        transform: filled ? 'scale(1.15)' : 'scale(1)',
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { wishlist } = useSelector((s) => s.user);

  const isWishlisted = wishlist.some((p) => (p._id || p) === product._id);

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const originalPrice = product.discountPrice > 0 ? product.price : null;
  const discountPct = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  const logoSrc = product.seller?.logo || product.shop?.logo || product.seller?.avatar?.url || product.shop?.avatar?.url || null;
  const sellerName = product.seller?.name || product.shop?.name || null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const toastId = toast.loading('Adding to cart...');
    
    dispatch(addToCart({ productId: product._id, quantity: 1 }))
      .then(() => {
        toast.success('Added to cart!', { id: toastId });
      })
      .catch(() => {
        toast.error('Failed to add to cart', { id: toastId });
      });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    dispatch(toggleWishlist(product._id));
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  const inStock = product.stock > 0;

  return (
    <Link
      to={`/product/${product._id}`}
      className="group flex flex-col h-full w-full bg-white rounded-[10px] border border-[#E9E9E9] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden relative"
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <img
          src={product.images?.[0]?.url || 'https://placehold.co/400x400?text=No+Image'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {logoSrc && (
          <div className="absolute top-2 left-2 z-20 w-9 h-9 rounded-full bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
            <img src={logoSrc} alt={sellerName || 'Seller'} className="w-full h-full object-cover" />
          </div>
        )}

        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 z-20 w-[34px] h-[34px] rounded-full flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.14)] transition-all duration-150 active:scale-90 ${
            isWishlisted ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-red-50'
          }`}
        >
          <HeartIcon filled={isWishlisted} />
        </button>

        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-20">
          {product.isFlashSale && <span className="bg-[#FFB700] text-[#5a3a00] text-[10px] font-bold px-2 py-0.5 rounded">Flash Sale</span>}
          {discountPct > 0 && !product.isFlashSale && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">-{discountPct}%</span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="text-white font-bold text-xs bg-black/70 px-3 py-1 rounded">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1 relative">
        {/* Rating */}
        <div className="flex items-center gap-0.5 mb-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <FaStar
              key={s}
              size={10}
              className={s <= Math.round(product.ratings ?? 0) ? 'text-[#FFB700]' : 'text-gray-200'}
            />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">({product.numReviews ?? 0})</span>
        </div>

        <h3 className="text-[11.7px] font-normal text-black line-clamp-2 mb-2 leading-snug min-h-[32px] flex-1">
          {product.name}
        </h3>

        <div className="flex items-end justify-between mb-2.5 w-full">
          <span className="text-[16.5px] font-bold text-[#171C26]">Rs. {price.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-[14px] font-light text-gray-400 line-through">Rs. {originalPrice.toLocaleString()}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          { inStock ? (
            <button
              onClick={handleAddToCart}
              className="flex-1 h-[26px] bg-[#FFB700] text-black text-[11px] font-semibold 
                hover:bg-[#e6a600] active:scale-[0.98] transition-all duration-200 cursor-pointer rounded-[5.8px]"
            >
              Buy Now
            </button>
          ) : (
            <div className="text-[11px] text-gray-400">Out of Stock</div>
          )}
          {inStock && (
            <button
              onClick={handleAddToCart}
              className="w-[27px] h-[27px] bg-[#FFB700] rounded-full flex items-center justify-center hover:bg-[#e6a600] transition-colors cursor-pointer shadow-sm flex-shrink-0"
              aria-label="Add to cart"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}