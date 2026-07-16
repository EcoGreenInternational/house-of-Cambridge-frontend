import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, createNewInvoice, deleteInvoice, updateInvoice } from '../../redux/slices/invoiceSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import { generateInvoicePDF } from '../../utils/invoiceGenerator.js';
import { FiSearch, FiPlus, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]';

const EMPTY_FORM = {
  invoiceType: 'manual',
  assignedPeople: '',
  dueDate: '',
  clientDetails: { clientName: '', companyName: '', address: '', email: '', phone: '' },
  discount: '',
  taxPercent: '',
};

export default function AdminInvoices() {
  const dispatch = useDispatch();

  // Connect to our new Redux store slice states
  const { invoices, loading, total: invoicesTotal } = useSelector((state) => state.invoice);
  const { products } = useSelector((state) => state.products || { products: [] });
  const { toasts, toast, removeToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  const loadInvoices = useCallback(() => {
    dispatch(fetchInvoices({ search: search || undefined, status: statusFilter || undefined }));
  }, [dispatch, search, statusFilter]);

  // Fetch past invoices automatically when page mounts
  useEffect(() => {
    loadInvoices();
    dispatch(fetchProducts());
  }, [loadInvoices, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadInvoices();
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      alert('Please choose a product from the list.');
      return;
    }
    if (quantity < 1) {
      alert('Quantity must be 1 or more.');
      return;
    }

    const existingIndex = items.findIndex((item) => item.productId === selectedProduct);

    if (existingIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += Number(quantity);
      setItems(updatedItems);
    } else {
      setItems([...items, { productId: selectedProduct, quantity: Number(quantity) }]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, idx) => idx !== indexToRemove));
  };


  const buildInvoicePayload = () => ({
    ...form,
    items,
    discount: Number(form.discount) || 0,
    taxPercent: Number(form.taxPercent) || 0,
  });

  const handleInvoiceAction = async (exportPdf = false) => {
    if (items.length === 0) {
      toast.error('Please add at least one product item to process.');
      return;
    }

    const payload = buildInvoicePayload();

    try {
      if (editing) {
        const resultAction = await dispatch(updateInvoice({ id: editing._id, invoiceData: payload })).unwrap();
        toast.success(exportPdf ? 'Invoice updated and exported successfully!' : 'Invoice updated successfully!');
        if (exportPdf && resultAction?.invoice) {
          generateInvoicePDF(resultAction.invoice);
        }
      } else {
        const resultAction = await dispatch(createNewInvoice(payload)).unwrap();
        toast.success(exportPdf ? 'Invoice created and exported successfully!' : 'Invoice created successfully!');
        if (resultAction?.invoice) {
          if (exportPdf) {
            generateInvoicePDF(resultAction.invoice);
          }
        }
      }
      closeForm();
      loadInvoices(); 
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Failed to complete transaction.');
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleInvoiceAction(false);
  };

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setItems([]); 
    setSelectedProduct('');
    setQuantity(1);
    setShowForm(true);
  }, []);

  const openEdit = (invoice) => {
    setEditing(invoice);
    setForm({
      invoiceType: invoice.invoiceType,
      assignedPeople: invoice.assignedPeople,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      clientDetails: {
        clientName: invoice.clientDetails?.clientName || '',
        companyName: invoice.clientDetails?.companyName || '',
        address: invoice.clientDetails?.address || '',
        email: invoice.clientDetails?.email || '',
        phone: invoice.clientDetails?.phone || '',
      },
      discount: invoice.discount || '',
      taxPercent: invoice.taxPercent || '',
    });
    setItems(invoice.items ? invoice.items.map(item => ({
      productId: item.product?._id || item.product || '', // Normalizes populated ID references
      quantity: item.quantity || 1
    })) : []);
    setSelectedProduct('');
    setQuantity(1);
    setShowForm(true);
  };

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setItems([]); 
    setSelectedProduct('');
    setQuantity(1);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDelLoading(true);
    try {
      await dispatch(deleteInvoice(deleteTarget._id)).unwrap();
      toast.success(`Invoice "${deleteTarget.invoiceNo}" deleted`);
      setDeleteTarget(null);
      loadInvoices();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Delete failed');
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h2 className="text-[20px] font-black text-[#1A1A1A]">
            Corporate Invoices <span className="text-[#60717B] font-normal text-[16px]">({invoicesTotal ?? 0})</span>
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors"
          >
            <FiPlus size={16} aria-hidden="true" /> Generate Invoice
          </button>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E9E9E9] p-4 flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]" role="search">
            <div className="relative flex-1">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60717B]" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name..."
                aria-label="Search invoices"
                className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-[#FFB700] text-[#1A1A1A] font-semibold text-[13px] rounded-[8px] hover:bg-amber-400 transition-colors">Search</button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by type"
            className="px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
          >
            <option value="">All Types</option>
            <option value="manual">Manual</option>
            <option value="online">Online</option>
          </select>
        </div>

        {/* Overview Table UI Container */}
        <div className="bg-white rounded-[12px] border border-[#E9E9E9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#60717B]">Sequence No.</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#60717B]">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#60717B]">Client Entity</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#60717B]">Assigned Associate</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#60717B]">Total Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#60717B]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && invoices.map((inv) => (
                  <tr key={inv._id} className="border-b border-[#F4F5F7] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 font-semibold text-blue-600">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 capitalize text-[#60717B]">{inv.invoiceType}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{inv.clientDetails?.clientName}</td>
                    <td className="px-4 py-3 text-[#60717B]">{inv.assignedPeople || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1A1A1A]">Rs. {inv.totalAmountDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(inv)} aria-label={`Edit ${inv.invoiceNo}`} className="text-[#60717B] hover:text-[#1A1A1A] transition-colors"><FiEdit2 size={15} /></button>
                        <button onClick={() => setDeleteTarget(inv)} aria-label={`Delete ${inv.invoiceNo}`} className="text-[#60717B] hover:text-red-600 transition-colors"><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && invoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-[#60717B]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#FFB700] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        Loading invoices...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && invoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#60717B]">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Invoice' : 'Generate Invoice'}>
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} aria-hidden="true" />
          <div className="relative ml-auto w-full max-w-[560px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-[#E9E9E9] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-[16px] font-bold text-[#1A1A1A]">{editing ? 'Edit Invoice' : 'Generate New Invoice'}</h3>
              <button onClick={closeForm} aria-label="Close drawer" className="text-[#60717B] hover:text-[#1A1A1A] transition-colors"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Invoice Type</label>
                  <select value={form.invoiceType} onChange={(e) => setForm(f => ({...f, invoiceType: e.target.value}))} className={INPUT_CLS}>
                    <option value="manual">Manual (Deduct Stock)</option>
                    <option value="online">Online System Process</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({...f, dueDate: e.target.value}))} className={INPUT_CLS} required />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1A1A1A] block mb-1">Assigned Executive</label>
                <input type="text" value={form.assignedPeople} onChange={(e) => setForm(f => ({...f, assignedPeople: e.target.value}))} placeholder="e.g. John Doe" className={INPUT_CLS} required />
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-[8px] space-y-3">
                <h4 className="text-[12px] font-bold text-[#FFB700] uppercase tracking-wider">Client Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">Client Name *</label>
                    <input type="text" value={form.clientDetails.clientName} onChange={(e) => setForm(f => ({...f, clientDetails: {...f.clientDetails, clientName: e.target.value}}))} className={INPUT_CLS} required />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">Company Name</label>
                    <input type="text" value={form.clientDetails.companyName} onChange={(e) => setForm(f => ({...f, clientDetails: {...f.clientDetails, companyName: e.target.value}}))} className={INPUT_CLS} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">Delivery Address</label>
                    <input type="text" value={form.clientDetails.address} onChange={(e) => setForm(f => ({...f, clientDetails: {...f.clientDetails, address: e.target.value}}))} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={form.clientDetails.email} onChange={(e) => setForm(f => ({...f, clientDetails: {...f.clientDetails, email: e.target.value}}))} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1">Phone</label>
                    <input type="tel" value={form.clientDetails.phone} onChange={(e) => setForm(f => ({...f, clientDetails: {...f.clientDetails, phone: e.target.value}}))} className={INPUT_CLS} />
                  </div>
                </div>
              </div>

              {/* Interactive Line Items Picker Grid */}
              <div className="border-t border-b border-[#E9E9E9] py-4 my-2 space-y-4">
                <h4 className="text-[12px] font-bold text-[#FFB700] uppercase tracking-wider">Line Items</h4>

                {/* Add Item Panel Row */}
                <div className="flex items-end gap-2 bg-[#FAFAFA] p-3 rounded-[8px] border border-[#E9E9E9]">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-[#1A1A1A] block mb-1">Select Product</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                    >
                      <option value="">-- Choose Product --</option>
                      {products?.map((prod) => (
                        <option key={prod._id} value={prod._id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[85px]">
                    <label className="text-[11px] font-semibold text-[#1A1A1A] block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-[#1A1A1A] text-white text-[13px] font-semibold rounded-[8px] hover:bg-zinc-800 transition-colors h-[38px] flex items-center justify-center"
                  >
                    Add
                  </button>
                </div>

                {/* Display List of Current Selected Items */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <p className="text-[12px] text-[#60717B] italic text-center py-2">No product items added to this invoice yet.</p>
                  ) : (
                    items.map((item, index) => {
                      // Find product object name to display accurately
                      const matchedProduct = products?.find(p => p._id === item.productId);
                      return (
                        <div key={index} className="flex items-center justify-between bg-[#FAFAFA] border border-[#E9E9E9] rounded-[8px] p-2 text-[13px]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1A1A1A]">{matchedProduct ? matchedProduct.name : 'Selected Product'}</span>
                            <span className="text-[11px] text-[#60717B]">ID: {item.productId}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#1A1A1A] bg-white px-2 py-1 rounded border border-[#E9E9E9]">
                              Qty: {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#F0F0F0]">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-[#E9E9E9] rounded-[8px] text-[13px] font-medium text-[#60717B] hover:bg-[#FAFAFA] transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#FFB700] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                  {editing ? 'Save Changes' : 'Generate Invoice'}
                </button>
                <button
                  type="button"
                  onClick={() => handleInvoiceAction(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 border border-[#1A1A1A] rounded-[8px] text-[13px] font-bold text-[#1A1A1A] hover:bg-[#FAFAFA] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                  Export PDF
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
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteTarget?.invoiceNo}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={delLoading}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}