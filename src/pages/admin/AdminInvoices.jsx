import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvoices, createNewInvoice, deleteInvoice, updateInvoice } from '../../redux/slices/invoiceSlice';
import { fetchProducts } from '../../redux/slices/productSlice';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import { generateInvoicePDF } from '../../utils/invoiceGenerator.js';
import { FiSearch, FiPlus, FiX, FiEdit2, FiTrash2, FiPackage, FiEdit3 } from 'react-icons/fi';

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]';

const EMPTY_FORM = {
  invoiceType: 'manual',
  assignedPeople: '',
  dueDate: '',
  clientDetails: { clientName: '', companyName: '', address: '', email: '', phone: '' },
  discount: '',
  taxPercent: '',
  deliveryFee: '',
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
  const [itemMode, setItemMode] = useState('catalog'); // 'catalog' | 'custom'
  const [selectedProduct, setSelectedProduct] = useState('');
  const [catalogPrice, setCatalogPrice] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingItemId, setEditingItemId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const productDropdownRef = useRef(null);

  // Ever-incrementing counter for line item IDs (NP_0001, NP_0002, ...)
  // Using a ref (not state) so it persists across renders without
  // triggering re-renders itself, and never reuses a number even
  // after items are removed.
  const itemCounterRef = useRef(0);

  const generateItemId = () => {
    itemCounterRef.current += 1;
    return `NP_${String(itemCounterRef.current).padStart(4, '0')}`;
  };

  const loadInvoices = useCallback(() => {
    dispatch(fetchInvoices({ search: search || undefined, status: statusFilter || undefined }));
  }, [dispatch, search, statusFilter]);

  // Fetch past invoices and all available catalog products automatically
  useEffect(() => {
    loadInvoices();
    dispatch(fetchProducts({ limit: 96 }));
  }, [loadInvoices, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadInvoices();
  };

  // When a catalog product is chosen, automatically set its default price
  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    const prod = products?.find((p) => p._id === productId);
    if (prod) {
      setCatalogPrice(prod.price ?? 0);
      setProductSearch(prod.name);
    } else {
      setCatalogPrice('');
      setProductSearch('');
    }
    setShowProductList(false);
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    if (item.productId) {
      setItemMode('catalog');
      setSelectedProduct(item.productId);
      setCatalogPrice(item.unitPrice);
      setQuantity(item.quantity);
      setProductSearch(item.name);
    } else {
      setItemMode('custom');
      setCustomName(item.name);
      setCustomPrice(item.unitPrice);
      setQuantity(item.quantity);
    }
  };

  const handleAddItem = () => {
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      toast.error('Quantity must be 1 or more.');
      return;
    }

    if (itemMode === 'catalog') {
      if (!selectedProduct) {
        toast.error('Please choose a product from the catalog list.');
        return;
      }
      const prod = products?.find((p) => p._id === selectedProduct);
      if (!prod) {
        toast.error('Selected product not found in catalog.');
        return;
      }

      const unitPrice = catalogPrice !== '' && !isNaN(Number(catalogPrice)) && Number(catalogPrice) >= 0
        ? Number(catalogPrice)
        : (prod.price || 0);

      if (editingItemId) {
        setItems(items.map((it) =>
          it.id === editingItemId
            ? { ...it, productId: prod._id, name: prod.name, unitPrice, quantity: qty, total: unitPrice * qty, stock: prod.stock }
            : it
        ));
        setEditingItemId(null);
      } else {
        const existingIndex = items.findIndex((item) => item.productId === selectedProduct);

        if (existingIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += qty;
          updatedItems[existingIndex].unitPrice = unitPrice;
          updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * unitPrice;
          setItems(updatedItems);
        } else {
          setItems([
            ...items,
            {
              id: generateItemId(),
              productId: prod._id,
              name: prod.name,
              unitPrice,
              quantity: qty,
              total: unitPrice * qty,
              stock: prod.stock,
            },
          ]);
        }
      }

      setSelectedProduct('');
      setCatalogPrice('');
      setProductSearch('');
      setQuantity(1);
    } else {
      // Custom / Non-catalog item
      if (!customName || !customName.trim()) {
        toast.error('Please enter a product or service name.');
        return;
      }
      const unitPrice = customPrice !== '' && !isNaN(Number(customPrice)) && Number(customPrice) >= 0
        ? Number(customPrice)
        : 0;

      if (editingItemId) {
        setItems(items.map((it) =>
          it.id === editingItemId
            ? { ...it, name: customName.trim(), unitPrice, quantity: qty, total: unitPrice * qty }
            : it
        ));
        setEditingItemId(null);
      } else {
        setItems([
          ...items,
          {
            id: generateItemId(),
            productId: null,
            name: customName.trim(),
            unitPrice,
            quantity: qty,
            total: unitPrice * qty,
          },
        ]);
      }

      setCustomName('');
      setCustomPrice('');
      setQuantity(1);
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setSelectedProduct('');
    setCatalogPrice('');
    setProductSearch('');
    setCustomName('');
    setCustomPrice('');
    setQuantity(1);
  };

  const handleRemoveItem = (idToRemove) => {
    setItems(items.filter((item) => item.id !== idToRemove));
  };

  const filteredProducts = (products || []).filter((product) =>
    product.name?.toLowerCase().includes(productSearch.trim().toLowerCase())
  );

  // Financial calculations
  const calcSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || (Number(item.unitPrice) * Number(item.quantity))), 0);
  const discountVal = Number(form.discount) || 0;
  const deliveryFeeVal = Number(form.deliveryFee) || 0;
  const taxPercentVal = Number(form.taxPercent) || 0;
  const taxableAmount = Math.max(0, calcSubtotal - discountVal);
  const calcTaxAmount = Math.round(taxableAmount * (taxPercentVal / 100));
  const calcTotalDue = taxableAmount + calcTaxAmount + deliveryFeeVal;

  const buildInvoicePayload = () => ({
    ...form,
    items: items.map((i) => ({
      productId: i.productId || undefined,
      name: i.name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      total: Number(i.total),
    })),
    discount: discountVal,
    deliveryFee: deliveryFeeVal,
    taxPercent: taxPercentVal,
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
    itemCounterRef.current = 0;
    setEditingItemId(null);
    setItemMode('catalog');
    setSelectedProduct('');
    setCatalogPrice('');
    setProductSearch('');
    setCustomName('');
    setCustomPrice('');
    setQuantity(1);
    setShowForm(true);
    dispatch(fetchProducts({ limit: 96 }));
  }, [dispatch]);

  const openEdit = (invoice) => {
    setEditing(invoice);
    setForm({
      invoiceType: invoice.invoiceType,
      assignedPeople: invoice.assignedPeople || '',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      clientDetails: {
        clientName: invoice.clientDetails?.clientName || '',
        companyName: invoice.clientDetails?.companyName || '',
        address: invoice.clientDetails?.address || '',
        email: invoice.clientDetails?.email || '',
        phone: invoice.clientDetails?.phone || '',
      },
      discount: invoice.discount ?? '',
      deliveryFee: invoice.deliveryFee ?? '',
      taxPercent: invoice.taxPercent ?? '',
    });

    itemCounterRef.current = 0;
  setEditingItemId(null);
    setItems(invoice.items ? invoice.items.map(item => ({
      id: generateItemId(),
      productId: item.product?._id || (typeof item.product === 'string' ? item.product : null),
      name: item.name || item.product?.name || 'Item',
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 1,
      total: Number(item.total) || (Number(item.unitPrice || 0) * Number(item.quantity || 1)),
    })) : []);
    setItemMode('catalog');
    setSelectedProduct('');
    setCatalogPrice('');
    setProductSearch('');
    setCustomName('');
    setCustomPrice('');
    setQuantity(1);
    setShowForm(true);
  };

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setItems([]);
    itemCounterRef.current = 0;
    setEditingItemId(null);
    setSelectedProduct('');
    setCatalogPrice('');
    setProductSearch('');
    setCustomName('');
    setCustomPrice('');
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[12px] font-bold text-[#FFB700] uppercase tracking-wider">Line Items</h4>
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex bg-[#F4F5F7] p-1 rounded-[8px] border border-[#E9E9E9] text-[12px]">
                    <button
                      type="button"
                      onClick={() => setItemMode('catalog')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] font-semibold transition-all ${
                        itemMode === 'catalog'
                          ? 'bg-[#FFB700] text-[#1A1A1A] shadow-sm'
                          : 'text-[#60717B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      <FiPackage size={13} />
                      Catalog Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemMode('custom')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] font-semibold transition-all ${
                        itemMode === 'custom'
                          ? 'bg-[#FFB700] text-[#1A1A1A] shadow-sm'
                          : 'text-[#60717B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      <FiEdit3 size={13} />
                      New Product
                    </button>
                  </div>
                </div>

                {/* Mode 1: Catalog Product Selection */}
                {itemMode === 'catalog' ? (
                  <div className="bg-[#FAFAFA] p-3 rounded-[8px] border border-[#E9E9E9] space-y-3">
                    <div className="relative" ref={productDropdownRef}>
                      <label className="text-[11px] font-semibold text-[#1A1A1A] block mb-1">
                        Select Product from Database Catalog
                      </label>
                      <div className="relative">
                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60717B]" aria-hidden="true" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductList(true);
                            if (selectedProduct) {
                              setSelectedProduct('');
                              setCatalogPrice('');
                            }
                          }}
                          onFocus={() => setShowProductList(true)}
                          placeholder="Search product by name..."
                          autoComplete="off"
                          className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                        />
                      </div>

                      {showProductList && (
                        <div className="absolute z-20 mt-1 w-full max-h-[220px] overflow-y-auto bg-white border border-[#E9E9E9] rounded-[8px] shadow-lg">
                          {filteredProducts.length === 0 ? (
                            <div className="px-3 py-2 text-[12px] text-[#60717B] italic">No products found.</div>
                          ) : (
                            filteredProducts.map((prod) => (
                              <button
                                type="button"
                                key={prod._id}
                                onClick={() => handleProductSelect(prod._id)}
                                className="w-full text-left px-3 py-2 text-[13px] hover:bg-amber-50 transition-colors flex justify-between items-center gap-2"
                              >
                                <span className="truncate">{prod.name}</span>
                                <span className="text-[11px] text-[#60717B] shrink-0">
                                  Rs. {prod.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Stock: {prod.stock ?? 0})
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-[#1A1A1A] block mb-1">
                          Unit Price (Rs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Price"
                          value={catalogPrice}
                          onChange={(e) => setCatalogPrice(e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                        />
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
                        className="px-4 py-2 bg-[#FFB700] text-[#1A1A1A] text-[13px] font-bold rounded-[8px] hover:bg-amber-400 transition-colors h-[38px] flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <FiPlus size={15} /> {editingItemId ? 'Update Item' : 'Add Item'}
                      </button>
                      {editingItemId && (
                        <button
                          type="button"
                          onClick={handleCancelEditItem}
                          className="px-3 py-2 border border-[#E9E9E9] text-[#60717B] text-[13px] font-semibold rounded-[8px] hover:bg-white transition-colors h-[38px]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Custom / Non-Catalog Item Entry */
                  <div className="bg-amber-50/40 p-3 rounded-[8px] border border-amber-200/80 space-y-3">
                    <div className="text-[11px] text-[#60717B] flex items-center gap-1.5">
                      <span className="font-semibold text-[#1A1A1A]">Custom Item:</span> Add an offline, custom, or non-catalog item directly to this invoice.
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#1A1A1A] block mb-1">
                        Product Name 
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Custom Wood Carving or Special Service"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-[#1A1A1A] block mb-1">
                          Unit Price (Rs.) 
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 2500"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-white focus:outline-none focus:border-[#FFB700]"
                        />
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
                        className="px-4 py-2 bg-[#1A1A1A] text-white text-[13px] font-bold rounded-[8px] hover:bg-zinc-800 transition-colors h-[38px] flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <FiPlus size={15} /> {editingItemId ? 'Update Item' : 'Add Custom'}
                      </button>
                      {editingItemId && (
                        <button
                          type="button"
                          onClick={handleCancelEditItem}
                          className="px-3 py-2 border border-[#E9E9E9] text-[#60717B] text-[13px] font-semibold rounded-[8px] hover:bg-white transition-colors h-[38px]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Display List of Current Selected Items */}
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="text-center py-4 bg-[#FAFAFA] rounded-[8px] border border-dashed border-[#E0E0E0]">
                      <p className="text-[12px] text-[#60717B] italic">No product items added to this invoice yet.</p>
                      <p className="text-[11px] text-[#9E9E9E] mt-0.5">Select a catalog product or add a custom item above.</p>
                    </div>
                  ) : (
                    items.map((item) => {
                      const isCustom = !item.productId;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-[#FAFAFA] border border-[#E9E9E9] rounded-[8px] p-2.5 text-[13px] hover:bg-amber-50/20 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#9E9E9E]">{item.id}</span>
                              <span className="font-semibold text-[#1A1A1A] truncate">{item.name}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isCustom
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isCustom ? 'Custom' : 'Catalog'}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#60717B]">
                              Rs. {Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} × {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-[#1A1A1A]">
                              Rs. {(Number(item.unitPrice || 0) * Number(item.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEditItem(item)}
                              className="text-[#60717B] hover:text-[#1A1A1A] transition-colors p-1"
                              aria-label="Edit item"
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Discount, Delivery Fee & Tax Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider block mb-1">
                    Discount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={form.discount}
                    onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider block mb-1">
                    Delivery Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={form.deliveryFee}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider block mb-1">
                    Tax / VAT (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="0"
                    value={form.taxPercent}
                    onChange={(e) => setForm((f) => ({ ...f, taxPercent: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="bg-[#1A1A1A] text-white p-3.5 rounded-[8px] space-y-1.5 text-[12px]">
                <div className="flex justify-between text-zinc-300">
                  <span>Subtotal:</span>
                  <span className="font-semibold">Rs. {calcSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Discount:</span>
                    <span className="font-semibold">- Rs. {discountVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {taxPercentVal > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Tax ({taxPercentVal}%):</span>
                    <span className="font-semibold">+ Rs. {calcTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {deliveryFeeVal > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Delivery Fee:</span>
                    <span className="font-semibold">+ Rs. {deliveryFeeVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t border-zinc-700 pt-1.5 flex justify-between items-center text-[14px] font-bold text-[#FFB700]">
                  <span>Total Amount Due:</span>
                  <span>Rs. {calcTotalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
