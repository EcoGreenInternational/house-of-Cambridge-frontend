import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminFlashSales,
  fetchAdminProducts,
  updateFlashSale,
  fetchFlashSaleSetting,
  updateFlashSaleSetting,
  deleteFlashSalePoster,
} from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { FiZap, FiPlus, FiEdit2, FiTrash2, FiClock, FiSearch, FiX, FiUpload } from 'react-icons/fi';

const EMPTY_FORM = { flashSalePrice: '', flashSaleEnds: '' };

function timeLeft(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return `${h}h ${m}m left`;
}

function discountPct(original, sale) {
  if (!original || !sale) return 0;
  return Math.round(((original - sale) / original) * 100);
}

function toLocalDatetimeValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const NOW_ISO = () => new Date().toISOString().slice(0, 16);

export default function AdminFlashSales() {
  const dispatch = useDispatch();
  const { flashSales = [], products = [], loading, flashSaleVisible, flashSalePosterUrl } = useSelector((s) => s.admin);
  const { toasts, toast, removeToast } = useToast();

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [search,        setSearch]        = useState('');
  const [picked,        setPicked]        = useState(null);
  const [removeTarget,  setRemoveTarget]  = useState(null);
  const [removing,      setRemoving]      = useState(false);
  const [settingSaving, setSettingSaving] = useState(false);
  const [posterFile, setPosterFile] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminFlashSales());
    dispatch(fetchAdminProducts({ limit: 200 }));
    dispatch(fetchFlashSaleSetting());
  }, [dispatch]);

  const handleVisibilityChange = async (event) => {
    const visible = event.target.checked;
    setSettingSaving(true);
    try {
      await dispatch(updateFlashSaleSetting({ flashSaleVisible: visible })).unwrap();
      toast.success(visible ? 'Flash sale section enabled' : 'Flash sale section hidden');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not update flash sale visibility');
    } finally {
      setSettingSaving(false);
    }
  };

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Poster image must be 2 MB or smaller.');
      return;
    }
    setPosterFile(file);
  };

  const handlePosterUpload = async () => {
    if (!posterFile) return;
    setSettingSaving(true);
    try {
      await dispatch(updateFlashSaleSetting({
        flashSaleVisible: flashSaleVisible !== false,
        poster: posterFile,
      })).unwrap();
      setPosterFile(null);
      toast.success('Flash sale poster uploaded');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not upload flash sale poster');
    } finally {
      setSettingSaving(false);
    }
  };

  const handlePosterDelete = async () => {
    setSettingSaving(true);
    try {
      await dispatch(deleteFlashSalePoster()).unwrap();
      toast.success('Flash sale poster deleted');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not delete flash sale poster');
    } finally {
      setSettingSaving(false);
    }
  };

  const openAdd = useCallback(() => {
    setEditing(null);
    setPicked(null);
    setSearch('');
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((product) => {
    setEditing(product);
    setPicked(product);
    setSearch('');
    setForm({
      flashSalePrice: product.flashSalePrice || '',
      flashSaleEnds:  toLocalDatetimeValue(product.flashSaleEnds),
    });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditing(null);
    setPicked(null);
  }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const target = editing || picked;
    if (!target)                                    return toast.error('Select a product first');
    if (!form.flashSalePrice || Number(form.flashSalePrice) <= 0) return toast.error('Enter a valid flash sale price');
    if (Number(form.flashSalePrice) >= target.price) return toast.error('Flash sale price must be less than the original price');
    if (!form.flashSaleEnds)                        return toast.error('Select an end date/time');

    setSaving(true);
    try {
      await dispatch(updateFlashSale({
        id:   target._id,
        data: { isFlashSale: true, flashSalePrice: form.flashSalePrice, flashSaleEnds: form.flashSaleEnds },
      })).unwrap();
      toast.success(editing ? 'Flash sale updated' : 'Flash sale created');
      closeDrawer();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await dispatch(updateFlashSale({ id: removeTarget._id, data: { isFlashSale: false } })).unwrap();
      toast.success('Removed from flash sale');
      setRemoveTarget(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Remove failed');
    } finally {
      setRemoving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => !p.isFlashSale && p.name?.toLowerCase().includes(q)).slice(0, 20);
  }, [products, search]);

  const activeCount  = flashSales.filter((p) => p.flashSaleEnds && new Date(p.flashSaleEnds) > Date.now()).length;
  const expiredCount = flashSales.filter((p) => !p.flashSaleEnds || new Date(p.flashSaleEnds) <= Date.now()).length;
  const totalSavings = flashSales.reduce((sum, p) => sum + (p.price - (p.flashSalePrice || p.price)), 0);

  const currentTarget = editing || picked;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-[1100px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-black text-[#1A1A1A]">Flash Sales</h2>
            <p className="text-[13px] text-[#60717B]">Manage limited-time flash offers</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1A1A] cursor-pointer">
              <input
                type="checkbox"
                checked={flashSaleVisible !== false}
                onChange={handleVisibilityChange}
                disabled={settingSaving}
                className="h-4 w-4 accent-[#FFB700]"
              />
              Show flash sale on user view
            </label>
            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-[#E9E9E9] rounded-[8px] text-[12px] font-semibold cursor-pointer hover:border-[#FFB700]">
              <FiUpload size={14} aria-hidden="true" />
              Choose poster
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePosterChange} className="sr-only" />
            </label>
            {posterFile && (
              <button
                type="button"
                onClick={handlePosterUpload}
                disabled={settingSaving}
                className="px-3 py-2 bg-[#1A1A1A] text-white rounded-[8px] text-[12px] font-semibold disabled:opacity-50"
              >
                {settingSaving ? 'Uploading…' : 'Upload poster'}
              </button>
            )}
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 transition-colors"
            >
              <FiPlus size={15} aria-hidden="true" /> Add Flash Sale
            </button>
          </div>
        </div>
        {flashSalePosterUrl && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-[#E9E9E9] rounded-[10px] p-3">
            <img src={flashSalePosterUrl} alt="Current flash sale poster" className="w-full sm:w-28 h-40 sm:h-16 object-cover rounded-[6px]" />
            <p className="flex-1 text-[12px] text-[#60717B]">This poster appears in the flash-sale area when the checkbox is unticked.</p>
            <button
              type="button"
              onClick={handlePosterDelete}
              disabled={settingSaving}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-[8px] text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50 sm:flex-shrink-0"
            >
              <FiTrash2 size={14} aria-hidden="true" />
              Delete poster
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Offers',       value: activeCount,                        color: 'text-green-600' },
            { label: 'Expired',             value: expiredCount,                       color: 'text-red-500'   },
            { label: 'Total Discount Value',value: `Rs.${totalSavings.toLocaleString()}`, color: 'text-[#FFB700]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-[12px] border border-[#E9E9E9] p-4">
              <p className="text-[12px] text-[#60717B] font-medium">{label}</p>
              <p className={`text-[22px] font-black mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {loading && !flashSales.length ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#FFB700] border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading" />
          </div>
        ) : !flashSales.length ? (
          <div className="bg-white rounded-[12px] border border-[#E9E9E9] p-16 text-center">
            <FiZap size={32} className="mx-auto text-[#E9E9E9] mb-3" aria-hidden="true" />
            <p className="text-[15px] font-semibold text-[#1A1A1A]">No flash sales yet</p>
            <p className="text-[13px] text-[#60717B] mt-1">Click "Add Flash Sale" to create your first offer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {flashSales.map((product) => {
              const remaining = timeLeft(product.flashSaleEnds);
              const expired   = remaining === 'Expired';
              const pct       = discountPct(product.price, product.flashSalePrice);
              return (
                <div
                  key={product._id}
                  className={`bg-white rounded-[12px] border p-4 flex flex-col gap-3 ${expired ? 'border-red-200 opacity-70' : 'border-[#E9E9E9]'}`}
                >
                  <div className="flex items-start gap-3">
                    {product.images?.[0]?.url
                      ? <img src={product.images[0].url} alt={product.name} className="w-14 h-14 object-cover rounded-[8px] flex-shrink-0" />
                      : <div className="w-14 h-14 bg-[#F4F5F7] rounded-[8px] flex-shrink-0" aria-hidden="true" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">{product.name}</p>
                      <p className="text-[11px] text-[#60717B] mt-0.5 capitalize">{product.category?.name || '—'}</p>
                    </div>
                    {pct > 0 && (
                      <span className="flex-shrink-0 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        -{pct}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[11px] text-[#60717B]">Original</p>
                      <p className="text-[13px] text-[#60717B] line-through">Rs.{product.price?.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-[#E9E9E9]" aria-hidden="true" />
                    <div>
                      <p className="text-[11px] text-[#60717B]">Flash Price</p>
                      <p className="text-[15px] font-black text-[#FFB700]">Rs.{product.flashSalePrice?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 text-[12px] font-medium ${expired ? 'text-red-500' : 'text-green-600'}`}>
                    <FiClock size={12} aria-hidden="true" />
                    {remaining || 'No expiry set'}
                    {product.flashSaleEnds && (
                      <span className="ml-auto text-[11px] text-[#60717B] font-normal">
                        {new Date(product.flashSaleEnds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-[#F4F5F7]">
                    <button
                      onClick={() => openEdit(product)}
                      aria-label={`Edit flash sale for ${product.name}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold text-[#1A1A1A] border border-[#E9E9E9] rounded-[6px] hover:border-[#FFB700] hover:text-[#FFB700] transition-colors"
                    >
                      <FiEdit2 size={12} aria-hidden="true" /> Edit
                    </button>
                    <button
                      onClick={() => setRemoveTarget(product)}
                      aria-label={`Remove ${product.name} from flash sale`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold text-red-500 border border-red-100 rounded-[6px] hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 size={12} aria-hidden="true" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Flash Sale' : 'Add Flash Sale'}>
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} aria-hidden="true" />
          <div className="relative w-full max-w-[420px] bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E9E9E9]">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">{editing ? 'Edit Flash Sale' : 'Add Flash Sale'}</h3>
              <button onClick={closeDrawer} aria-label="Close drawer" className="text-[#60717B] hover:text-[#1A1A1A] transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-5 p-4 sm:p-6">
              {!editing && (
                <div>
                  <label className="text-[12px] font-semibold text-[#1A1A1A] block mb-1.5">Select Product</label>
                  {picked ? (
                    <div className="flex items-center gap-3 p-3 border border-[#FFB700] rounded-[8px] bg-amber-50">
                      {picked.images?.[0]?.url
                        ? <img src={picked.images[0].url} alt={picked.name} className="w-10 h-10 object-cover rounded-[6px]" />
                        : <div className="w-10 h-10 bg-[#F4F5F7] rounded-[6px]" aria-hidden="true" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{picked.name}</p>
                        <p className="text-[12px] text-[#60717B]">Rs.{picked.price?.toLocaleString()}</p>
                      </div>
                      <button type="button" onClick={() => setPicked(null)} aria-label="Remove selected product" className="text-[#60717B] hover:text-red-500 transition-colors">
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60717B]" aria-hidden="true" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        aria-label="Search products for flash sale"
                        className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                      />
                      {search && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-[#E9E9E9] rounded-[8px] mt-1 shadow-lg z-10 max-h-48 overflow-y-auto" role="listbox">
                          {filteredProducts.length === 0 ? (
                            <p className="text-[13px] text-[#60717B] p-3">No products found</p>
                          ) : filteredProducts.map((p) => (
                            <button
                              key={p._id}
                              type="button"
                              role="option"
                              onClick={() => { setPicked(p); setSearch(''); }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F4F5F7] text-left transition-colors"
                            >
                              {p.images?.[0]?.url
                                ? <img src={p.images[0].url} alt={p.name} className="w-8 h-8 object-cover rounded-[4px] flex-shrink-0" />
                                : <div className="w-8 h-8 bg-[#E9E9E9] rounded-[4px] flex-shrink-0" aria-hidden="true" />
                              }
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{p.name}</p>
                                <p className="text-[11px] text-[#60717B]">Rs.{p.price?.toLocaleString()}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {editing && (
                <div className="flex items-center gap-3 p-3 border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA]">
                  {editing.images?.[0]?.url
                    ? <img src={editing.images[0].url} alt={editing.name} className="w-10 h-10 object-cover rounded-[6px]" />
                    : <div className="w-10 h-10 bg-[#E9E9E9] rounded-[6px]" aria-hidden="true" />
                  }
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{editing.name}</p>
                    <p className="text-[12px] text-[#60717B]">Original: Rs.{editing.price?.toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="flash-price" className="text-[12px] font-semibold text-[#1A1A1A] block mb-1.5">
                  Flash Sale Price <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#60717B] font-medium" aria-hidden="true">Rs.</span>
                  <input
                    id="flash-price"
                    type="number"
                    min={1}
                    value={form.flashSalePrice}
                    onChange={setField('flashSalePrice')}
                    placeholder="e.g. 1500"
                    className="w-full pl-10 pr-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                  />
                </div>
                {form.flashSalePrice && currentTarget && (
                  <p className="text-[11px] text-green-600 mt-1 font-medium">
                    {discountPct(currentTarget.price, Number(form.flashSalePrice))}% off original price
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="flash-ends" className="text-[12px] font-semibold text-[#1A1A1A] block mb-1.5">
                  Offer Ends At <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="flash-ends"
                  type="datetime-local"
                  value={form.flashSaleEnds}
                  min={NOW_ISO()}
                  onChange={setField('flashSaleEnds')}
                  className="w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                />
              </div>

              <div className="mt-auto pt-4 border-t border-[#E9E9E9]">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {saving && <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                  {editing ? 'Save Changes' : 'Create Flash Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Flash Sale"
        message={`Remove "${removeTarget?.name}" from flash sales? The product will remain active at its original price.`}
        confirmLabel="Remove"
        variant="danger"
        loading={removing}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}