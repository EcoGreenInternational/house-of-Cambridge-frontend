import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchApprovals,
  approveProduct,
  rejectProduct,
  bulkApproveProducts,
  fetchApprovalStats,
  fetchGlobalDiscountStatus,
  approveGlobalDiscountRequest,
  rejectGlobalDiscountRequest,
} from '../../redux/slices/adminSlice.js';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { ToastContainer } from '../../components/ui/Toast.jsx';
import useToast from '../../hooks/useToast.js';
import {
  FiSearch,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiPackage,
  FiLayers,
  FiTag,
  FiUser,
} from 'react-icons/fi';

const PAGE_SIZE = 15;
const STATUS_TABS = [
  { id: 'pending', label: 'Pending Approval' },
  { id: 'approved', label: 'Approved & Live' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All Items' },
];

const STATUS_BADGES = {
  pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: FiClock,
    label: 'Pending Approval',
  },
  approved: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: FiCheckCircle,
    label: 'Approved & Live',
  },
  rejected: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: FiAlertCircle,
    label: 'Rejected',
  },
  draft: {
    bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    icon: FiLayers,
    label: 'Draft',
  },
};

export default function AdminApprovals() {
  const dispatch = useDispatch();
  const { approvals = [], approvalsTotal = 0, pendingApprovalsCount = 0, loading, globalDiscount = {} } = useSelector(
    (s) => s.admin
  );
  const { toasts, toast, removeToast } = useToast();

  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Preview modal state
  const [previewProduct, setPreviewProduct] = useState(null);

  // Bulk action state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const totalPages = Math.max(1, Math.ceil((approvalsTotal ?? 0) / PAGE_SIZE));

  const loadData = useCallback(
    (s = search, t = tab, p = page) => {
      dispatch(
        fetchApprovals({
          search: s.trim() || undefined,
          status: t === 'all' ? undefined : t,
          page: p,
          limit: PAGE_SIZE,
        })
      );
      dispatch(fetchApprovalStats());
    },
    [dispatch, search, tab, page]
  );

  useEffect(() => {
    loadData(search, tab, page);
    dispatch(fetchGlobalDiscountStatus());
  }, [tab, page, loadData, dispatch]);

  const handleApproveGlobalDiscount = async (requestId) => {
    try {
      const res = await dispatch(approveGlobalDiscountRequest(requestId)).unwrap();
      toast.success(res.message || 'Global discount approved and applied!');
      dispatch(fetchGlobalDiscountStatus());
      loadData(search, tab, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Approval failed');
    }
  };

  const handleRejectGlobalDiscount = async (requestId) => {
    try {
      const res = await dispatch(rejectGlobalDiscountRequest({ id: requestId })).unwrap();
      toast.success(res.message || 'Global discount request rejected');
      dispatch(fetchGlobalDiscountStatus());
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Rejection failed');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData(search, tab, 1);
  };

  const handleApprove = async (productId) => {
    setActionLoadingId(productId);
    try {
      await dispatch(approveProduct(productId)).unwrap();
      toast.success('Product approved and published to website!');
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      loadData(search, tab, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await dispatch(
        rejectProduct({ id: rejectTarget._id, note: rejectReason.trim() })
      ).unwrap();
      toast.success(`Product "${rejectTarget.name}" rejected`);
      setRejectTarget(null);
      setRejectReason('');
      setSelectedIds((prev) => prev.filter((id) => id !== rejectTarget._id));
      loadData(search, tab, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Rejection failed');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkApproving(true);
    try {
      const res = await dispatch(bulkApproveProducts(selectedIds)).unwrap();
      toast.success(res.message || `${selectedIds.length} products approved!`);
      setSelectedIds([]);
      setBulkModalOpen(false);
      loadData(search, tab, page);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Bulk approval failed');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === approvals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(approvals.map((p) => p._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-black text-[#1A1A1A] tracking-tight">
                Super Admin Approvals
              </h1>
              {pendingApprovalsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#FFB700] text-[#1A1A1A]">
                  {pendingApprovalsCount} Pending
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#60717B] mt-1">
              Review and approve product listings and stock inventory updates before they go live on the website.
            </p>
          </div>

          {selectedIds.length > 0 && tab === 'pending' && (
            <button
              type="button"
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#1A1A1A] text-[#FFB700] font-bold text-[13px] hover:bg-black transition-colors shadow-sm"
            >
              <FiCheckCircle size={16} />
              Approve Selected ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Global Discount Requests Section */}
        {globalDiscount.pendingRequests?.length > 0 && (
          <div className="p-5 rounded-[16px] bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-400 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#FFB700] text-[#1A1A1A] flex items-center justify-center font-black text-[14px]">
                  %
                </span>
                <div>
                  <h3 className="font-black text-[15px] text-[#1A1A1A]">
                    Pending 11:11 Storewide Global Discount Request
                  </h3>
                  <p className="text-[12px] text-[#60717B]">
                    Staff admin has requested a storewide discount. Super Admin approval is required.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                Requires Approval
              </span>
            </div>

            {globalDiscount.pendingRequests.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-[12px] bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[15px] text-[#1A1A1A]">
                      {req.action === 'reset'
                        ? 'Remove / Reset Global Discount'
                        : `Apply Flat ${req.discountPercent}% OFF to ALL Products`}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-zinc-100 text-zinc-700">
                      Requested by {req.requestedBy?.name || 'Staff Admin'}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="text-[12px] text-[#60717B] mt-1">
                      Reason: {req.reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveGlobalDiscount(req._id)}
                    className="px-4 py-2 rounded-[8px] bg-emerald-600 text-white font-bold text-[12px] hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                  >
                    Approve &amp; Apply Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectGlobalDiscount(req._id)}
                    className="px-3 py-2 rounded-[8px] border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[12px] transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Tabs and Search */}
        <div className="bg-white p-4 rounded-[12px] border border-[#E9E9E9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1 bg-[#FAFAFA] p-1 rounded-[8px] border border-[#E9E9E9]">
            {STATUS_TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setPage(1);
                    setSelectedIds([]);
                  }}
                  className={`px-3.5 py-1.5 rounded-[6px] text-[12px] font-bold transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-white text-[#1A1A1A] shadow-sm'
                      : 'text-[#60717B] hover:text-[#1A1A1A]'
                  }`}
                >
                  {label}
                  {id === 'pending' && pendingApprovalsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 min-w-[260px] md:max-w-sm">
            <div className="relative flex-1">
              <FiSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]"
              />
              <input
                type="text"
                placeholder="Search by name, SKU, or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#FAFAFA] border border-[#E9E9E9] rounded-[8px] focus:outline-none focus:border-[#FFB700]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-[8px] bg-[#1A1A1A] text-white text-[12px] font-semibold hover:bg-black transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-[12px] border border-[#E9E9E9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9] text-[11px] font-bold uppercase tracking-wider text-[#60717B]">
                <tr>
                  {tab === 'pending' && (
                    <th className="px-4 py-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          approvals.length > 0 &&
                          selectedIds.length === approvals.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-[#C5C5C5] text-[#FFB700] focus:ring-[#FFB700] cursor-pointer"
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category / Brand</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock & Varieties</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {loading && approvals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#60717B]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-[#FFB700] border-t-transparent rounded-full animate-spin" />
                        Loading items…
                      </div>
                    </td>
                  </tr>
                ) : approvals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#60717B]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-[#E9E9E9] flex items-center justify-center mx-auto text-[#60717B]">
                          <FiCheckCircle size={22} className="text-emerald-500" />
                        </div>
                        <p className="font-semibold text-[#1A1A1A]">No approvals in this queue</p>
                        <p className="text-[12px] text-[#A0A0A0]">
                          {tab === 'pending'
                            ? 'All stock and product submissions have been reviewed.'
                            : 'No records found for the selected filter.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  approvals.map((p) => {
                    const statusInfo =
                      STATUS_BADGES[p.approvalStatus] || STATUS_BADGES.pending;
                    const StatusIcon = statusInfo.icon;
                    const hasVariants =
                      Array.isArray(p.variants) && p.variants.length > 0;
                    const totalVariantStock = hasVariants
                      ? p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
                      : p.stock;

                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-[#FAFAFA] transition-colors"
                      >
                        {tab === 'pending' && (
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p._id)}
                              onChange={() => toggleSelectOne(p._id)}
                              className="rounded border-[#C5C5C5] text-[#FFB700] focus:ring-[#FFB700] cursor-pointer"
                              aria-label={`Select ${p.name}`}
                            />
                          </td>
                        )}

                        {/* Product Info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0]?.url ? (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-[8px] border border-[#E9E9E9] bg-white flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-[8px] bg-[#F4F5F7] border border-[#E9E9E9] flex items-center justify-center text-[#A0A0A0] flex-shrink-0">
                                <FiPackage size={18} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#1A1A1A] truncate max-w-[240px]">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[11px] text-[#60717B] bg-[#F4F5F7] px-1.5 py-0.5 rounded">
                                  {p.productCode || 'NO-CODE'}
                                </span>
                                {p.sku && (
                                  <span className="font-mono text-[11px] text-[#808080]">
                                    SKU: {p.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Brand */}
                        <td className="px-4 py-3 text-[#60717B]">
                          <p className="font-medium text-[#1A1A1A]">
                            {p.category?.name || 'Uncategorized'}
                          </p>
                          <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                            {p.brand?.name || 'No Brand'}
                          </p>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1A1A1A]">
                            Rs. {Number(p.price || 0).toLocaleString()}
                          </p>
                          {p.comparePrice > p.price && (
                            <p className="text-[11px] text-[#A0A0A0] line-through">
                              Rs. {Number(p.comparePrice).toLocaleString()}
                            </p>
                          )}
                        </td>

                        {/* Stock & Varieties */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
                              <FiPackage size={13} className="text-[#60717B]" />
                              <span>{totalVariantStock} units</span>
                            </div>
                            {hasVariants ? (
                              <div className="flex items-center gap-1 text-[11px] text-[#FF8C00] font-semibold">
                                <FiLayers size={11} />
                                <span>{p.variants.length} Varieties configured</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#A0A0A0]">Single item</span>
                            )}
                          </div>
                        </td>

                        {/* Submitter */}
                        <td className="px-4 py-3 text-[12px]">
                          <div className="flex items-center gap-1.5 text-[#1A1A1A] font-medium">
                            <FiUser size={12} className="text-[#60717B]" />
                            <span>{p.requestedBy?.name || 'Staff Admin'}</span>
                          </div>
                          <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                            {new Date(p.updatedAt || p.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg}`}
                          >
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </span>
                          {p.approvalNote && p.approvalStatus === 'rejected' && (
                            <p className="text-[11px] text-rose-600 mt-1 max-w-[180px] truncate" title={p.approvalNote}>
                              Reason: {p.approvalNote}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewProduct(p)}
                              title="Preview Details"
                              className="p-2 rounded-[6px] border border-[#E9E9E9] text-[#60717B] hover:text-[#1A1A1A] hover:bg-white transition-colors"
                            >
                              <FiEye size={14} />
                            </button>

                            {p.approvalStatus === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(p._id)}
                                  disabled={actionLoadingId === p._id}
                                  title="Approve & Publish to Store"
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-emerald-600 text-white font-bold text-[12px] hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                  {actionLoadingId === p._id ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectTarget(p);
                                    setRejectReason('');
                                  }}
                                  title="Reject Submission"
                                  className="p-1.5 rounded-[6px] border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <FiX size={14} />
                                </button>
                              </>
                            )}

                            {p.approvalStatus === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(p._id)}
                                disabled={actionLoadingId === p._id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-emerald-300 text-emerald-700 font-semibold text-[11px] hover:bg-emerald-50 transition-colors"
                              >
                                Re-approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#E9E9E9] flex items-center justify-between text-[12px] text-[#60717B]">
              <span>
                Page {page} of {totalPages} ({approvalsTotal} items)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded border border-[#E9E9E9] bg-white disabled:opacity-40 hover:bg-[#F4F5F7]"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded border border-[#E9E9E9] bg-white disabled:opacity-40 hover:bg-[#F4F5F7]"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reject Dialog Modal */}
        {rejectTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-[16px] max-w-md w-full p-6 shadow-2xl border border-[#E9E9E9] space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <FiAlertCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[#1A1A1A]">
                    Reject Submission
                  </h3>
                  <p className="text-[12px] text-[#60717B] truncate max-w-[260px]">
                    {rejectTarget.name}
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-[#60717B]">
                Please explain why this submission is being rejected so the staff admin can make the necessary corrections.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Rejection Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please verify variant 3 stock count before publishing, price looks incorrect..."
                  className="w-full p-3 text-[13px] border border-[#E9E9E9] rounded-[8px] bg-[#FAFAFA] focus:outline-none focus:border-[#FFB700]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-[8px] border border-[#E9E9E9] text-[13px] font-semibold text-[#60717B] hover:bg-[#FAFAFA]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  disabled={isRejecting}
                  className="px-4 py-2 rounded-[8px] bg-rose-600 text-white text-[13px] font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRejecting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Preview Modal */}
        {previewProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-[16px] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E9E9E9] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E9E9E9] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[16px] text-[#1A1A1A]">
                    Product Inspection Preview
                  </h3>
                  <p className="text-[12px] text-[#60717B]">
                    {previewProduct.productCode} • {previewProduct.category?.name || 'Category'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="p-2 rounded-full hover:bg-[#F4F5F7] text-[#60717B]"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-[13px]">
                {/* Images */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-2">
                    Images ({previewProduct.images?.length || 0})
                  </h4>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {(previewProduct.images || []).map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-[8px] border border-[#E9E9E9]"
                      />
                    ))}
                  </div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-2 gap-4 bg-[#FAFAFA] p-4 rounded-[10px] border border-[#E9E9E9]">
                  <div>
                    <span className="text-[11px] text-[#60717B]">Product Name</span>
                    <p className="font-bold text-[#1A1A1A] mt-0.5">{previewProduct.name}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#60717B]">Brand</span>
                    <p className="font-bold text-[#1A1A1A] mt-0.5">
                      {previewProduct.brand?.name || 'No Brand'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#60717B]">Selling Price</span>
                    <p className="font-bold text-[#1A1A1A] mt-0.5">
                      Rs. {Number(previewProduct.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#60717B]">Base Stock</span>
                    <p className="font-bold text-[#1A1A1A] mt-0.5">
                      {previewProduct.stock} units
                    </p>
                  </div>
                </div>

                {/* Varieties / Variants */}
                {Array.isArray(previewProduct.variants) && previewProduct.variants.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-2">
                      Configured Varieties & Stock ({previewProduct.variants.length})
                    </h4>
                    <div className="border border-[#E9E9E9] rounded-[8px] overflow-hidden">
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-[#FAFAFA] border-b border-[#E9E9E9] text-[#60717B]">
                          <tr>
                            <th className="px-3 py-2">Variant</th>
                            <th className="px-3 py-2">SKU / Code</th>
                            <th className="px-3 py-2">Price (Rs.)</th>
                            <th className="px-3 py-2 text-right">Stock Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0]">
                          {previewProduct.variants.map((v, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-semibold text-[#1A1A1A]">
                                {v.name || `Variety ${idx + 1}`}
                              </td>
                              <td className="px-3 py-2 font-mono text-[#60717B]">
                                {v.variantCode || v.sku || '—'}
                              </td>
                              <td className="px-3 py-2">
                                {Number(v.price || previewProduct.price).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-700">
                                {v.stock} units
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#60717B] uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-[#60717B] whitespace-pre-line bg-[#FAFAFA] p-3 rounded-[8px] border border-[#E9E9E9] text-[12px] max-h-36 overflow-y-auto">
                    {previewProduct.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#E9E9E9] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="px-4 py-2 rounded-[8px] border border-[#E9E9E9] text-[13px] font-semibold text-[#60717B] hover:bg-white"
                >
                  Close Preview
                </button>
                {previewProduct.approvalStatus === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = previewProduct._id;
                      setPreviewProduct(null);
                      handleApprove(id);
                    }}
                    className="px-5 py-2 rounded-[8px] bg-emerald-600 text-white font-bold text-[13px] hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <FiCheck size={16} />
                    Approve & Publish Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Approve Confirmation Modal */}
        <ConfirmModal
          isOpen={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          onConfirm={handleBulkApprove}
          title={`Approve ${selectedIds.length} Products?`}
          message={`Are you sure you want to approve and publish all ${selectedIds.length} selected products immediately to the live website?`}
          confirmLabel={`Approve All (${selectedIds.length})`}
          variant="primary"
          loading={isBulkApproving}
        />

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </AdminLayout>
  );
}
