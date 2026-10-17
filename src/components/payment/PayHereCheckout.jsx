import { useState } from 'react';
import { startPayHerePayment } from '../../utils/payhere.js';
import toast from 'react-hot-toast';

export default function PayHereCheckout({ order, onError }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await startPayHerePayment(order._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      onError?.();
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full bg-[#FFB700] text-black font-bold text-[14px] py-3.5 rounded-[8px] hover:bg-amber-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Redirecting…' : `Pay Rs. ${order?.total?.toLocaleString()} with PayHere`}
    </button>
  );
}