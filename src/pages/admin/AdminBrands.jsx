import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrands, createBrand, updateBrand, deleteBrand } from '../../redux/slices/brandSlice.js';
import { fetchAdminCategories } from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiImage,
  FiSearch, FiChevronDown, FiTag,
} from 'react-icons/fi';

const EMPTY_FORM = { name: '', description: '', category: '', isActive: true, order: 0 };
const EMPTY_SPEC = { key: '', value: '' };

const INPUT_CLS =
  'w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]';

export default function AdminBrands() {
  const dispatch = useDispatch();
  const { brands, loading: brandsLoading } = useSelector((s) => s.brands);
  const { categories }                     = useSelector((s) => s.admin);
  const { toasts, toast, removeToast }     = useToast();

  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showForm,       setShowForm]       = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [logoFile,       setLogoFile]       = useState(null);
  const [logoPreview,    setLogoPreview]    = useState('');
  const [saving,         setSaving]         = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [delLoading,     setDelLoading]     = useState(false);
  const [specs,          setSpecs]          = useState([]);
  const fileRef = useRef(null);

  useEffect(() => { dispatch(fetchAdminCategories()); }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBrands(filterCategory ? { category: filterCategory } : {}));
  }, [dispatch, filterCategory]);

  const filtered = brands.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q);
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: filterCategory });
    setLogoFile(null);
    setLogoPreview('');
    setSpecs([]);
    setShowForm(true);
  }, [filterCategory]);

  const openEdit = useCallback((brand) => {
    setEditing(brand);
    setForm({
      name:        brand.name,
      description: brand.description || '',
      category:    brand.category?._id || brand.category || '',
      isActive:    brand.isActive,
      order:       brand.order ?? 0,
    });
    setLogoFile(null);
    setLogoPreview(brand.logo?.url || '');
    setSpecs(Array.isArray(brand.specifications)
      ? brand.specifications.map((spec) => ({
        key: spec?.key ?? spec?.name ?? '',
        value: spec?.value ?? spec?.text ?? '',
      }))
      : []);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => { setShowForm(false); setEditing(null); }, []);

  const handleLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Brand name is required');
    if (!form.category)    return toast.error('Please select a category');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('description', form.description);
      fd.append('category',    form.category);
      fd.append('isActive',    String(form.isActive));
      fd.append('order',       String(form.order));
      fd.append('specifications', JSON.stringify(specs.filter((spec) => spec.key.trim() && spec.value.trim())));
      if (logoFile) fd.append('logo', logoFile);

      if (editing) {
        await dispatch(updateBrand({ id: editing._id, formData: fd })).unwrap();
        toast.success('Brand updated successfully');
      } else {
        await dispatch(createBrand(fd)).unwrap();
        toast.success('Brand created successfully');
      }
      closeForm();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await dispatch(deleteBrand(deleteTarget._id)).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Delete failed');
    } finally {
      setDelLoading(false);
    }
  };

  const getCategoryName = (brand) =>
    brand.category?.name || categories.find((c) => c._id === brand.category)?.name || '—';

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const addSpec = () => setSpecs((current) => [...current, { ...EMPTY_SPEC }]);
  const removeSpec = (index) => setSpecs((current) => current.filter((_, i) => i !== index));
  const setSpecField = (index, field) => (e) => setSpecs((current) =>
    current.map((spec, i) => (i === index ? { ...spec, [field]: e.target.value } : spec)));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[20px] font-black text-[#1A1A1A]">
              Brands <span className="text-[#60717B] font-normal text-[16px]">({filtered.length})</span>
            </h2>
            <p className="text-[13px] text-[#60717B] mt-0.5">Manage brands per category</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors"
          >
            <FiPlus size={16} /> Add Brand
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60717B]" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands…"
              aria-label="Search brands"
              className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
            />
          </div>

          <div className="relative">
            <FiTag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60717B]" aria-hidden="true" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter by category"
              className="pl-8 pr-8 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700] appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <FiChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#60717B] pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Category quick filters">
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${filterCategory === '' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E9E9E9] text-[#60717B] hover:border-[#FFB700]'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setFilterCategory(c._id)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${filterCategory === c._id ? 'bg-[#FFB700] text-[#1A1A1A] border-[#FFB700]' : 'border-[#E9E9E9] text-[#60717B] hover:border-[#FFB700]'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9]">
              <tr>
                {['Logo', 'Brand Name', 'Category', 'Description', 'Order', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[#60717B] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brandsLoading && brands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#60717B]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#FFB700] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      Loading brands…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#60717B]">
                    <div className="flex flex-col items-center gap-2">
                      <FiTag size={28} className="text-[#E9E9E9]" aria-hidden="true" />
                      <p className="font-medium">No brands found</p>
                      {filterCategory && (
                        <button onClick={openCreate} className="text-[12px] text-[#FFB700] hover:underline font-semibold">
                          Add one?
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map((brand) => (
                <tr key={brand._id} className="border-b border-[#F4F5F7] hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    {brand.logo?.url ? (
                      <img src={brand.logo.url} alt={brand.name} className="w-10 h-10 object-contain rounded-[6px] border border-[#E9E9E9] bg-white p-0.5" />
                    ) : (
                      <div className="w-10 h-10 bg-[#F4F5F7] rounded-[6px] flex items-center justify-center">
                        <FiImage size={16} className="text-[#C5C5C5]" aria-hidden="true" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1A1A1A]">{brand.name}</p>
                    <p className="text-[11px] text-[#60717B] font-mono">{brand.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                      {getCategoryName(brand)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#60717B] max-w-[200px]">
                    <p className="line-clamp-1">{brand.description || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-[#60717B] text-center">{brand.order ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(brand)}
                        aria-label={`Edit ${brand.name}`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#60717B] hover:bg-[#F4F5F7] hover:text-[#1A1A1A] transition-colors"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(brand)}
                        aria-label={`Delete ${brand.name}`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#60717B] hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Brand' : 'Add Brand'}>
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} aria-hidden="true" />
          <div className="relative ml-auto w-full max-w-[460px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E9E9E9] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-[16px] font-bold text-[#1A1A1A]">{editing ? 'Edit Brand' : 'Add New Brand'}</h3>
                {editing && <p className="text-[12px] text-[#60717B] mt-0.5">Editing: <span className="font-semibold text-[#1A1A1A]">{editing.name}</span></p>}
              </div>
              <button onClick={closeForm} aria-label="Close drawer" className="w-8 h-8 flex items-center justify-center rounded-full text-[#60717B] hover:bg-[#F4F5F7] transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              <div>
                <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-2">Brand Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-[10px] border border-[#E9E9E9] bg-white p-1" />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                        aria-label="Remove logo"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <FiX size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-[#C5C5C5] rounded-[10px] flex flex-col items-center justify-center gap-1 text-[#60717B]" aria-hidden="true">
                      <FiImage size={20} />
                      <span className="text-[10px]">Logo</span>
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-4 py-2 text-[12px] font-semibold border border-[#E9E9E9] rounded-[8px] text-[#1A1A1A] hover:bg-[#FAFAFA] transition-colors"
                    >
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    <p className="text-[11px] text-[#60717B] mt-1">PNG, JPG · Max 5 MB</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>

              <div>
                <label htmlFor="brand-category" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                  Category <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <select
                    id="brand-category"
                    value={form.category}
                    onChange={setField('category')}
                    required
                    className={`${INPUT_CLS} appearance-none pr-8`}
                  >
                    <option value="">— Select a category —</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <FiChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#60717B] pointer-events-none" aria-hidden="true" />
                </div>
              </div>

              <div>
                <label htmlFor="brand-name" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                  Brand Name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="brand-name"
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="e.g. Nike, Samsung, L'Oréal"
                  required
                  maxLength={100}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label htmlFor="brand-desc" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                  Description <span className="text-[#60717B] font-normal">(optional)</span>
                </label>
                <textarea
                  id="brand-desc"
                  value={form.description}
                  onChange={setField('description')}
                  placeholder="Short description about the brand…"
                  rows={3}
                  maxLength={500}
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] font-semibold text-[#1A1A1A]">Specifications</label>
                  <button type="button" onClick={addSpec} className="text-[12px] font-medium text-[#FFB700] hover:underline">
                    + Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {specs.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        value={spec.key}
                        onChange={setSpecField(index, 'key')}
                        placeholder="Key"
                        maxLength={100}
                        className={INPUT_CLS}
                        aria-label={`Brand specification ${index + 1} key`}
                      />
                      <input
                        value={spec.value}
                        onChange={setSpecField(index, 'value')}
                        placeholder="Value"
                        maxLength={300}
                        className={INPUT_CLS}
                        aria-label={`Brand specification ${index + 1} value`}
                      />
                      <button type="button" onClick={() => removeSpec(index)} aria-label={`Remove brand specification ${index + 1}`} className="text-[#60717B] hover:text-red-600 flex-shrink-0">
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                  {specs.length === 0 && <p className="text-[12px] text-[#60717B]">No specifications added.</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brand-order" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Sort Order</label>
                  <input
                    id="brand-order"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-[#FFB700]"
                    />
                    <span className="text-[13px] text-[#1A1A1A] font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#F0F0F0]">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-[#E9E9E9] rounded-[8px] text-[13px] font-medium text-[#60717B] hover:bg-[#FAFAFA] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-[#1A1A1A]/40 border-t-[#1A1A1A] rounded-full animate-spin" aria-hidden="true" />}
                  {editing ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Brand"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. Products linked to this brand will lose the brand reference.`}
        confirmLabel="Delete"
        variant="danger"
        loading={delLoading}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}