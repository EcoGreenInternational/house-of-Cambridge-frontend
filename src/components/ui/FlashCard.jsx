import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { addToCart } from '../../redux/slices/cartSlice';

const safeNum = (v) => Number(v) || 0;
const CART_TOAST_ID = 'add-to-cart-toast';

export default function FlashCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const price    = safeNum(product.flashSalePrice || product.discountPrice || product.price);
  const original = safeNum(product.price);
  const pct      = original > price ? Math.round((1 - price / original) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);

    dispatch(addToCart({ productId: product._id, quantity: 1 }))
      .then(() => {
        toast.success('Added to cart!', {
          id: CART_TOAST_ID,
          position: 'top-center',
          style: { background: '#FFB700', color: '#1A1A1A', fontWeight: 600 },
          iconTheme: { primary: '#1A1A1A', secondary: '#FFB700' },
        });
      })
      .catch(() => {
        toast.error('Failed to add to cart', { id: CART_TOAST_ID, position: 'top-center' });
      })
      .finally(() => setIsAdding(false));
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ productId: product._id, quantity: 1 }))
      .then(() => {
        navigate('/checkout', { state: { buyNowProductId: product._id } });
      });
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="group bg-white rounded-[10px] sm:rounded-[13.8px] overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full border border-[rgba(44,42,42,0.3)] shadow-[0px_0.69px_1.38px_rgba(0,0,0,0.05)]"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.images?.[0]?.url || 'https://placehold.co/200x200?text=Product'}
          alt={product.name || 'Flash sale product'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        {pct > 0 && (
          <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-[#E70D0D] text-white text-[10px] sm:text-[13px] font-bold w-[34px] sm:w-[46px] h-[18px] sm:h-[22px] flex items-center justify-center rounded-[3px] sm:rounded-[4px]">
            -{pct}%
          </span>
        )}
      </div>

      <div className="p-2 sm:p-3 flex flex-col flex-1">
        <p className="text-[10px] sm:text-[11.7px] font-normal text-black line-clamp-2 mb-0.5 sm:mb-1">
          {product.name}
        </p>
        <div className="flex gap-0.5 mb-0.5 sm:mb-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((s) => (
            <Icon key={s} icon="mdi:star" width={7} className="sm:w-[9px] text-[#FFB700]" />
          ))}
        </div>
        <div className="mt-auto mb-1 sm:mb-2">
          <span className="text-[13px] sm:text-[16.5px] font-bold text-[#171C26] block">
            Rs. {price.toLocaleString()}
          </span>
          {pct > 0 && (
            <span className="text-[11px] sm:text-[14px] font-light text-gray-400 line-through">
              Rs. {original.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-[#E70D0D] text-white text-[10px] sm:text-[13px] font-bold py-1.5 sm:py-2 rounded-[5px] sm:rounded-[6px] hover:bg-[#cc0000] transition-colors cursor-pointer"
          >
            Buy Now
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-7 h-7 sm:w-10 sm:h-10 bg-[#FFB700] rounded-full flex items-center justify-center hover:bg-[#e6a600] transition-colors shadow-md cursor-pointer flex-shrink-0 disabled:opacity-60"
            aria-label="Add to cart"
          >
            <Icon icon="mdi:cart" width={14} className="sm:w-[18px] text-white" />
          </button>
        </div>
      </div>
    </Link>
  );
}