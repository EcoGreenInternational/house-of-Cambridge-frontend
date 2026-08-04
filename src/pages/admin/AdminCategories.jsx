import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminCategories, fetchAdminCategory, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  fetchAdminBrands,
} from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage } from 'react-icons/fi';

const EMPTY = { name: '', slug: '', description: '', isActive: true, order: 0, brand: '', specifications: [] };
const EMPTY_SPEC = { key: '', value: '' };

const INPUT_CLS =
  'w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]';

const TEXT_FIELDS = [
  { key: 'name',        label: 'Name',               required: true },
  { key: 'slug',        label: 'Slug (auto if empty)' },
  { key: 'description', label: 'Description',         textarea: true },
];

const normalizeSpecs = (specs) => {
  if (Array.isArray(specs)) {
    return specs.map((spec) => ({
      key: spec?.key ?? spec?.name ?? '',
      value: spec?.value ?? spec?.text ?? '',
    }));
  }

  if (typeof specs === 'string' && specs.trim()) {
    try {
      const parsed = JSON.parse(specs);
      return Array.isArray(parsed) ? normalizeSpecs(parsed) : [];
    } catch {
      return [];
    }
  }

  return [];
};

export default function AdminCategories() {
  const dispatch = useDispatch();
  const { categories, brands = [], loading } = useSelector((s) => s.admin);
  const { toasts, toast, removeToast }       = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delLoading,   setDelLoading]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [file,         setFile]         = useState(null);
  const [preview,      setPreview]      = useState('');
  const [saving,       setSaving]       = useState(false);
  const [specs,        setSpecs]        = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAdminCategories());
    dispatch(fetchAdminBrands());
  }, [dispatch]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY);
    setSpecs([]);
    setFile(null);
    setPreview('');
    setShowForm(true);
  }, []);

  const openEditCategory = useCallback(async (c) => {
    setShowForm(true);
    setEditing(c);
    setForm({
      name:        c.name,
      slug:        c.slug || '',
      description: c.description || '',
      isActive:    c.isActive,
      order:       c.order ?? 0,
      brand:       c.brand?._id || c.brand || '',
    });
    setSpecs(normalizeSpecs(c.specifications));
    setFile(null);
    setPreview(c.image?.url || '');

    try {
      const result = await dispatch(fetchAdminCategory(c._id)).unwrap();
      const category = result?.category ?? result;
      if (!category) return;

      setEditing(category);
      setForm({
        name:        category.name ?? '',
        slug:        category.slug || '',
        description: category.description || '',
        isActive:    category.isActive ?? true,
        order:       category.order ?? 0,
        brand:       category.brand?._id || category.brand || '',
      });
      setSpecs(normalizeSpecs(category.specifications ?? category.specs ?? category.specification));
      setPreview(category.image?.url || c.image?.url || '');
    } catch {
      setSpecs(normalizeSpecs(c.specifications));
    }
  }, [dispatch]);

  const closeForm = useCallback(() => { setShowForm(false); setEditing(null); }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const addSpec = useCallback(() => setSpecs((s) => [...s, { ...EMPTY_SPEC }]), []);
  const removeSpec = useCallback((i) => setSpecs((s) => s.filter((_, idx) => idx !== i)), []);
  const setSpecField = (i, field) => (e) =>
    setSpecs((s) => s.map((row, idx) => (idx === i ? { ...row, [field]: e.target.value } : row)));

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, String(v)); });
      const cleanSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
      if (cleanSpecs.length) fd.append('specifications', JSON.stringify(cleanSpecs));
      if (file) fd.append('image', file);

      if (editing) {
        await dispatch(updateAdminCategory({ id: editing._id, formData: fd })).unwrap();
        toast.success('Category updated');
      } else {
        await dispatch(createAdminCategory(fd)).unwrap();
        toast.success('Category created');
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
      await dispatch(deleteAdminCategory(deleteTarget._id)).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Delete failed');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-[20px] font-black text-[#1A1A1A]">
            Categories <span className="text-[#60717B] font-normal text-[16px]">({categories.length})</span>
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors"
          >
            <FiPlus size={16} /> Add Category
          </button>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9]">
              <tr>
                {['Image', 'Name', 'Slug', 'Products', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[#60717B] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && !categories.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#60717B]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#FFB700] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#60717B]">No categories yet</td></tr>
              ) : categories.map((c) => (
                <tr key={c._id} className="border-b border-[#F4F5F7] hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    {c.image?.url
                      ? <img src={c.image.url} alt={c.name} className="w-10 h-10 object-cover rounded-[6px]" />
                      : <div className="w-10 h-10 bg-[#F4F5F7] rounded-[6px] flex items-center justify-center"><FiImage size={16} className="text-[#C5C5C5]" aria-hidden="true" /></div>
                    }
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{c.name}</td>
                  <td className="px-4 py-3 text-[#60717B] font-mono text-[12px]">{c.slug}</td>
                  <td className="px-4 py-3 text-[#60717B]">{c.productCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditCategory(c)} aria-label={`Edit ${c.name}`} className="text-[#60717B] hover:text-[#1A1A1A] transition-colors"><FiEdit2 size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} aria-label={`Delete ${c.name}`} className="text-[#60717B] hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Category' : 'Add Category'}>
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} aria-hidden="true" />
          <div className="relative ml-auto w-full max-w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E9E9E9] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-[16px] font-bold text-[#1A1A1A]">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={closeForm} aria-label="Close drawer" className="text-[#60717B] hover:text-[#1A1A1A] transition-colors"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              <div>
                <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-2">Image</label>
                <div className="flex items-center gap-3">
                  {preview
                    ? <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-[8px] border border-[#E9E9E9]" />
                    : <div className="w-16 h-16 border-2 border-dashed border-[#C5C5C5] rounded-[8px] flex items-center justify-center text-[#60717B]" aria-hidden="true"><FiImage size={20} /></div>
                  }
                  <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-[12px] font-medium border border-[#E9E9E9] rounded-[6px] text-[#60717B] hover:bg-[#FAFAFA] transition-colors">
                    {preview ? 'Change' : 'Upload'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              {TEXT_FIELDS.map(({ key, label, required, textarea }) => (
                <div key={key}>
                  <label htmlFor={`cat-${key}`} className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">
                    {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
                  </label>
                  {textarea
                    ? <textarea id={`cat-${key}`} value={form[key]} onChange={setField(key)} rows={2} maxLength={500} className={`${INPUT_CLS} resize-none`} />
                    : <input id={`cat-${key}`} value={form[key]} onChange={setField(key)} required={required} maxLength={key === 'name' ? 100 : 120} className={INPUT_CLS} />
                  }
                </div>
              ))}

              <div>
                <label htmlFor="cat-brand" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Brand</label>
                <select id="cat-brand" value={form.brand} onChange={setField('brand')} className={INPUT_CLS}>
                  <option value="">No brand</option>
                  {brands.filter((b) => b.isActive).map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] font-semibold text-[#1A1A1A]">Specifications</label>
                  <button
                    type="button"
                    onClick={addSpec}
                    className="text-[12px] font-medium text-[#FFB700] hover:underline"
                  >
                    + Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {specs.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        placeholder="Key"
                        value={row.key}
                        onChange={setSpecField(i, 'key')}
                        maxLength={100}
                        className={INPUT_CLS}
                        aria-label={`Specification ${i + 1} key`}
                      />
                      <input
                        placeholder="Value"
                        value={row.value}
                        onChange={setSpecField(i, 'value')}
                        maxLength={300}
                        className={INPUT_CLS}
                        aria-label={`Specification ${i + 1} value`}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(i)}
                        aria-label={`Remove specification ${i + 1}`}
                        className="text-[#60717B] hover:text-red-600 flex-shrink-0"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                  {specs.length === 0 && (
                    <p className="text-[12px] text-[#60717B]">No specifications added.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cat-order" className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Sort Order</label>
                  <input id="cat-order" type="number" min={0} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} className={INPUT_CLS} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#FFB700]" />
                    <span className="text-[13px] text-[#1A1A1A] font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#F0F0F0]">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-[#E9E9E9] rounded-[8px] text-[13px] font-medium text-[#60717B] hover:bg-[#FAFAFA] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {saving && <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                  {editing ? 'Save Changes' : 'Create Category'}
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
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Categories with products cannot be deleted — reassign products first.`}
        confirmLabel="Delete"
        variant="danger"
        loading={delLoading}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}