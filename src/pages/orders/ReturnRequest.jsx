import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../../redux/slices/orderSlice';
import Layout from '../../components/common/Layout';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageSpinner } from '../../components/ui/Spinner';
import { FiCheck, FiCamera, FiX, FiAlertCircle, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ORDER_ID_RE        = /^[A-Za-z0-9]+$/;
const MAX_PHOTOS         = 5;
const MAX_PHOTO_SIZE     = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png'];
const MAX_COMMENTS_LEN   = 1000;

const RETURN_REASONS = [
  { id: 'wrong_item',        label: 'Wrong item received'          },
  { id: 'not_as_described',  label: 'Not as described'             },
  { id: 'changed_mind',      label: 'Changed my mind'              },
  { id: 'defective',         label: 'Defective / Damaged item'     },
  { id: 'other',             label: 'Other reason'                 },
];

const ALLOWED_REASON_IDS = new Set(RETURN_REASONS.map((r) => r.id));

const RESOLUTIONS = [
  {
    id:   'refund',
    icon: '💳',
    label: 'Refund to Original Payment Method',
    desc:  'Processed within 5–7 business days',
  },
  {
    id:   'store_credit',
    icon: '🏪',
    label: 'Store Credit',
    desc:  'Credited to your account instantly · Use on any future order',
  },
  {
    id:   'exchange',
    icon: '🔄',
    label: 'Exchange for Different Size / Colour',
    desc:  "We'll send the replacement once we receive your returned item",
  },
];

const ALLOWED_RESOLUTION_IDS = new Set(RESOLUTIONS.map((r) => r.id));

function sanitizeOrderId(id) {
  if (!id) return '—';
  const safe = String(id).replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase();
  return `DFC-${new Date().getFullYear()}-${safe}`;
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-LK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return isFinite(n) ? n : fallback;
}

const inputCls = 'w-full border border-[#C5C5C5] rounded-[6px] px-3 py-2.5 text-[13px] outline-none focus:border-[#FFB700] bg-[#FAFAFA]';

export default function ReturnRequest() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const { order, loading } = useSelector((s) => s.orders);
  const fileInputRef = useRef(null);

  const [selectedItems, setSelectedItems] = useState({});
  const [qtys, setQtys]                   = useState({});
  const [reason, setReason]               = useState('');
  const [comments, setComments]           = useState('');
  const [photos, setPhotos]               = useState([]);
  const [resolution, setResolution]       = useState('refund');
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    if (orderId && ORDER_ID_RE.test(orderId)) dispatch(fetchOrder(orderId));
  }, [orderId, dispatch]);

  const items = Array.isArray(order?.items) ? order.items : [];

  const getItemId = useCallback((item) => item._id || item.product?._id || item.product, []);

  const toggleItem = useCallback((id) => {
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    setQtys((prev) => ({ ...prev, [id]: prev[id] || 1 }));
  }, []);

  const setQty = useCallback((id, delta) => {
    const item = items.find((i) => getItemId(i) === id);
    const max  = safeNum(item?.quantity, 1);
    setQtys((prev) => ({
      ...prev,
      [id]: Math.min(max, Math.max(1, (prev[id] || 1) + delta)),
    }));
  }, [items, getItemId]);

  const handleReasonChange = useCallback((value) => {
    if (ALLOWED_REASON_IDS.has(value)) setReason(value);
  }, []);

  const handleResolutionChange = useCallback((value) => {
    if (ALLOWED_RESOLUTION_IDS.has(value)) setResolution(value);
  }, []);

  const handleCommentsChange = useCallback((e) => {
    setComments(e.target.value.slice(0, MAX_COMMENTS_LEN));
  }, []);

  const validateAndAddPhotos = useCallback((files) => {
    const valid = files.filter((f) => ALLOWED_PHOTO_MIME.includes(f.type));
    if (valid.length !== files.length) toast.error('Only JPG and PNG files are accepted.');
    const oversized = valid.find((f) => f.size > MAX_PHOTO_SIZE);
    if (oversized) { toast.error('Each file must be under 5 MB.'); return; }
    if (photos.length + valid.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    setPhotos((prev) => [...prev, ...valid]);
  }, [photos.length]);

  const handlePhotoAdd = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    validateAndAddPhotos(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [validateAndAddPhotos]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    validateAndAddPhotos(files);
  }, [validateAndAddPhotos]);

  const removePhoto = useCallback((idx) => {
    setPhotos((prev) => prev.filter((_, j) => j !== idx));
  }, []);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const handleSubmit = useCallback(async () => {
    if (selectedCount === 0) { toast.error('Select at least one item to return.'); return; }
    if (!reason)             { toast.error('Please select a reason for return.'); return; }
    if (!ALLOWED_REASON_IDS.has(reason)) { toast.error('Invalid reason selected.'); return; }
    if (!ALLOWED_RESOLUTION_IDS.has(resolution)) { toast.error('Invalid resolution selected.'); return; }
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('Return request submitted successfully!');
      navigate(`/return-status/${orderId}`);
    } finally {
      setSubmitting(false);
    }
  }, [selectedCount, reason, resolution, orderId, navigate]);

  if (loading && !order) return <Layout><PageSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 py-2">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Return Request' }]} />
      </div>

      <div className="max-w-[900px] mx-auto px-4 pb-14">

        <div className="mb-5">
          <h1 className="text-[22px] font-black text-[#1A1A1A]">Request a Return</h1>
          <p className="text-[13px] text-[#60717B]">Submit a return or exchange request within 30 days of delivery.</p>
        </div>

        {order && (
          <div className="bg-white border border-[#E9E9E9] rounded-[10px] px-5 py-4 shadow-[2px_3px_8px_rgba(0,0,0,0.04)] mb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-black text-[#1A1A1A]">Order #{sanitizeOrderId(order._id)}</p>
                <p className="text-[12px] text-[#60717B]">
                  Delivered:{' '}
                  <time dateTime={order.deliveredAt || order.updatedAt}>
                    {fmtDate(order.deliveredAt || order.updatedAt)}
                  </time>
                  {' · '}{items.length} Item{items.length !== 1 ? 's' : ''}
                  {' · '}Rs. {safeNum(order.total).toLocaleString()}
                </p>
              </div>
              <span className="text-[11px] font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-1">
                <FiCheck size={11} strokeWidth={3} aria-hidden="true" /> Delivered
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">

          <section
            className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]"
            aria-labelledby="step1-heading"
          >
            <div className="px-5 py-3.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 id="step1-heading" className="text-[13px] font-black text-[#1A1A1A]">
                Step 1 — Select Items To Return
              </h2>
            </div>
            <ul className="divide-y divide-[#F5F5F5]">
              {items.length === 0 && (
                <li className="px-5 py-8 text-center text-[13px] text-[#60717B]">
                  No items found for this order.
                </li>
              )}
              {items.map((item) => {
                const itemId    = getItemId(item);
                const isSelected = !!selectedItems[itemId];
                const qty       = qtys[itemId] || 1;
                const maxQty    = safeNum(item.quantity, 1);
                return (
                  <li
                    key={itemId}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${isSelected ? 'bg-amber-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      id={`item-${itemId}`}
                      checked={isSelected}
                      onChange={() => toggleItem(itemId)}
                      className="accent-[#FFB700] w-4 h-4 flex-shrink-0"
                    />
                    <label htmlFor={`item-${itemId}`} className="sr-only">
                      Select {item.name || item.product?.name}
                    </label>
                    <img
                      src={item.image || item.product?.images?.[0]?.url || 'https://placehold.co/60?text=P'}
                      alt={item.name || item.product?.name || 'Product'}
                      className="w-14 h-14 object-cover rounded-[6px] border border-[#E9E9E9] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">
                        {item.name || item.product?.name}
                      </p>
                      <p className="text-[12px] text-[#60717B]">Rs. {safeNum(item.price).toLocaleString()}</p>
                    </div>
                    {isSelected ? (
                      <div
                        className="flex items-center gap-2 border border-[#E9E9E9] rounded-[6px] overflow-hidden flex-shrink-0"
                        role="group"
                        aria-label={`Return quantity for ${item.name || 'product'}`}
                      >
                        <button
                          type="button"
                          onClick={() => setQty(itemId, -1)}
                          disabled={qty <= 1}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center text-[#60717B] hover:bg-gray-100 transition-colors disabled:opacity-40"
                        >
                          <FiMinus size={12} aria-hidden="true" />
                        </button>
                        <span className="text-[12px] font-bold text-[#1A1A1A] w-8 text-center" aria-live="polite">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(itemId, 1)}
                          disabled={qty >= maxQty}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center text-[#60717B] hover:bg-gray-100 transition-colors disabled:opacity-40"
                        >
                          <FiPlus size={12} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#60717B] border border-[#E9E9E9] rounded-[6px] px-3 py-1.5 flex-shrink-0">
                        Qty: {maxQty}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]"
            aria-labelledby="step2-heading"
          >
            <div className="px-5 py-3.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 id="step2-heading" className="text-[13px] font-black text-[#1A1A1A]">
                Step 2 — Reason For Return
              </h2>
            </div>
            <div className="p-5">
              <fieldset>
                <legend className="sr-only">Select a reason for your return</legend>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {RETURN_REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 p-3.5 border-2 rounded-[8px] cursor-pointer transition-colors ${
                        reason === r.id
                          ? 'border-[#FFB700] bg-amber-50'
                          : 'border-[#E9E9E9] hover:border-[#C5C5C5]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={() => handleReasonChange(r.id)}
                        className="accent-[#FFB700]"
                      />
                      <span className="text-[12px] font-medium text-[#1A1A1A]">{r.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mb-4">
                <label htmlFor="return-comments" className="block text-[12px] font-medium text-[#60717B] mb-1.5">
                  Additional Comments
                  <span className="text-[11px] text-gray-400 ml-1">
                    ({comments.length}/{MAX_COMMENTS_LEN})
                  </span>
                </label>
                <textarea
                  id="return-comments"
                  value={comments}
                  onChange={handleCommentsChange}
                  rows={4}
                  maxLength={MAX_COMMENTS_LEN}
                  placeholder="Please describe the issue in more detail (optional but helps us improve)..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                aria-label="Upload photos of the item"
                className="border-2 border-dashed border-[#C5C5C5] rounded-[8px] px-5 py-8 text-center cursor-pointer hover:border-[#FFB700] hover:bg-amber-50/30 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_PHOTO_MIME.join(',')}
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <FiCamera size={28} className="mx-auto mb-2 text-[#C5C5C5]" aria-hidden="true" />
                <p className="text-[13px] font-medium text-[#60717B] mb-1">
                  Upload photos of the item (optional)
                </p>
                <p className="text-[11px] text-[#C5C5C5]">
                  Drag & drop or click · JPG, PNG · Max {MAX_PHOTOS} files · 5 MB each
                </p>
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {photos.map((f, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={`Upload preview ${i + 1}`}
                          className="w-16 h-16 object-cover rounded-[6px] border border-[#E9E9E9]"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                          aria-label={`Remove photo ${i + 1}`}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <FiX size={10} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            className="bg-white border border-[#E9E9E9] rounded-[10px] overflow-hidden shadow-[2px_3px_8px_rgba(0,0,0,0.04)]"
            aria-labelledby="step3-heading"
          >
            <div className="px-5 py-3.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 id="step3-heading" className="text-[13px] font-black text-[#1A1A1A]">
                Step 3 — Preferred Resolution
              </h2>
            </div>
            <div className="p-5">
              <fieldset>
                <legend className="sr-only">Select preferred resolution</legend>
                <div className="space-y-2 mb-4">
                  {RESOLUTIONS.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-[8px] cursor-pointer transition-colors ${
                        resolution === r.id
                          ? 'border-[#1A1A1A] bg-[#1A1A1A]'
                          : 'border-[#E9E9E9] hover:border-[#C5C5C5]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={r.id}
                        checked={resolution === r.id}
                        onChange={() => handleResolutionChange(r.id)}
                        className="accent-[#FFB700]"
                      />
                      <span className="text-xl" aria-hidden="true">{r.icon}</span>
                      <div>
                        <p className={`text-[13px] font-bold ${resolution === r.id ? 'text-white' : 'text-[#1A1A1A]'}`}>
                          {r.label}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${resolution === r.id ? 'text-gray-300' : 'text-[#60717B]'}`}>
                          {r.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="bg-[#F8F8F8] border border-[#E9E9E9] rounded-[8px] px-4 py-3 flex items-start gap-2" role="note">
                <FiAlertCircle size={13} className="text-[#60717B] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] text-[#60717B] leading-relaxed">
                  <span className="font-bold">Return Policy:</span> Items must be returned within 30 days of delivery
                  in their original condition with tags attached. Return shipping is free for defective or wrong items.
                  For other returns, a Rs. 200 return shipping fee applies.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link
              to="/orders"
              className="flex items-center gap-2 border border-[#C5C5C5] text-[#1A1A1A] text-[13px] font-semibold px-5 py-3 rounded-[6px] hover:bg-gray-50 transition-colors"
            >
              <FiArrowLeft size={13} aria-hidden="true" /> Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#FFB700] text-black font-bold text-[14px] px-8 py-3 rounded-[6px] hover:bg-amber-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit Return Request'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}